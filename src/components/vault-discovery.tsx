"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, TrendingUp, TrendingDown, Users, DollarSign, Wallet, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Mock data for vaults
const mockVaults = [
  {
    id: "diva-steth",
    name: "Diva Early Stakers stETH Vault",
    symbol: "DIVA-stETH",
    icon: "🔮",
    aum: "$33,701,521.99",
    depositors: 198,
    monthlyReturn: "+6.55%",
    isPositive: true,
    denominationAsset: "stETH",
    description: "Deposit up to 10K stETH to bootstrap Diva's TVL & receive $DIVA Token Incentives.",
    tags: ["Long only"],
  },
  {
    id: "ethx-hyperloop",
    name: "ETHx Hyperloop by Stader Labs",
    symbol: "ETHX-HL",
    icon: "🚀",
    aum: "$6,870,000",
    depositors: 34,
    monthlyReturn: "+4.23%",
    isPositive: true,
    denominationAsset: "ETHx",
    description: "Automated ETH staking strategy with liquid staking derivatives.",
    tags: ["Automated"],
  },
  {
    id: "steakhouse-vault",
    name: "Steakhouse Multi-Asset Vault",
    symbol: "STEAK",
    icon: "🥩",
    aum: "$12,450,000",
    depositors: 89,
    monthlyReturn: "-2.15%",
    isPositive: false,
    denominationAsset: "USDC",
    description: "Diversified multi-asset strategy with risk management.",
    tags: ["Multi-asset", "Risk managed"],
  },
  {
    id: "defi-blue-chip",
    name: "DeFi Blue Chip Index",
    symbol: "DBCI",
    icon: "💎",
    aum: "$8,920,000",
    depositors: 156,
    monthlyReturn: "+8.91%",
    isPositive: true,
    denominationAsset: "ETH",
    description: "Index of top DeFi protocols with automatic rebalancing.",
    tags: ["Index", "Auto-rebalance"],
  },
]

const totalStats = {
  totalVaults: 1648,
  totalAUM: "$177,423,925.51",
  totalDeposits: 8261,
}

export function VaultDiscovery() {
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()

  const filteredVaults = mockVaults.filter(
    (vault) =>
      vault.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalVaults.toLocaleString()}</p>
                <p className="text-muted-foreground">Vaults</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalAUM}</p>
                <p className="text-muted-foreground">Assets Under Management</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <Users className="w-6 h-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalDeposits.toLocaleString()}</p>
                <p className="text-muted-foreground">Deposits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Create */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vaults..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Link href="/create">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Vault
          </Button>
        </Link>
      </div>

      {/* Popular Vaults Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">{pathname === "/vaults" ? "All Vaults" : "Popular Vaults"}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVaults.map((vault) => (
            <Link key={vault.id} href={`/vault/${vault.id}`}>
              <Card className="hover:bg-accent/5 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
                      {vault.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{vault.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{vault.description}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {vault.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">AUM</p>
                          <p className="font-semibold">{vault.aum}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Depositors</p>
                          <p className="font-semibold">{vault.depositors}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Monthly Return</p>
                          <div className="flex items-center gap-1">
                            {vault.isPositive ? (
                              <TrendingUp className="w-4 h-4 text-chart-3" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-destructive" />
                            )}
                            <p className={`font-semibold ${vault.isPositive ? "text-chart-3" : "text-destructive"}`}>
                              {vault.monthlyReturn}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Asset</p>
                          <p className="font-semibold">{vault.denominationAsset}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
