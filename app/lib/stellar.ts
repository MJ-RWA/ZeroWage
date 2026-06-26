export const CONTRACT_ID =
  'CB2JUH7WZEFYDQTK53AAWINVB62BTPBJNZ7P5ZP2ELNHIDQEV3SMRDUD'
export const NETWORK = 'testnet'
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'
export const RPC_URL = 'https://soroban-testnet.stellar.org'

export function truncateHash(hash: string, chars = 8): string {
  if (!hash || hash.length < chars * 2) return hash
  return hash.slice(0, chars) + '…' + hash.slice(-6)
}

export async function connectFreighter(): Promise<string | null> {
  try {
    const freighter = (window as any).freighter
    if (!freighter) {
      window.open('https://www.freighter.app/', '_blank')
      return null
    }
    await freighter.requestAccess()
    const { address } = await freighter.getAddress()
    return address
  } catch {
    return null
  }
}

export async function getFreighterAddress(): Promise<string | null> {
  try {
    const freighter = (window as any).freighter
    if (!freighter) return null
    const connected = await freighter.isConnected()
    if (!connected) return null
    const { address } = await freighter.getAddress()
    return address
  } catch {
    return null
  }
}