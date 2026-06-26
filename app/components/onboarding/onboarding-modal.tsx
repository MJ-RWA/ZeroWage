'use client'

import { useState, useEffect } from 'react'
import { Shield, ArrowRight, Check, Building2, Users, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ONBOARDING_KEY = 'zerowage_onboarding_complete'
const SETTINGS_KEY = 'zerowage_settings'

interface OnboardingData {
  adminName: string
  companyName: string
  role: string
  teamSize: string
  wallet: string
}

const roles = ['Founder / CEO', 'CFO / Finance', 'HR Admin', 'DAO Treasurer', 'Developer']
const teamSizes = ['1–10', '10–50', '50–200', '200+']

export function OnboardingModal({ walletAddress }: { walletAddress?: string }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    adminName: '',
    companyName: '',
    role: '',
    teamSize: '',
    wallet: walletAddress || '',
  })

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done && walletAddress) setVisible(true)
  }, [walletAddress])

  function complete() {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        adminName: data.adminName,
        companyName: data.companyName,
        treasuryWallet: walletAddress || '',
        defaultAsset: 'USDC',
        role: data.role,
        teamSize: data.teamSize,
      })
    )
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl mx-4">

        {/* Header */}
        <div className="border-b border-border px-6 py-5 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Shield size={16} className="text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Welcome to ZeroWage</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Step {step} of 3 — {step === 1 ? 'Your company' : step === 2 ? 'Your role' : 'Confirm'}
            </div>
          </div>
          {/* Progress dots */}
          <div className="ml-auto flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s <= step ? 'w-4 bg-primary' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
        </div>

          {step === 1 && (
        <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
        <Building2 size={18} className="text-muted-foreground" />
        </div>
        <div>
        <h2 className="font-semibold text-foreground">Let's set up your workspace</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Takes 30 seconds</p>
        </div>
        </div>
        <div className="space-y-4">
        <div>
        <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-2">
          Your name
        </label>
        <input
          autoFocus
          value={data.adminName}
          onChange={(e) => setData((prev) => ({ ...prev, adminName: e.target.value }))}
          placeholder="Alex Johnson"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-colors"
        />
        </div>
        <div>
        <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-2">
          Company name
        </label>
        <input
          value={data.companyName}
          onChange={(e) => setData((prev) => ({ ...prev, companyName: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && data.companyName.trim() && data.adminName.trim()) setStep(2)
          }}
          placeholder="Acme Corp"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-colors"
        />
        </div>
        <div className="rounded-lg bg-secondary/50 border border-border px-4 py-3">
        <div className="text-xs text-muted-foreground mb-1">Connected wallet</div>
        <div className="font-mono text-xs text-foreground">
          {walletAddress ? `${walletAddress.slice(0, 12)}...${walletAddress.slice(-8)}` : 'Not connected'}
        </div>
        </div>
        </div>
        </div>
         )}

        {/* Step 2 — Role + team size */}
        {step === 2 && (
          <div className="px-6 py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                <Users size={18} className="text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">About your team</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Helps us tailor your experience
                </p>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Your role
              </div>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setData((prev) => ({ ...prev, role }))}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                      data.role === role
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
                Team size
              </div>
              <div className="grid grid-cols-4 gap-2">
                {teamSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setData((prev) => ({ ...prev, teamSize: size }))}
                    className={`rounded-lg border px-3 py-2.5 text-center text-sm transition-colors ${
                      data.teamSize === size
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && (
          <div className="px-6 py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10">
                <Check size={18} className="text-success" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">You're all set</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirm your details and start paying your team
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background overflow-hidden">
              {[
                { label: 'Admin name', value: data.adminName },
                { label: 'Company', value: data.companyName },
                { label: 'Role', value: data.role || 'Not specified' },
                { label: 'Team size', value: data.teamSize || 'Not specified' },
                {
                  label: 'Treasury wallet',
                  value: walletAddress ? `${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}` : 'Not connected',
                },
                { label: 'Default asset', value: 'USDC' },
                { label: 'Network', value: 'Stellar Testnet' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0"
                >
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="font-mono text-xs text-foreground">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-3">
              <Coins size={13} className="text-success shrink-0" />
              <p className="text-xs text-muted-foreground">
                ZeroWage is non-custodial. We never hold your funds. All
                payments go directly from your wallet to employees.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 1 && !data.companyName.trim())
              }
              className="gap-2"
            >
              Continue
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button onClick={complete} className="gap-2">
              <Check size={14} />
              Get started
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}