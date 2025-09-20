"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
} from "wagmi"
import { Wallet, ChevronDown } from "lucide-react"

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({
    address: address,
  })
  const [showConnectors, setShowConnectors] = useState(false)

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (balance: bigint | undefined, decimals: number = 18) => {
    if (!balance) return "0"
    const formatted = Number(balance) / Math.pow(10, decimals)
    return formatted.toFixed(4)
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Wallet className="w-4 h-4" />
          <span className="text-muted-foreground">{formatAddress(address)}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConnectors(!showConnectors)}
        disabled={isPending}
        className="gap-2"
      >
        <Wallet className="w-4 h-4" />
        {isPending ? "Connecting..." : "Connect Wallet"}
        <ChevronDown className="w-4 h-4" />
      </Button>

      {showConnectors && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-2">
            {connectors.map((connector) => (
              <Button
                key={connector.uid}
                variant="ghost"
                size="sm"
                onClick={() => {
                  connect({ connector })
                  setShowConnectors(false)
                }}
                disabled={isPending}
                className="w-full justify-start"
              >
                {connector.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 