const fs = require('fs');

const code = `#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    crypto::bn254::{
        Bn254G1Affine, Bn254G2Affine, Fr,
        BN254_G1_SERIALIZED_SIZE, BN254_G2_SERIALIZED_SIZE,
    },
    symbol_short, vec, Bytes, Env, String, Symbol, Vec, U256,
};

const VK_KEY: Symbol = symbol_short!("VK");
const APPROVERS_KEY: Symbol = symbol_short!("APRVRS");
const THRESHOLD_KEY: Symbol = symbol_short!("THRESH");

// ── Errors ────────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VerifierError {
    MalformedVerifyingKey   = 1,
    VerificationKeyNotSet   = 2,
    MalformedProof          = 3,
    MalformedPublicSignals  = 4,
    ProofAlreadyUsed        = 5,
    ProofVerificationFailed = 6,
    ApproverNotAuthorized   = 7,
    ThresholdNotMet         = 8,
    AlreadyApproved         = 9,
}

// ── Storage types ──────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone)]
pub struct PayrollRun {
    pub employer:       String,
    pub cycle_id:       String,
    pub total_usdc:     i128,
    pub n_recipients:   u32,
    pub proof_verified: bool,
    pub timestamp:      u64,
}

#[contracttype]
#[derive(Clone)]
pub struct ApprovalRecord {
    pub approvals:   Vec<String>,  // list of approver addresses who signed
    pub threshold:   u32,          // required number of approvals
    pub is_complete: bool,
}

// ── Internal types ─────────────────────────────────────────────────────────

#[derive(Clone)]
struct VerificationKey {
    alpha: Bn254G1Affine,
    beta:  Bn254G2Affine,
    gamma: Bn254G2Affine,
    delta: Bn254G2Affine,
    ic:    Vec<Bn254G1Affine>,
}

#[derive(Clone)]
struct Proof {
    a: Bn254G1Affine,
    b: Bn254G2Affine,
    c: Bn254G1Affine,
}

// ── Helpers ────────────────────────────────────────────────────────────────

fn take<const N: usize>(
    bytes: &Bytes,
    pos:   &mut u32,
    err:   VerifierError,
) -> Result<[u8; N], VerifierError> {
    let end = pos.checked_add(N as u32).ok_or(err)?;
    if end > bytes.len() { return Err(err); }
    let mut arr = [0u8; N];
    bytes.slice(*pos..end).copy_into_slice(&mut arr);
    *pos = end;
    Ok(arr)
}

impl VerificationKey {
    fn from_bytes(env: &Env, bytes: &Bytes) -> Result<Self, VerifierError> {
        let mut pos = 0u32;
        let e = VerifierError::MalformedVerifyingKey;
        let alpha = Bn254G1Affine::from_array(env, &take::<BN254_G1_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let beta  = Bn254G2Affine::from_array(env, &take::<BN254_G2_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let gamma = Bn254G2Affine::from_array(env, &take::<BN254_G2_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let delta = Bn254G2Affine::from_array(env, &take::<BN254_G2_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let ic_len = u32::from_be_bytes(take::<4>(bytes, &mut pos, e)?);
        let mut ic = Vec::new(env);
        for _ in 0..ic_len {
            ic.push_back(Bn254G1Affine::from_array(
                env, &take::<BN254_G1_SERIALIZED_SIZE>(bytes, &mut pos, e)?,
            ));
        }
        if pos != bytes.len() || ic_len == 0 { return Err(e); }
        Ok(Self { alpha, beta, gamma, delta, ic })
    }
}

impl Proof {
    fn from_bytes(env: &Env, bytes: &Bytes) -> Result<Self, VerifierError> {
        let mut pos = 0u32;
        let e = VerifierError::MalformedProof;
        let a = Bn254G1Affine::from_array(env, &take::<BN254_G1_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let b = Bn254G2Affine::from_array(env, &take::<BN254_G2_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        let c = Bn254G1Affine::from_array(env, &take::<BN254_G1_SERIALIZED_SIZE>(bytes, &mut pos, e)?);
        if pos != bytes.len() { return Err(e); }
        Ok(Self { a, b, c })
    }
}

fn parse_public_signals(env: &Env, bytes: &Bytes) -> Result<Vec<Fr>, VerifierError> {
    let mut pos = 0u32;
    let e = VerifierError::MalformedPublicSignals;
    let len = u32::from_be_bytes(take::<4>(bytes, &mut pos, e)?);
    let mut signals = Vec::new(env);
    for _ in 0..len {
        let arr  = take::<32>(bytes, &mut pos, e)?;
        let u256 = U256::from_be_bytes(env, &Bytes::from_array(env, &arr));
        signals.push_back(Fr::from_u256(u256));
    }
    if pos != bytes.len() { return Err(e); }
    Ok(signals)
}

fn nullifier_from_proof(env: &Env, proof_bytes: &Bytes) -> Bytes {
    let hash = env.crypto().sha256(proof_bytes);
    Bytes::from_array(env, &hash.to_array())
}

fn verify_groth16(
    env:         &Env,
    vk:          VerificationKey,
    proof:       Proof,
    pub_signals: Vec<Fr>,
) -> Result<bool, VerifierError> {
    if pub_signals.len() + 1 != vk.ic.len() {
        return Err(VerifierError::MalformedVerifyingKey);
    }
    let bn = env.crypto().bn254();
    let mut vk_x = vk.ic.get(0).unwrap();
    for (s, v) in pub_signals.iter().zip(vk.ic.iter().skip(1)) {
        let prod = bn.g1_mul(&v, &s);
        vk_x = bn.g1_add(&vk_x, &prod);
    }
    let neg_a = -proof.a;
    let vp1 = vec![env, neg_a,   vk.alpha, vk_x,     proof.c];
    let vp2 = vec![env, proof.b, vk.beta,  vk.gamma, vk.delta];
    Ok(bn.pairing_check(vp1, vp2))
}

// ── Contract ───────────────────────────────────────────────────────────────

#[contract]
pub struct PayrollVerifier;

#[contractimpl]
impl PayrollVerifier {

    /// Store the Groth16 verification key on-chain.
    pub fn set_vk(env: Env, vk_bytes: Bytes) -> Result<(), VerifierError> {
        let _vk = VerificationKey::from_bytes(&env, &vk_bytes)?;
        env.storage().instance().set(&VK_KEY, &vk_bytes);
        Ok(())
    }

    /// Configure M-of-N approver wallets on-chain.
    /// approvers: list of authorized Stellar G... addresses
    /// threshold: how many must approve before verify_and_record accepts
    pub fn set_approvers(
        env:       Env,
        approvers: Vec<String>,
        threshold: u32,
    ) -> Result<(), VerifierError> {
        env.storage().instance().set(&APPROVERS_KEY, &approvers);
        env.storage().instance().set(&THRESHOLD_KEY, &threshold);
        Ok(())
    }

    /// Record one approver's signature for a pending payroll run.
    /// run_key: "{employer}:{cycle_id}" — uniquely identifies the run
    /// approver: the Stellar address approving
    /// Returns how many approvals have been collected so far.
    pub fn record_approval(
        env:      Env,
        run_key:  String,
        approver: String,
    ) -> Result<u32, VerifierError> {

        // Check approver is in the authorized list (if configured)
        let approvers_opt: Option<Vec<String>> = env
            .storage().instance().get(&APPROVERS_KEY);

        if let Some(approvers) = approvers_opt.clone() {
            let is_authorized = approvers.iter().any(|a| a == approver);
            if !is_authorized {
                return Err(VerifierError::ApproverNotAuthorized);
            }
        }

        // Load existing approval record for this run
        let approval_key = (symbol_short!("APPR"), run_key.clone());
        let mut record: ApprovalRecord = env
            .storage()
            .persistent()
            .get(&approval_key)
            .unwrap_or(ApprovalRecord {
                approvals:   Vec::new(&env),
                threshold:   env.storage().instance()
                               .get(&THRESHOLD_KEY)
                               .unwrap_or(1u32),
                is_complete: false,
            });

        // Check this approver hasn't already approved
        let already = record.approvals.iter().any(|a| a == approver);
        if already {
            return Err(VerifierError::AlreadyApproved);
        }

        // Add approval
        record.approvals.push_back(approver.clone());
        let count = record.approvals.len();

        // Check if threshold is met
        if count >= record.threshold {
            record.is_complete = true;
        }

        env.storage().persistent().set(&approval_key, &record);

        // Emit approval event
        env.events().publish(
            (symbol_short!("PAYROLL"), symbol_short!("APPROVED")),
            (run_key, approver, count),
        );

        Ok(count)
    }

    /// Get current approval status for a run.
    pub fn get_approval_status(
        env:     Env,
        run_key: String,
    ) -> Option<ApprovalRecord> {
        let approval_key = (symbol_short!("APPR"), run_key);
        env.storage().persistent().get(&approval_key)
    }

    /// Verify a Groth16 proof and record the payroll run on-chain.
    /// If approvers are configured, checks that threshold is met first.
    pub fn verify_and_record(
        env:               Env,
        employer:          String,
        cycle_id:          String,
        total_usdc:        i128,
        n_recipients:      u32,
        proof_bytes:       Bytes,
        pub_signals_bytes: Bytes,
    ) -> Result<bool, VerifierError> {

        // 1. Check multi-sig threshold if approvers are configured
        let threshold_opt: Option<u32> = env
            .storage().instance().get(&THRESHOLD_KEY);

        if let Some(threshold) = threshold_opt {
            if threshold > 1 {
                let run_key = String::from_str(
                    &env,
                    &soroban_sdk::xdr::ToXdr::to_xdr(
                        &employer, &env
                    ).to_string()
                );
                // Build run key as employer + cycle_id
                let approval_key = (
                    symbol_short!("APPR"),
                    (employer.clone(), cycle_id.clone()),
                );
                let record: Option<ApprovalRecord> = env
                    .storage().persistent().get(&approval_key);

                match record {
                    Some(r) if r.is_complete => {},
                    _ => return Err(VerifierError::ThresholdNotMet),
                }
            }
        }

        // 2. Nullifier check
        let nullifier  = nullifier_from_proof(&env, &proof_bytes);
        let null_key   = (symbol_short!("NULL"), nullifier.clone());
        if env.storage().persistent().has(&null_key) {
            return Err(VerifierError::ProofAlreadyUsed);
        }

        // 3. Load VK
        let vk_bytes: Bytes = env
            .storage().instance().get(&VK_KEY)
            .ok_or(VerifierError::VerificationKeyNotSet)?;

        // 4. Deserialize
        let vk          = VerificationKey::from_bytes(&env, &vk_bytes)?;
        let proof       = Proof::from_bytes(&env, &proof_bytes)?;
        let pub_signals = parse_public_signals(&env, &pub_signals_bytes)?;

        // 5. BN254 Groth16 pairing verification
        let verified = verify_groth16(&env, vk, proof, pub_signals)?;
        if !verified {
            return Err(VerifierError::ProofVerificationFailed);
        }

        // 6. Store nullifier
        env.storage().persistent().set(&null_key, &true);

        // 7. Record run
        let run = PayrollRun {
            employer:       employer.clone(),
            cycle_id:       cycle_id.clone(),
            total_usdc,
            n_recipients,
            proof_verified: true,
            timestamp:      env.ledger().timestamp(),
        };
        env.storage().persistent().set(&(employer.clone(), cycle_id.clone()), &run);

        // 8. Emit event
        env.events().publish(
            (symbol_short!("PAYROLL"), symbol_short!("VERIFIED")),
            (employer, cycle_id, total_usdc, n_recipients),
        );

        Ok(true)
    }

    /// Fetch a stored payroll run.
    pub fn get_run(env: Env, employer: String, cycle_id: String) -> Option<PayrollRun> {
        env.storage().persistent().get(&(employer, cycle_id))
    }

    /// Check if a proof nullifier has been used.
    pub fn is_nullifier_used(env: Env, proof_bytes: Bytes) -> bool {
        let nullifier = nullifier_from_proof(&env, &proof_bytes);
        let null_key  = (symbol_short!("NULL"), nullifier);
        env.storage().persistent().has(&null_key)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Ledger, Env, String, Bytes, Vec};

    fn dummy_proof(env: &Env) -> Bytes {
        Bytes::from_slice(env, &[7u8; 256])
    }

    fn dummy_public_signals(env: &Env) -> Bytes {
        let mut b = Bytes::new(env);
        b.extend_from_array(&4u32.to_be_bytes());
        for _ in 0..4 { b.extend_from_array(&[0u8; 32]); }
        b
    }

    fn dummy_vk_bytes(env: &Env) -> Bytes {
        let mut b = Bytes::new(env);
        b.extend_from_array(&[1u8; 64]);
        b.extend_from_array(&[2u8; 128]);
        b.extend_from_array(&[3u8; 128]);
        b.extend_from_array(&[4u8; 128]);
        b.extend_from_array(&5u32.to_be_bytes());
        for _ in 0..5 { b.extend_from_array(&[5u8; 64]); }
        b
    }

    #[test]
    fn test_vk_not_set_returns_error() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        env.ledger().set_timestamp(1234567890);
        let result = client.try_verify_and_record(
            &String::from_str(&env, "EMPLOYER1"),
            &String::from_str(&env, "JUNE-2026"),
            &18500, &5,
            &dummy_proof(&env),
            &dummy_public_signals(&env),
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_malformed_proof_rejected() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        env.ledger().set_timestamp(1234567890);
        client.set_vk(&dummy_vk_bytes(&env));
        let bad_proof = Bytes::from_slice(&env, &[1u8; 10]);
        let result = client.try_verify_and_record(
            &String::from_str(&env, "EMPLOYER1"),
            &String::from_str(&env, "JUNE-2026"),
            &18500, &5, &bad_proof,
            &dummy_public_signals(&env),
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_malformed_public_signals_rejected() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        env.ledger().set_timestamp(1234567890);
        client.set_vk(&dummy_vk_bytes(&env));
        let mut bad_signals = Bytes::new(&env);
        bad_signals.extend_from_array(&4u32.to_be_bytes());
        bad_signals.extend_from_array(&[0u8; 32]);
        let result = client.try_verify_and_record(
            &String::from_str(&env, "EMPLOYER1"),
            &String::from_str(&env, "JUNE-2026"),
            &18500, &5,
            &dummy_proof(&env),
            &bad_signals,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_malformed_vk_rejected_at_set_time() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        let bad_vk = Bytes::from_slice(&env, &[9u8; 20]);
        let result = client.try_set_vk(&bad_vk);
        assert!(result.is_err());
    }

    #[test]
    fn test_get_run_returns_none_when_not_recorded() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        env.ledger().set_timestamp(1234567890);
        let run = client.get_run(
            &String::from_str(&env, "NEVER-RAN-PAYROLL"),
            &String::from_str(&env, "JUNE-2026"),
        );
        assert!(run.is_none());
    }

    #[test]
    fn test_nullifier_unused_by_default() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        let used = client.is_nullifier_used(&dummy_proof(&env));
        assert_eq!(used, false);
    }

    #[test]
    fn test_set_approvers_and_record_approval() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        env.ledger().set_timestamp(1234567890);

        let approver1 = String::from_str(&env, "GCFO1AAAA");
        let approver2 = String::from_str(&env, "GCFO2BBBB");

        let mut approvers = Vec::new(&env);
        approvers.push_back(approver1.clone());
        approvers.push_back(approver2.clone());

        // Set 2-of-2 threshold
        client.set_approvers(&approvers, &2u32);

        // First approval
        let run_key = String::from_str(&env, "EMPLOYER1:JUNE-2026");
        let count1 = client.record_approval(&run_key, &approver1).unwrap();
        assert_eq!(count1, 1);

        // Second approval — threshold met
        let count2 = client.record_approval(&run_key, &approver2).unwrap();
        assert_eq!(count2, 2);

        // Check status
        let status = client.get_approval_status(&run_key);
        assert!(status.is_some());
        assert!(status.unwrap().is_complete);
    }

    #[test]
    fn test_unauthorized_approver_rejected() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);

        let authorized = String::from_str(&env, "GCFO1AAAA");
        let unauthorized = String::from_str(&env, "GRANDO999");

        let mut approvers = Vec::new(&env);
        approvers.push_back(authorized.clone());
        client.set_approvers(&approvers, &1u32);

        let run_key = String::from_str(&env, "EMPLOYER1:JUNE-2026");
        let result = client.try_record_approval(&run_key, &unauthorized);
        assert!(result.is_err());
    }

    #[test]
    fn test_double_approval_rejected() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);

        let approver = String::from_str(&env, "GCFO1AAAA");
        let mut approvers = Vec::new(&env);
        approvers.push_back(approver.clone());
        client.set_approvers(&approvers, &1u32);

        let run_key = String::from_str(&env, "EMPLOYER1:JUNE-2026");
        client.record_approval(&run_key, &approver).unwrap();

        // Second approval from same wallet — must fail
        let result = client.try_record_approval(&run_key, &approver);
        assert!(result.is_err());
    }

    #[test]
    fn test_vk_can_be_updated_with_new_bytes() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        let result1 = client.try_set_vk(&dummy_vk_bytes(&env));
        assert!(result1.is_ok());
        let result2 = client.try_set_vk(&dummy_vk_bytes(&env));
        assert!(result2.is_ok());
    }

    #[test]
    fn test_get_run_returns_stored_run_fields() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        env.ledger().set_timestamp(9999999);

        let employer = String::from_str(&env, "GTEST123");
        let cycle    = String::from_str(&env, "JULY-2026");

        env.as_contract(&contract_id, || {
            let run = PayrollRun {
                employer:       employer.clone(),
                cycle_id:       cycle.clone(),
                total_usdc:     42000,
                n_recipients:   7,
                proof_verified: true,
                timestamp:      9999999,
            };
            env.storage().persistent().set(&(employer.clone(), cycle.clone()), &run);
        });

        let result = client.get_run(&employer, &cycle);
        assert!(result.is_some());
        let run = result.unwrap();
        assert_eq!(run.total_usdc, 42000);
        assert_eq!(run.n_recipients, 7);
        assert_eq!(run.proof_verified, true);
        assert_eq!(run.timestamp, 9999999);
    }
}
`;

fs.writeFileSync('contracts/hello-world/src/lib.rs', code);
console.log('Contract v2 written');