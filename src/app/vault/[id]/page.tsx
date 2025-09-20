import { VaultDetail } from "@/components/vault-detail"
import { notFound } from "next/navigation"

// Mock vault data
const vaultData = {
  "diva-steth": {
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
    learnMoreUrl: "https://diva.enzyme.finance/",
    tags: ["Long only"],
    performance: {
      totalReturn: "+12.34%",
      sharpeRatio: "1.45",
      maxDrawdown: "-3.21%",
      volatility: "8.76%",
    },
    portfolio: [
      { asset: "stETH", allocation: "85.2%", value: "$28,725,432.11" },
      { asset: "ETH", allocation: "12.8%", value: "$4,313,798.75" },
      { asset: "USDC", allocation: "2.0%", value: "$674,030.44" },
    ],
    fees: {
      managementFee: "2.0%",
      performanceFee: "20.0%",
      entranceFee: "0.0%",
      exitFee: "0.5%",
    },
  },
}

interface VaultPageProps {
  params: {
    id: string
  }
}

export default function VaultPage({ params }: VaultPageProps) {
  const vault = vaultData[params.id as keyof typeof vaultData]

  if (!vault) {
    notFound()
  }

  return <VaultDetail vault={vault} />
}
