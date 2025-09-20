"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Download,
  ExternalLink,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface VaultDetailProps {
  vault: {
    id: string
    name: string
    symbol: string
    icon: string
    aum: string
    depositors: number
    monthlyReturn: string
    isPositive: boolean
    denominationAsset: string
    description: string
    learnMoreUrl: string
    tags: string[]
    performance: {
      totalReturn: string
      sharpeRatio: string
      maxDrawdown: string
      volatility: string
    }
    portfolio: Array<{
      asset: string
      allocation: string
      value: string
    }>
    fees: {
      managementFee: string
      performanceFee: string
      entranceFee: string
      exitFee: string
    }
  }
}

// Mock chart data
const performanceData = [
  { date: "Jan", value: 100 },
  { date: "Feb", value: 102.5 },
  { date: "Mar", value: 98.2 },
  { date: "Apr", value: 105.8 },
  { date: "May", value: 108.3 },
  { date: "Jun", value: 112.3 },
]

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"]

export function VaultDetail({ vault }: VaultDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const pathname = usePathname()

  const pieData = vault.portfolio.map((item, index) => ({
    name: item.asset,
    value: Number.parseFloat(item.allocation.replace("%", "")),
    color: COLORS[index % COLORS.length],
  }))

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Discovery
          </Button>
        </Link>
      </div>

      {/* Vault Header */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-3xl">
                  {vault.icon}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{vault.name}</h1>
                  <p className="text-muted-foreground mb-3">{vault.description}</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={vault.learnMoreUrl}
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      Learn more
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
              <Button size="lg" className="gap-2">
                <Download className="w-4 h-4" />
                Deposit
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {vault.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Assets Under Management</span>
                </div>
                <p className="text-2xl font-bold">{vault.aum}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Depositors</span>
                </div>
                <p className="text-2xl font-bold">{vault.depositors}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Average Monthly Return</span>
                </div>
                <p className={`text-2xl font-bold ${vault.isPositive ? "text-chart-3" : "text-destructive"}`}>
                  {vault.monthlyReturn}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Denomination Asset</span>
                </div>
                <p className="text-2xl font-bold">{vault.denominationAsset}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="depositors">Depositors</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pie className="w-5 h-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* My Deposit & Rewards */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Deposit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You haven't deposited into this vault yet</p>
                    <Button>Make Your First Deposit</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No rewards available</p>
                    <Button variant="outline" disabled>
                      Claim Rewards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Portfolio Allocation Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pie className="w-5 h-5" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Holdings */}
            <Card>
              <CardHeader>
                <CardTitle>Holdings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vault.portfolio.map((holding) => (
                    <div key={holding.asset} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{holding.asset.slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{holding.asset}</p>
                          <p className="text-sm text-muted-foreground">{holding.value}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{holding.allocation}</p>
                        <Progress
                          value={Number.parseFloat(holding.allocation.replace("%", ""))}
                          className="w-16 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Return</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-chart-3">{vault.performance.totalReturn}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sharpe Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{vault.performance.sharpeRatio}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Max Drawdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{vault.performance.maxDrawdown}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volatility</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{vault.performance.volatility}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fees" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(vault.fees).map(([feeType, feeValue]) => (
              <Card key={feeType}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{feeType.replace(/([A-Z])/g, " $1").trim()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{feeValue}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pie className="w-5 h-5" />
                Vault Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Investment Strategy</h4>
                  <p className="text-sm text-muted-foreground">
                    This vault follows a long-only strategy focused on liquid staking derivatives with automated
                    rebalancing.
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Risk Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Maximum exposure to any single asset is limited to 90%. Stop-loss mechanisms are in place for
                    downside protection.
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Rebalancing</h4>
                  <p className="text-sm text-muted-foreground">
                    Portfolio is rebalanced weekly or when allocations drift more than 5% from target weights.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depositors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pie className="w-5 h-5" />
                Depositor Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Depositor details are private for security reasons</p>
                <p className="text-sm text-muted-foreground mt-2">Total depositors: {vault.depositors}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pie className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Deposit</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                  <p className="font-medium text-chart-3">+1,250 stETH</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Rebalance</p>
                    <p className="text-sm text-muted-foreground">1 day ago</p>
                  </div>
                  <p className="font-medium">Portfolio rebalanced</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Withdrawal</p>
                    <p className="text-sm text-muted-foreground">3 days ago</p>
                  </div>
                  <p className="font-medium text-destructive">-500 stETH</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
