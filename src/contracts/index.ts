import deployerAbi from "../abi/deployer.json";
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// 2. 合约配置
export const deployerAddress = "0x60ee57163bc08A83aB381D79819927f82F8dD31a";
export const counterAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `${string}`;
export const counterAbi = deployerAbi;
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

const { data: hash, writeContract } = useWriteContract();

// 4. 部署函数 - 使用写死的参数
export const handleDeploy = async () => {
    writeContract({
        address: deployerAddress,
        abi: deployerAbi,
        functionName: 'deployStrategy',
        args:[
            strategyTokens,
            strategyWeights,
            strategyName,
            strategySymbol,
            USDT, 
            strategyPairs,
        ]
      });
};