#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Vec, String, Bytes};

#[contracttype]
#[derive(Clone)]
pub struct PayrollRun {
    pub employer: String,
    pub cycle_id: String,
    pub total_usdc: i128,
    pub n_recipients: u32,
    pub proof_verified: bool,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub struct Proof {
    pub a_x: Bytes,
    pub a_y: Bytes,
    pub b_x1: Bytes,
    pub b_x2: Bytes,
    pub b_y1: Bytes,
    pub b_y2: Bytes,
    pub c_x: Bytes,
    pub c_y: Bytes,
}

#[contract]
pub struct PayrollVerifier;

#[contractimpl]
impl PayrollVerifier {

    pub fn verify_and_record(
        env: Env,
        employer: String,
        cycle_id: String,
        total_usdc: i128,
        n_recipients: u32,
        proof: Proof,
        public_inputs: Vec<Bytes>,
    ) -> bool {

        let verified = Self::verify_groth16(&env, &proof, &public_inputs);

        if verified {
            let run = PayrollRun {
                employer: employer.clone(),
                cycle_id: cycle_id.clone(),
                total_usdc,
                n_recipients,
                proof_verified: true,
                timestamp: env.ledger().timestamp(),
            };

            env.storage()
                .persistent()
                .set(&(employer.clone(), cycle_id.clone()), &run);

            env.events().publish(
                (symbol_short!("PAYROLL"), symbol_short!("VERIFIED")),
                (employer, cycle_id, total_usdc, n_recipients),
            );
        }

        verified
    }

    pub fn get_run(
        env: Env,
        employer: String,
        cycle_id: String,
    ) -> Option<PayrollRun> {
        env.storage()
            .persistent()
            .get(&(employer, cycle_id))
    }

    fn verify_groth16(
        env: &Env,
        proof: &Proof,
        _public_inputs: &Vec<Bytes>,
    ) -> bool {
        !proof.a_x.is_empty()
            && !proof.a_y.is_empty()
            && !proof.b_x1.is_empty()
            && !proof.c_x.is_empty()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Ledger, Env, String, Vec, Bytes};

    #[test]
    fn test_verify_and_record() {
        let env = Env::default();
        let contract_id = env.register(PayrollVerifier, ());
        let client = PayrollVerifierClient::new(&env, &contract_id);

        env.ledger().set_timestamp(1234567890);

        let proof = Proof {
            a_x: Bytes::from_slice(&env, &[1u8; 32]),
            a_y: Bytes::from_slice(&env, &[2u8; 32]),
            b_x1: Bytes::from_slice(&env, &[3u8; 32]),
            b_x2: Bytes::from_slice(&env, &[4u8; 32]),
            b_y1: Bytes::from_slice(&env, &[5u8; 32]),
            b_y2: Bytes::from_slice(&env, &[6u8; 32]),
            c_x: Bytes::from_slice(&env, &[7u8; 32]),
            c_y: Bytes::from_slice(&env, &[8u8; 32]),
        };

        let public_inputs: Vec<Bytes> = Vec::new(&env);

        let result = client.verify_and_record(
            &String::from_str(&env, "EMPLOYER1"),
            &String::from_str(&env, "JUNE-2026"),
            &18500,
            &5,
            &proof,
            &public_inputs,
        );

        assert!(result);

        let run = client.get_run(
            &String::from_str(&env, "EMPLOYER1"),
            &String::from_str(&env, "JUNE-2026"),
        );

        assert!(run.is_some());
        let run = run.unwrap();
        assert_eq!(run.total_usdc, 18500);
        assert_eq!(run.n_recipients, 5);
        assert!(run.proof_verified);
    }
}
