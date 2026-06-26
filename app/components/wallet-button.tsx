'use client'

import { useState, useEffect } from 'react'
import { Wallet, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  isConnected,
  getAddress,
  requestAccess,
} from '@stellar/freighter-api'

export function WalletButton() {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    checkConnection()
  }, [])

  async function checkConnection() {
    try {
      const connected = await isConnected()
      if (connected) {
        const result = await getAddress()
        if (result.address) setAddress(result.address)
      }
    } catch {
      // not connected or extension not installed
    }
  }

  async function connect() {
    setConnecting(true)
    try {
      const accessResult = await requestAccess()
      if (accessResult.error) {
        console.error('Freighter access denied:', accessResult.error)
        return
      }
      const result = await getAddress()
      if (result.address) {
        setAddress(result.address)
        router.push('/dashboard')
      }
    } catch (e) {
      console.error('Wallet connection failed', e)
    } finally {
      setConnecting(false)
    }
  }

  function disconnect() {
    setAddress(null)
  }

  if (!mounted) return null

  if (address) {
    return (
      <button
        onClick={disconnect}
        className="group flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-destructive/50 hover:bg-destructive/5"
        title="Click to disconnect"
      >
        <span className="size-2 rounded-full bg-green-400" />
        <span className="font-mono text-xs text-foreground">
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
        <LogOut className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 border-border"
      onClick={connect}
      disabled={connecting}
    >
      {connecting ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Wallet className="size-3.5" />
      )}
      {connecting ? 'Connecting…' : 'Connect Wallet'}
    </Button>
  )
}