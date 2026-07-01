#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype,
    crypto::bn254::{
        Bn254G1Affine, Bn254G2Affine, Fr,
        BN254_G1_SERIALIZED_SIZE, BN254_G2_SERIALIZED_SIZE,
    },
    symbol_short, vec, Bytes, Env, String, Symbol, Vec, U256,
};

// Storage keys
const VK_KEY: Symbol = symbol_short!("VK");

// ── Errors ────────────────────────────────────────────────────────────────────

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
}

// ── On-chain payroll record ────────────────────────────────────────────────────

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

// ── Internal types ─────────────────────────────────────────────────────────────

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

// ── Byte-slice helper ──────────────────────────────────────────────────────────

fn take<const N: usize>(
    bytes: &Bytes,
    pos:   &mut u32,
    err:   VerifierError,
) -> Result<[u8; N], VerifierError> {
    let end = pos.checked_add(N as u32).ok_or(err)?;
    if end > bytes.len() {
        return Err(err);
    }
    let mut arr = [0u8; N];
    bytes.slice(*pos..end).copy_into_slice(&mut arr);
    *pos = end;
    Ok(arr)
}

// ── Deserialization ────────────────────────────────────────────────────────────

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
                env,
                &take::<BN254_G1_SERIALIZED_SIZE>(bytes, &mut pos, e)?,
            ));
        }

        if pos != bytes.len() || ic_len == 0 {
            return Err(e);
        }
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

        if pos != bytes.len() {
            return Err(e);
        }
        Ok(Self { a, b, c })
    }
}

fn parse_public_signals(
    env:   &Env,
    bytes: &Bytes,
) -> Result<Vec<Fr>, VerifierError> {
    let mut pos = 0u32;
    let e = VerifierError::MalformedPublicSignals;

    let len = u32::from_be_bytes(take::<4>(bytes, &mut pos, e)?);
    let mut signals = Vec::new(env);
    for _ in 0..len {
        let arr  = take::<32>(bytes, &mut pos, e)?;
        let u256 = U256::from_be_bytes(env, &Bytes::from_array(env, &arr));
        signals.push_back(Fr::from_u256(u256));
    }

    if pos != bytes.len() {
        return Err(e);
    }
    Ok(signals)
}

// ── Core Groth16 verification ──────────────────────────────────────────────────

fn verify_groth16(
    env:        &Env,
    vk:         VerificationKey,
    proof:      Proof,
    pub_signals: Vec<Fr>,
) -> Result<bool, VerifierError> {
    if pub_signals.len() + 1 != vk.ic.len() {
        return Err(VerifierError::MalformedVerifyingKey);
    }

    let bn = env.crypto().bn254();

    // vk_x = IC[0] + sum(pub_signals[i] * IC[i+1])
    let mut vk_x = vk.ic.get(0).unwrap();
    for (s, v) in pub_signals.iter().zip(vk.ic.iter().skip(1)) {
        let prod = bn.g1_mul(&v, &s);
        vk_x = bn.g1_add(&vk_x, &prod);
    }

    // Groth16 pairing equation:
    // e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1
    let neg_a = -proof.a;
    let vp1 = vec![env, neg_a,    vk.alpha, vk_x, proof.c];
    let vp2 = vec![env, proof.b,  vk.beta,  vk.gamma, vk.delta];

    Ok(bn.pairing_check(vp1, vp2))
}

// ── Contract ───────────────────────────────────────────────────────────────────

#[contract]
pub struct PayrollVerifier;

#[contractimpl]
impl PayrollVerifier {

    /// Store the Groth16 verification key on-chain.
    /// Must be called once after deployment with the encoded vk bytes.
    pub fn set_vk(env: Env, vk_bytes: Bytes) -> Result<(), VerifierError> {
        // Parse first — malformed keys fail fast and cannot be stored
        let _vk = VerificationKey::from_bytes(&env, &vk_bytes)?;
        env.storage().instance().set(&VK_KEY, &vk_bytes);
        Ok(())
    }

    /// Verify a Groth16 proof and record the payroll run on-chain.
    /// Prevents replay attacks via a proof nullifier stored in persistent storage.
    pub fn verify_and_record(
        env:          Env,
        employer:     String,
        cycle_id:     String,
        total_usdc:   i128,
        n_recipients: u32,
        proof_bytes:  Bytes,
        pub_signals_bytes: Bytes,
    ) -> Result<bool, VerifierError> {

         // ── 1. Nullifier check (replay protection) ─────────────────────────
// Nullifier = first 32 bytes of sha256(proof_bytes), stored as Bytes
let nullifier_bytes: Bytes = {
    let h = env.crypto().sha256(&proof_bytes);
    let mut b = Bytes::new(&env);
    for byte in h.to_array().iter() {
        b.push_back(*byte);
    }
    b
};
let nullifier_key = (symbol_short!("NULL"), nullifier_bytes.clone());

if env.storage().persistent().has(&nullifier_key) {
    return Err(VerifierError::ProofAlreadyUsed);
}

        // ── 2. Load verification key ───────────────────────────────────────
        let vk_bytes: Bytes = env
            .storage()
            .instance()
            .get(&VK_KEY)
            .ok_or(VerifierError::VerificationKeyNotSet)?;

        // ── 3. Deserialize proof and public signals ────────────────────────
        let vk         = VerificationKey::from_bytes(&env, &vk_bytes)?;
        let proof      = Proof::from_bytes(&env, &proof_bytes)?;
        let pub_signals = parse_public_signals(&env, &pub_signals_bytes)?;

        // ── 4. Real BN254 Groth16 pairing verification ────────────────────
        let verified = verify_groth16(&env, vk, proof, pub_signals)?;

        if !verified {
            return Err(VerifierError::ProofVerificationFailed);
        }

        // ── 5. Store nullifier (prevents proof reuse) ─────────────────────
        env.storage().persistent().set(&nullifier_key, &true);

        // ── 6. Record payroll run on-chain ────────────────────────────────
        let run = PayrollRun {
            employer:       employer.clone(),
            cycle_id:       cycle_id.clone(),
            total_usdc,
            n_recipients,
            proof_verified: true,
            timestamp:      env.ledger().timestamp(),
        };

        let run_key = (employer.clone(), cycle_id.clone());
        env.storage().persistent().set(&run_key, &run);

        // ── 7. Emit event ─────────────────────────────────────────────────
        env.events().publish(
            (symbol_short!("PAYROLL"), symbol_short!("VERIFIED")),
            (employer, cycle_id, total_usdc, n_recipients),
        );

        Ok(true)
    }

    /// Fetch a stored payroll run by employer + cycle_id.
    pub fn get_run(
        env:      Env,
        employer: String,
        cycle_id: String,
    ) -> Option<PayrollRun> {
        env.storage()
            .persistent()
            .get(&(employer, cycle_id))
    }

    /// Check if a proof nullifier has already been used.
      pub fn is_nullifier_used(env: Env, proof_bytes: Bytes) -> bool {
    let nullifier_bytes: Bytes = {
        let h = env.crypto().sha256(&proof_bytes);
        let mut b = Bytes::new(&env);
        for byte in h.to_array().iter() {
            b.push_back(*byte);
        }
        b
    };
    let nullifier_key = (symbol_short!("NULL"), nullifier_bytes);
    env.storage().persistent().has(&nullifier_key)
}
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Ledger, Env, String, Bytes};

    // Helper: build a syntactically valid but cryptographically meaningless
    // proof and VK for structural tests (won't pass real verification,
    // but lets us test storage/access logic in isolation)
    fn dummy_proof(env: &Env) -> Bytes {
        // pi_a (64) + pi_b (128) + pi_c (64) = 256 bytes
        Bytes::from_slice(env, &[7u8; 256])
    }

    fn dummy_public_signals(env: &Env) -> Bytes {
        // 4-byte len prefix + 4 signals * 32 bytes = 132 bytes
        let mut b = Bytes::new(env);
        b.extend_from_array(&4u32.to_be_bytes());
        for _ in 0..4 {
            b.extend_from_array(&[0u8; 32]);
        }
        b
    }

    fn dummy_vk_bytes(env: &Env) -> Bytes {
        // alpha(64) + beta(128) + gamma(128) + delta(128) + ic_len(4) + 5*ic(320) = 772
        let mut b = Bytes::new(env);
        b.extend_from_array(&[1u8; 64]);   // alpha
        b.extend_from_array(&[2u8; 128]);  // beta
        b.extend_from_array(&[3u8; 128]);  // gamma
        b.extend_from_array(&[4u8; 128]);  // delta
        b.extend_from_array(&5u32.to_be_bytes()); // IC count
        for _ in 0..5 {
            b.extend_from_array(&[5u8; 64]);
        }
        b
    }

    // ── Test 1: VK not set rejects verification ─────────────────────────
    #[test]
    fn test_vk_not_set_returns_error() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        env.ledger().set_timestamp(1234567890);

        let result = client.try_verify_and_record(
            &String::from_str(&env, "EMPLOYER1"),
            &String::from_str(&env, "JUNE-2026"),
            &18500,
            &5,
            &dummy_proof(&env),
            &dummy_public_signals(&env),
        );

        assert!(result.is_err());
    }

    // ── Test 2: malformed proof bytes are rejected before pairing check ──
    #[test]
    fn test_malformed_proof_rejected() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        env.ledger().set_timestamp(1234567890);

        // Set a structurally valid VK first
        client.set_vk(&dummy_vk_bytes(&env));

        // Proof that's too short — should fail to deserialize, not panic
        let bad_proof = Bytes::from_slice(&env, &[1u8; 10]);

        let result = client.try_verify_and_record(
            &String::from_str(&env, "EMPLOYER1"),
            &String::from_str(&env, "JUNE-2026"),
            &18500,
            &5,
            &bad_proof,
            &dummy_public_signals(&env),
        );

        assert!(result.is_err());
    }

    // ── Test 3: malformed public signals are rejected ────────────────────
    #[test]
    fn test_malformed_public_signals_rejected() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);
        env.ledger().set_timestamp(1234567890);

        client.set_vk(&dummy_vk_bytes(&env));

        // Public signals claiming 4 entries but only providing data for 1
        let mut bad_signals = Bytes::new(&env);
        bad_signals.extend_from_array(&4u32.to_be_bytes());
        bad_signals.extend_from_array(&[0u8; 32]); // only one 32-byte chunk

        let result = client.try_verify_and_record(
            &String::from_str(&env, "EMPLOYER1"),
            &String::from_str(&env, "JUNE-2026"),
            &18500,
            &5,
            &dummy_proof(&env),
            &bad_signals,
        );

        assert!(result.is_err());
    }

    // ── Test 4: malformed verification key is rejected at set_vk time ────
    #[test]
    fn test_malformed_vk_rejected_at_set_time() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);

        // Too short to contain even alpha + beta
        let bad_vk = Bytes::from_slice(&env, &[9u8; 20]);

        let result = client.try_set_vk(&bad_vk);
        assert!(result.is_err());
    }

    // ── Test 5: get_run returns None for a run that was never recorded ───
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

    // ── Test 6: is_nullifier_used correctly reports false for unused proof ─
    #[test]
    fn test_nullifier_unused_by_default() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);

        let used = client.is_nullifier_used(&dummy_proof(&env));
        assert_eq!(used, false);
    }
}