"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  BarChart3,
  Info,
  DollarSign,
  Settings,
  Coins,
  Plus,
  Minus,
  Search,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAccount, useWriteContract } from "wagmi"
import { handleDeploy } from "@/contracts"
import deployerAbi from "../abi/deployer.json";

interface TokenSelection {
  tokenType: string
  tokenAddress:string
  poolId: string
  amount: string
  allocation: number
}

interface VaultFormData {
  name: string
  symbol: string
  description: string
  denominationAsset: string
  managementFee: string
  performanceFee: string
  entranceFee: string
  exitFee: string
  minDeposit: string
  maxDeposit: string
  acceptTerms: boolean
  selectedTokens: TokenSelection[]
}

interface TokenData {
  tokenType: string
  tokenaddress: string
  poolId: string
  category: string
}

const initialAvailableTokens: TokenData[] = [
  { tokenType: "ETH", tokenaddress: "0x1234...5678", poolId: "0x1234...5678", category: "Base Asset" },
  { tokenType: "stETH", tokenaddress: "0x2345...6789", poolId: "0x2345...6789", category: "Liquid Staking" },
  { tokenType: "USDC", tokenaddress: "0x3456...789a", poolId: "0x3456...789a", category: "Stablecoin" },
  { tokenType: "USDT", tokenaddress: "0x4567...89ab", poolId: "0x4567...89ab", category: "Stablecoin" },
  { tokenType: "WBTC", tokenaddress: "0x5678...9abc", poolId: "0x5678...9abc", category: "Bitcoin" },
  { tokenType: "UNI", tokenaddress: "0x6789...abcd", poolId: "0x6789...abcd", category: "DeFi" },
  { tokenType: "AAVE", tokenaddress: "0x789a...bcde", poolId: "0x789a...bcde", category: "DeFi" },
  { tokenType: "COMP", tokenaddress: "0x89ab...cdef", poolId: "0x89ab...cdef", category: "DeFi" },
]

const steps = [
  { id: "before", title: "Before you start", icon: Info },
  { id: "basics", title: "Basics", icon: Settings },
  { id: "tokens", title: "Token Selection", icon: Coins },
  { id: "shares", title: "Shares transferability", icon: BarChart3 },
]

export function VaultCreation() {
  const [currentStep, setCurrentStep] = useState(0)
  const [tokenSearchQuery, setTokenSearchQuery] = useState("")
  const [availableTokens, setAvailableTokens] = useState<TokenData[]>(initialAvailableTokens)
  const [showAddTokenForm, setShowAddTokenForm] = useState(false)
  const [newToken, setNewToken] = useState({
    tokenType: "",
    tokenaddress: "",
    poolId: "",
    category: "",
  })
  const [isDeploying, setIsDeploying] = useState(false)
  const pathname = usePathname()
  const { isConnected } = useAccount()

  // 使用 useWriteContract hook
  const { writeContract, writeContractAsync, isPending, error } = useWriteContract({
    mutation: {
      onSuccess: (data) => {
        console.log('Vault deployment successful:', data)
        setIsDeploying(false)
        // 可以添加成功提示或跳转逻辑
      },
      onError: (error) => {
        console.error('Vault deployment failed:', error)
        setIsDeploying(false)
        // 可以添加错误提示
      }
    }
  })

  const [formData, setFormData] = useState<VaultFormData>({
    name: "",
    symbol: "",
    description: "",
    denominationAsset: "",
    managementFee: "2.0",
    performanceFee: "20.0",
    entranceFee: "0.0",
    exitFee: "0.5",
    minDeposit: "0.1",
    maxDeposit: "10000",
    acceptTerms: false,
    selectedTokens: [],
  })

  const updateFormData = (field: keyof VaultFormData, value: string | boolean | TokenSelection[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addToken = (token: TokenData) => {
    const newToken: TokenSelection = {
      tokenType: token.tokenType,   
      tokenAddress:token.tokenaddress,
      poolId: token.poolId,
      amount: "0",
      allocation: 0,
    }
    updateFormData("selectedTokens", [...formData.selectedTokens, newToken])
  }

  const removeToken = (index: number) => {
    const updatedTokens = formData.selectedTokens.filter((_, i) => i !== index)
    updateFormData("selectedTokens", updatedTokens)
  }

  const updateTokenAmount = (index: number, amount: string) => {
    const updatedTokens = formData.selectedTokens.map((token, i) => (i === index ? { ...token, amount } : token))
    updateFormData("selectedTokens", updatedTokens)
  }

  const handleAddNewToken = () => {
    if (newToken.tokenType && newToken.tokenaddress && newToken.poolId && newToken.category) {
      const tokenToAdd: TokenData = {
        tokenType: newToken.tokenType,
        tokenaddress: newToken.tokenaddress,
        poolId: newToken.poolId,
        category: newToken.category,
      }
      
      // Check if token already exists
      const tokenExists = availableTokens.some(
        token => token.tokenType.toLowerCase() === newToken.tokenType.toLowerCase()
      )
      
      if (!tokenExists) {
        setAvailableTokens([...availableTokens, tokenToAdd])
        setNewToken({ tokenType: "", tokenaddress: "", poolId: "", category: "" })
        setShowAddTokenForm(false)
      } else {
        alert("Token with this type already exists!")
      }
    }
  }

  const filteredTokens = availableTokens.filter(
    (token) =>
      token.tokenType.toLowerCase().includes(tokenSearchQuery.toLowerCase()) &&
      !formData.selectedTokens.some((selected) => selected.tokenType === token.tokenType),
  )

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepComplete = (stepIndex: number) => {
    return stepIndex < currentStep
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true
      case 1:
        return formData.name && formData.symbol && formData.description && formData.denominationAsset
      case 2:
        return (
          formData.selectedTokens.length > 0 &&
          formData.selectedTokens.every((token) => Number.parseFloat(token.amount) > 0)
        )
      case 3:
        return true
      case 4:
        return formData.minDeposit && formData.maxDeposit
      case 5:
        return formData.acceptTerms
      default:
        return false
    }
  }

  // 新增：处理创建金库的函数
  const handleCreateVault = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (!canProceed()) {
      alert('Please complete all required fields')
      return
    }

    try {
      setIsDeploying(true)
      
      // 准备合约调用参数
      const USDT = "0x8D13bbDbCea96375c25e5eDb679613AA480d5E27"; // 作为USD基准
    
      // === 策略代币地址 ===
      const strategyTokens = [
          "0xC5ae99a1B0b8d307F5D33343b442ab21Ca9dD475", // WBTC
          "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3", // WETH  
          "0x4175df4399Ac18A9E60148b21575ceb5eb5edc35", // SOL
          "0xf04b6BcBBcCc6Cd981D53830EF1dFeA783Ba3feB"  // BNB
      ];
      
      // === 策略权重 (BTC:50%, ETH:25%, SOL:15%, BNB:10%) ===
      const strategyWeights = [5000, 2500, 1500, 1000]; // 总和 = 10000
      
      // === 对应的 USDT 交易对地址 ===
      const strategyPairs = [
          "0xa5C2e8df3b5Ca0C296C441b3011B43910B94B7e1", // USDT/WBTC Pool
          "0xfe7dE0a08B895B36C07f5c3A0B49564A29A341EB", // USDT/WETH Pool
          "0x900c165d4cB2C02aF341B2cD48f06F835EBcd522", // USDT/SOL Pool
          "0x4C1CC54a4fD330d0F3b749bfab28aF0bd5Adc7F9"  // USDT/BNB Pool
      ];
      
      const strategyName = "Monad BTC-ETH-SOL-BNB Portfolio";
      const strategySymbol = "mBESB";
  

      // 调用合约部署函数
      await writeContractAsync({
        address: "0x60ee57163bc08A83aB381D79819927f82F8dD31a",
        abi: deployerAbi,
        functionName: 'deployStrategy',
        args: [
          strategyTokens,
          strategyWeights,
          strategyName,
          strategySymbol,
          USDT,
          strategyPairs,
        ],
      })

    } catch (error) {
      console.error('Error creating vault:', error)
      setIsDeploying(false)
    }
  }

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

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create Your Vault</h1>

        {/* Wallet Connection Warning */}
        {!isConnected && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">
                Please connect your wallet to create a vault. You need to be connected to interact with the blockchain.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step Navigation */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isComplete = isStepComplete(index)

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isComplete
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive
                          ? "bg-primary-foreground text-primary"
                          : isComplete
                            ? "bg-chart-3 text-white"
                            : "bg-muted"
                      }`}
                    >
                      {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className="font-medium">{step.title}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Before You Start */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed">
                      Based on the template you have chosen, many settings in the process to create your vault have
                      been pre-configured. You can edit these settings in the steps that follow.
                    </p>

                    <div className="space-y-4">
                      <p className="font-medium">There are two types of settings:</p>

                      <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2">Editable settings</h4>
                          <p className="text-sm text-muted-foreground">
                            can be changed at any time after fund creation.
                          </p>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg">
                          <h4 className="font-medium mb-2">Semi-permanent settings</h4>
                          <p className="text-sm text-muted-foreground">
                            can only be changed upon reconfiguration or with an upgrade of your vault. Both processes
                            require a 7-day cool down period after you have configured new settings before they take
                            effect. During this period, your vault will reject any new depositors, and existing
                            depositors may opt to leave if they do not like the new settings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Basics */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter vault name"
                          value={formData.name}
                          onChange={(e) => updateFormData("name", e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">The name of your vault.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="symbol">Symbol</Label>
                        <Input
                          id="symbol"
                          placeholder="e.g., ENZF"
                          value={formData.symbol}
                          onChange={(e) => updateFormData("symbol", e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                          The symbol is the token ticker associated with the tokenized shares of your vault.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your vault strategy and objectives"
                        value={formData.description}
                        onChange={(e) => updateFormData("description", e.target.value)}
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground">
                        A brief description of your vault's investment strategy.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="denominationAsset">Denomination Asset</Label>
                      <Select
                        value={formData.denominationAsset}
                        onValueChange={(value) => updateFormData("denominationAsset", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select denomination asset" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="stETH">stETH</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                          <SelectItem value="WBTC">WBTC</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        The base asset used for calculating vault performance and share prices.
                      </p>
                    </div>
                  </div>
                )}

                {/* Token Selection */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Select Tokens for Your Vault</h3>
                      <p className="text-muted-foreground">
                        Choose the tokens you want to include in your vault and specify the amount for each.
                      </p>

                      {/* Selected Tokens */}
                      {formData.selectedTokens.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Selected Tokens</h4>
                          <div className="space-y-3">
                            {formData.selectedTokens.map((token, index) => (
                              <div key={index} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Token Type</Label>
                                    <p className="font-medium">{token.tokenType}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Pool ID</Label>
                                    <p className="font-mono text-sm">{token.poolId}</p>
                                  </div>
                                  <div>
                                    <Label htmlFor={`amount-${index}`} className="text-sm text-muted-foreground">
                                      Weight (%)
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        id={`amount-${index}`}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={token.amount}
                                        onChange={(e) => updateTokenAmount(index, e.target.value)}
                                        placeholder="0.00"
                                        className="flex-1"
                                      />
                                      <span className="text-sm text-muted-foreground">%</span>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeToken(index)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add New Token Form */}
                      {showAddTokenForm && (
                        <div className="p-4 border border-border rounded-lg bg-muted/20">
                          <h4 className="font-medium mb-4">Add New Token</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="newTokenType">Token Type</Label>
                              <Input
                                id="newTokenType"
                                placeholder="e.g., LINK"
                                value={newToken.tokenType}
                                onChange={(e) => setNewToken({ ...newToken, tokenType: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newTokenCategory">Category</Label>
                              <Select
                                value={newToken.category}
                                onValueChange={(value) => setNewToken({ ...newToken, category: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Base Asset">Base Asset</SelectItem>
                                  <SelectItem value="Liquid Staking">Liquid Staking</SelectItem>
                                  <SelectItem value="Stablecoin">Stablecoin</SelectItem>
                                  <SelectItem value="Bitcoin">Bitcoin</SelectItem>
                                  <SelectItem value="DeFi">DeFi</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newTokenAddress">Token Address</Label>
                              <Input
                                id="newTokenAddress"
                                placeholder="0x..."
                                value={newToken.tokenaddress}
                                onChange={(e) => setNewToken({ ...newToken, tokenaddress: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newPoolId">Pool ID</Label>
                              <Input
                                id="newPoolId"
                                placeholder="0x..."
                                value={newToken.poolId}
                                onChange={(e) => setNewToken({ ...newToken, poolId: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button onClick={handleAddNewToken} disabled={!newToken.tokenType || !newToken.tokenaddress || !newToken.poolId || !newToken.category}>
                              Add Token
                            </Button>
                            <Button variant="outline" onClick={() => setShowAddTokenForm(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Available Tokens */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <h4 className="font-medium">Available Tokens</h4>
                          <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search tokens..."
                              value={tokenSearchQuery}
                              onChange={(e) => setTokenSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddTokenForm(!showAddTokenForm)}
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Token
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filteredTokens.map((token) => (
                            <div
                              key={token.tokenType}
                              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium">{token.tokenType.slice(0, 2)}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{token.tokenType}</p>
                                    <Badge variant="secondary" className="text-xs">
                                      {token.category}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>Pool ID: {token.poolId}</p>
                                  <p>Token Address: {token.tokenaddress}</p>
                                </div>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => addToken(token)}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        {filteredTokens.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            {tokenSearchQuery
                              ? "No tokens found matching your search."
                              : "All available tokens have been selected."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shares Transferability */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Share Transfer Settings</h3>
                      <p className="text-muted-foreground">
                        Configure how vault shares can be transferred between addresses.
                      </p>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="transferable" checked={true} disabled />
                          <Label htmlFor="transferable" className="text-sm">
                            Allow share transfers (recommended)
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="acceptTerms"
                            checked={formData.acceptTerms}
                            onCheckedChange={(checked) => updateFormData("acceptTerms", checked as boolean)}
                          />
                          <Label htmlFor="acceptTerms" className="text-sm">
                            I accept the terms and conditions and understand the risks involved in creating a vault
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Important Notice</h4>
                      <p className="text-sm text-muted-foreground">
                        By creating this vault, you acknowledge that you understand the risks involved in DeFi
                        protocols and that you are responsible for managing the vault according to its stated
                        strategy.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {/* 修改创建按钮 */}
                  {currentStep === steps.length - 1 ? (
                    <Button 
                      onClick={handleCreateVault}
                      disabled={!canProceed() || !isConnected || isDeploying || isPending}
                      className="gap-2"
                    >
                      {isDeploying || isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating Vault...
                        </>
                      ) : (
                        <>
                          Create Vault
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={nextStep} disabled={!canProceed()}>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 添加错误显示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Error: {error.message}</p>
        </div>
      )}
    </div>
  )
}
