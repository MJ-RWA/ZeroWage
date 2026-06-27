'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

interface WalletContextType {
  address: string | null
  isConnected: boolean
  isLoading: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isLoading: true,
  connect: async () => {},
  disconnect: () => {},
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check on mount — no flash
  useEffect(() => {
    async function check() {
      try {
        const { isConnected, getAddress } = await import('@stellar/freighter-api')
        const conn = await isConnected()
        if (conn?.isConnected) {
          const result = await getAddress()
          if (result?.address) setAddress(result.address)
        }
      } catch {}
      finally {
        setIsLoading(false)
      }
    }
    check()
  }, [])

  const connect = useCallback(async () => {
    try {
      const { isConnected, isAllowed, requestAccess, getAddress } =
        await import('@stellar/freighter-api')
      const conn = await isConnected()
      if (!conn?.isConnected) {
        window.open('https://www.freighter.app/', '_blank')
        return
      }
      const allowed = await isAllowed()
      if (!allowed?.isAllowed) await requestAccess()
      const result = await getAddress()
      if (result?.address) setAddress(result.address)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
  }, [])

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isLoading,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}