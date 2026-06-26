import Link from 'next/link'
import { SiteHeader } from '@/components/marketing/site-header'
import { SiteFooter } from '@/components/marketing/site-footer'
import { ArrowLeft } from 'lucide-react'

const endpoints = [
  {
    method: 'POST',
    path: '/api/proof/generate',
    desc: 'Generate a Groth16 proof for a payroll batch. Runs client-side — this endpoint documents the snarkjs interface.',
    params: [
      { name: 'salaries', type: 'number[]', desc: 'Array of salary amounts (max 20)' },
      { name: 'minSalary', type: 'number', desc: 'Minimum salary floor for validation' },
    ],
    response: `{
  "proof": {
    "pi_a": ["0x...", "0x..."],
    "pi_b": [["0x...", "0x..."], ["0x...", "0x..."]],
    "pi_c": ["0x...", "0x..."],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": ["18500", "0", "5"]
}`,
  },
  {
    method: 'POST',
    path: '/api/contract/verify',
    desc: 'Submit a proof to the Soroban verifier contract on Stellar and record the payroll run.',
    params: [
      { name: 'proof', type: 'Proof', desc: 'Groth16 proof object from /api/proof/generate' },
      { name: 'publicSignals', type: 'string[]', desc: 'Public signals array' },
      { name: 'cycleId', type: 'string', desc: 'Human-readable payroll cycle identifier' },
      { name: 'employerAddress', type: 'string', desc: 'Stellar G... address of the employer' },
    ],
    response: `{
  "verified": true,
  "txHash": "e6b361204bb3a0d71a79ff7e...",
  "contractId": "CB2JUH7WZEFYDQTK53AA...",
  "ledger": 54219003,
  "timestamp": "2026-06-21T02:14:00Z"
}`,
  },
  {
    method: 'GET',
    path: '/api/runs/:id',
    desc: 'Fetch a payroll run record from the Soroban contract storage.',
    params: [
      { name: 'id', type: 'string', desc: 'Payroll run ID (employer + cycleId key)' },
    ],
    response: `{
  "employer": "GBJWSYN6DB3F2DHNL6HUI...",
  "cycleId": "June 2026",
  "totalUsdc": 18500,
  "nRecipients": 5,
  "proofVerified": true,
  "timestamp": 1750470840
}`,
  },
]

const methodColor: Record<string, string> = {
  GET: 'text-success bg-success/10',
  POST: 'text-primary bg-primary/10',
  DELETE: 'text-destructive bg-destructive/10',
}

export default function ApiPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16 lg:px-8">

        <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to docs
        </Link>

        <div className="mb-10">
          <div className="text-xs font-mono text-primary uppercase tracking-widest mb-3">API Reference</div>
          <h1 className="text-3xl font-bold text-foreground mb-3">ZeroWage API</h1>
          <p className="text-muted-foreground">Integrate ZeroWage proof generation and Stellar contract interaction into your own systems.</p>
        </div>

        {/* Contract info */}
        <div className="rounded-xl border border-border bg-card p-5 mb-10 space-y-2">
          <div className="text-sm font-medium text-foreground mb-3">Contract Details</div>
          {[
            { label: 'Network', value: 'Stellar Testnet' },
            { label: 'Contract ID', value: 'CB2JUH7WZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD' },
            { label: 'RPC URL', value: 'https://soroban-testnet.stellar.org' },
            { label: 'Network Passphrase', value: 'Test SDF Network ; September 2015' },
          ].map((row) => (
            <div key={row.label} className="flex gap-4 text-sm flex-wrap">
              <span className="text-muted-foreground w-36 shrink-0">{row.label}</span>
              <span className="font-mono text-xs text-foreground break-all">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Endpoints */}
        <div className="space-y-8">
          {endpoints.map((ep) => (
            <div key={ep.path} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <span className={`font-mono text-xs px-2 py-1 rounded font-semibold ${methodColor[ep.method]}`}>
                  {ep.method}
                </span>
                <code className="font-mono text-sm text-foreground">{ep.path}</code>
              </div>
              <div className="p-5 space-y-5">
                <p className="text-sm text-muted-foreground">{ep.desc}</p>

                {ep.params.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-foreground uppercase tracking-widest mb-3">Parameters</div>
                    <div className="rounded-lg border border-border divide-y divide-border">
                      {ep.params.map((p) => (
                        <div key={p.name} className="flex gap-4 px-4 py-3 flex-wrap">
                          <code className="font-mono text-xs text-primary w-32 shrink-0">{p.name}</code>
                          <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{p.type}</span>
                          <span className="text-xs text-muted-foreground flex-1">{p.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-medium text-foreground uppercase tracking-widest mb-3">Response</div>
                  <pre className="rounded-lg bg-background border border-border p-4 text-xs font-mono text-foreground overflow-x-auto">
                    {ep.response}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>

      </main>
      <SiteFooter />
    </div>
  )
}