// src/hooks/useUserBlock.ts - POPRAWIONA WERSJA
import { useAuth } from '@/components/providers/auth-provider'

// TEN HOOK TYLKO ODCZUJ DANE Z AUTH PROVIDER - NIE SPRAWDZAJ BLOKADY
export const useUserBlock = () => {
  const { isBlocked, blockData, user } = useAuth()
  
  const isTemporaryBlock = !blockData?.isPermanent
  const isPermanentBlock = blockData?.isPermanent
  const timeUntilUnblock = blockData?.expiresAt
  
  return { 
    isBlocked, 
    blockData,
    isTemporaryBlock,
    isPermanentBlock,
    timeUntilUnblock,
    // Kompatybilność wsteczna
    loading: false
  }
}