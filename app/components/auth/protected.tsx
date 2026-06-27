'use client'

import { useWallet } from '@/lib/wallet-context'
import { Shield, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Protected({ children }: { children: React.ReactNode }) {
  const { isConnected, isLoading, connect } = useWallet()

  // While checking wallet — show nothing (prevents flash)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Checking wallet...
        </div>
      </div>
    )
  }

  // Not connected — show gate
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-5">
            <Shield size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Connect your wallet
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            ZeroWage uses your Stellar wallet as your identity.
            No email or password required.
          </p>

          <Button onClick={connect} className="w-full gap-2 h-11">
            <Wallet size={16} />
            Connect Freighter Wallet
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">
            Don't have Freighter?{' '}
            
             <a href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Install it here
            </a>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}