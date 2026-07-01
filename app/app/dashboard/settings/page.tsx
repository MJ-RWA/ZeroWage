'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

function Field({
  label,
  value,
  hint,
  readOnly = false,
  onChange,
}: {
  label: string
  value: string
  hint?: string
  readOnly?: boolean
  onChange?: (v: string) => void
}) {
  return (
     <div className="grid grid-cols-1 gap-2 border-b border-border py-5 last:border-0 md:grid-cols-[240px_1fr] md:items-center md:gap-6">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      <input
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 read-only:opacity-60 read-only:cursor-not-allowed"
      />
    </div>
  )
}

const SETTINGS_KEY = 'zerowage_settings'

interface Settings {
  adminName: string
  companyName: string
  treasuryWallet: string
  defaultAsset: string
  role: string
  teamSize: string
  approverWallet: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
   adminName: '',
   companyName: '',
   treasuryWallet: '',
   defaultAsset: 'USDC',
   role: '',
   teamSize: '',
   approverWallet: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load wallet from Freighter if available
    async function load() {
      try {
        const stored = localStorage.getItem(SETTINGS_KEY)
        if (stored) {
          setSettings(JSON.parse(stored))
          return
        }
        // Try to get wallet from Freighter
        const { isConnected, getAddress } = await import(
          '@stellar/freighter-api'
        )
        const conn = await isConnected()
        if (conn?.isConnected) {
          const result = await getAddress()
          if (result?.address) {
            setSettings((prev) => ({
              ...prev,
              treasuryWallet: result.address,
            }))
          }
        }
      } catch {}
    }
    load()
  }, [])

  function save() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your organization, treasury, and proof configuration.
      </p>

      {/* Organization */}
      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-foreground">Organization</h2>
        <div className="mt-1 text-xs text-muted-foreground">
          Company: {settings.companyName || 'Not set'}
        </div>
        <div className="mt-2">
          <Field
            label="Company name"
            value={settings.companyName}
            hint="Used in payroll attestations"
            onChange={(v) =>
              setSettings((prev) => ({ ...prev, companyName: v }))
            }
          />
          <Field
            label="Treasury wallet"
            value={settings.treasuryWallet}
            hint="Stellar account funding payroll disbursements"
            onChange={(v) =>
              setSettings((prev) => ({ ...prev, treasuryWallet: v }))
            }
          />
             
         <Field
            label="Approver wallet"
            value={settings.approverWallet || ''}
            hint="CFO or designated approver Stellar address"
            onChange={(v) =>
            setSettings((prev) => ({ ...prev, approverWallet: v }))
           }
          />

          <Field
            label="Default asset"
            value={settings.defaultAsset}
            hint="Used for new payroll runs"
            onChange={(v) =>
              setSettings((prev) => ({ ...prev, defaultAsset: v }))
            }
          />
        </div>
      </section>

      {/* Proof configuration — read only */}
      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium text-foreground">
          Proof configuration
        </h2>
        <div className="mt-2">
          <Field
            label="Circuit"
            value="payroll.circom"
            hint="Circom 2.2.2 · Groth16 proving system"
            readOnly
          />
          <Field
            label="Constraints"
            value="660"
            hint="Non-linear constraints in the circuit"
            readOnly
          />
          <Field
            label="Curve"
            value="BN254 (alt_bn128)"
            hint="Elliptic curve for Groth16"
            readOnly
          />
          <Field
            label="Verifier contract"
            value="CCOEJ6QCZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD"
            hint="Soroban verifier on Stellar testnet"
            readOnly
          />
          <Field
            label="Network"
            value="Stellar Testnet"
            hint="Test SDF Network ; September 2015"
            readOnly
          />
        </div>
      </section>

      <div className="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          className="border-border bg-background hover:bg-accent"
          onClick={() => {
            const stored = localStorage.getItem(SETTINGS_KEY)
            if (stored) setSettings(JSON.parse(stored))
          }}
        >
          Cancel
        </Button>
        <Button onClick={save} className="gap-2">
          {saved ? (
            <>
              <Check size={14} />
              Saved
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </div>
  )
}