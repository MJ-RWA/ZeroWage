'use client'

import { AppShell } from '@/components/app-shell'
import { useState, useEffect } from 'react'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { Protected } from '@/components/auth/protected'


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [wallet, setWallet] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      try {
        const { isConnected, getAddress } = await import('@stellar/freighter-api')
        const conn = await isConnected()
        if (conn?.isConnected) {
          const result = await getAddress()
          if (result?.address) setWallet(result.address)
        }
      } catch {}
    }
    check()
  }, [])

  return (
    <>
      <Protected>
      <AppShell>{children}</AppShell>
      <OnboardingModal walletAddress={wallet ?? undefined} />
      </Protected>
    </>
  )
}
