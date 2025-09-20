const { ethers } = require("hardhat");

/**
 * Basketeer查询接口类
 * 提供完整的策略和持有者信息查询功能
 */
class BasketeerQueryInterface {
    constructor(queryContractAddress, registryAddress, provider) {
        this.queryContract = new ethers.Contract(
            queryContractAddress,
            require("../artifacts/contracts/src/BasketeerQuery.sol/BasketeerQuery.json").abi,
            provider
        );
        this.registryContract = new ethers.Contract(
            registryAddress,
            require("../artifacts/contracts/src/BasketeerRegistry.sol/BasketeerRegistry.json").abi,
            provider
        );
        this.provider = provider;
    }

    /**
     * 获取单个策略的完整信息
     */
    async getStrategyInfo(strategyAddress) {
        try {
            const info = await this.queryContract.getStrategyInfo(strategyAddress);
            
            return {
                strategyAddress: info.strategyAddress,
                creator: info.creator,
                name: info.name,
                symbol: info.symbol,
                totalShares: ethers.formatEther(info.totalShares),
                totalValue: ethers.formatEther(info.totalValue), // USD
                sharePrice: ethers.formatEther(info.sharePrice), // USD per share
                tokensCount: info.tokensCount.toString(),
                sharesToken: info.sharesToken,
                isActive: info.isActive
            };
        } catch (error) {
            console.error("获取策略信息失败:", error);
            throw error;
        }
    }

    /**
     * 获取所有策略信息
     */
    async getAllStrategies() {
        try {
            const infos = await this.queryContract.getAllStrategiesInfo();
            
            return infos.map(info => ({
                strategyAddress: info.strategyAddress,
                creator: info.creator,
                name: info.name,
                symbol: info.symbol,
                totalShares: ethers.formatEther(info.totalShares),
                totalValue: ethers.formatEther(info.totalValue),
                sharePrice: ethers.formatEther(info.sharePrice),
                tokensCount: info.tokensCount.toString(),
                sharesToken: info.sharesToken,
                isActive: info.isActive
            }));
        } catch (error) {
            console.error("获取所有策略失败:", error);
            throw error;
        }
    }

    /**
     * 获取创建者的策略
     */
    async getCreatorStrategies(creatorAddress) {
        try {
            const infos = await this.queryContract.getCreatorStrategiesInfo(creatorAddress);
            
            return infos.map(info => ({
                strategyAddress: info.strategyAddress,
                name: info.name,
                symbol: info.symbol,
                totalShares: ethers.formatEther(info.totalShares),
                totalValue: ethers.formatEther(info.totalValue),
                sharePrice: ethers.formatEther(info.sharePrice),
                isActive: info.isActive
            }));
        } catch (error) {
            console.error("获取创建者策略失败:", error);
            throw error;
        }
    }

    /**
     * 获取策略的代币组成
     */
    async getStrategyComposition(strategyAddress) {
        try {
            const composition = await this.queryContract.getStrategyComposition(strategyAddress);
            
            return composition.map(token => ({
                token: token.token,
                weight: (Number(token.weight) / 100).toFixed(2) + '%', // 转换为百分比
                balance: ethers.formatEther(token.balance),
                value: ethers.formatEther(token.value)
            }));
        } catch (error) {
            console.error("获取策略组成失败:", error);
            throw error;
        }
    }

    /**
     * 获取用户持有信息
     */
    async getUserHolding(strategyAddress, userAddress) {
        try {
            const holding = await this.queryContract.getUserHolding(strategyAddress, userAddress);
            
            return {
                holder: holding.holder,
                shares: ethers.formatEther(holding.shares),
                value: ethers.formatEther(holding.value),
                percentage: (Number(holding.percentage) / 100).toFixed(4) + '%' // basis points to %
            };
        } catch (error) {
            console.error("获取用户持有信息失败:", error);
            throw error;
        }
    }

    /**
     * 获取用户完整投资组合
     */
    async getUserPortfolio(userAddress) {
        try {
            const portfolio = await this.queryContract.getUserPortfolio(userAddress);
            
            return portfolio.map(holding => ({
                holder: holding.holder,
                shares: ethers.formatEther(holding.shares),
                value: ethers.formatEther(holding.value),
                percentage: (Number(holding.percentage) / 100).toFixed(4) + '%'
            }));
        } catch (error) {
            console.error("获取用户投资组合失败:", error);
            throw error;
        }
    }

    /**
     * 获取策略健康状态
     */
    async getStrategyHealth(strategyAddress) {
        try {
            const health = await this.queryContract.getStrategyHealth(strategyAddress);
            
            return {
                oracleActive: health.oracleActive,
                hasLiquidity: health.hasLiquidity,
                lastUpdate: new Date(Number(health.lastUpdate) * 1000).toISOString(),
                status: health.status
            };
        } catch (error) {
            console.error("获取策略健康状态失败:", error);
            throw error;
        }
    }

    /**
     * 获取注册表统计信息
     */
    async getRegistryStats() {
        try {
            const totalStrategies = await this.registryContract.getStrategiesCount();
            const allStrategies = await this.getAllStrategies();
            
            const activeStrategies = allStrategies.filter(s => s.isActive).length;
            const totalValue = allStrategies.reduce((sum, s) => sum + parseFloat(s.totalValue), 0);
            const totalShares = allStrategies.reduce((sum, s) => sum + parseFloat(s.totalShares), 0);
            
            return {
                totalStrategies: totalStrategies.toString(),
                activeStrategies,
                totalValueLocked: totalValue.toFixed(2),
                totalShares: totalShares.toFixed(2),
                averageStrategy: activeStrategies > 0 ? (totalValue / activeStrategies).toFixed(2) : '0'
            };
        } catch (error) {
            console.error("获取注册表统计失败:", error);
            throw error;
        }
    }
}

/**
 * 使用示例和测试函数
 */
async function exampleUsage() {
    // 示例地址（需要替换为实际部署的地址）
    const QUERY_CONTRACT = "0x..."; // BasketeerQuery合约地址
    const REGISTRY_CONTRACT = "0x..."; // BasketeerRegistry合约地址
    const STRATEGY_ADDRESS = "0x..."; // 策略合约地址
    const USER_ADDRESS = "0x..."; // 用户地址
    
    const provider = new ethers.JsonRpcProvider("https://explorer.monad-testnet.category.xyz/api/eth-rpc");
    const queryInterface = new BasketeerQueryInterface(QUERY_CONTRACT, REGISTRY_CONTRACT, provider);
    
    try {
        console.log("🔍 Basketeer查询接口示例");
        
        // 1. 获取注册表统计
        console.log("\n📊 注册表统计:");
        const stats = await queryInterface.getRegistryStats();
        console.log(stats);
        
        // 2. 获取所有策略
        console.log("\n📋 所有策略:");
        const strategies = await queryInterface.getAllStrategies();
        strategies.forEach((strategy, index) => {
            console.log(`${index + 1}. ${strategy.name} (${strategy.symbol})`);
            console.log(`   地址: ${strategy.strategyAddress}`);
            console.log(`   总净值: ${strategy.totalValue} USD`);
            console.log(`   单位净值: ${strategy.sharePrice} USD`);
            console.log(`   总份额: ${strategy.totalShares}`);
            console.log(`   状态: ${strategy.isActive ? '活跃' : '非活跃'}`);
        });
        
        // 3. 获取特定策略信息
        if (STRATEGY_ADDRESS !== "0x...") {
            console.log("\n🎯 策略详细信息:");
            const strategyInfo = await queryInterface.getStrategyInfo(STRATEGY_ADDRESS);
            console.log(strategyInfo);
            
            // 4. 获取策略组成
            console.log("\n💎 策略组成:");
            const composition = await queryInterface.getStrategyComposition(STRATEGY_ADDRESS);
            composition.forEach(token => {
                console.log(`${token.token}: ${token.weight}, 余额: ${token.balance}, 价值: ${token.value} USD`);
            });
            
            // 5. 获取策略健康状态
            console.log("\n💊 策略健康状态:");
            const health = await queryInterface.getStrategyHealth(STRATEGY_ADDRESS);
            console.log(health);
        }
        
        // 6. 获取用户投资组合
        if (USER_ADDRESS !== "0x...") {
            console.log("\n👤 用户投资组合:");
            const portfolio = await queryInterface.getUserPortfolio(USER_ADDRESS);
            portfolio.forEach(holding => {
                console.log(`持有份额: ${holding.shares}, 价值: ${holding.value} USD, 占比: ${holding.percentage}`);
            });
        }
        
    } catch (error) {
        console.error("查询示例执行失败:", error);
    }
}

/**
 * 部署查询合约
 */
async function deployQueryContract(registryAddress) {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 部署BasketeerQuery合约");
    console.log("部署者:", deployer.address);
    console.log("注册表地址:", registryAddress);
    
    try {
        const QueryContract = await ethers.getContractFactory("BasketeerQuery");
        const queryContract = await QueryContract.deploy(registryAddress);
        await queryContract.waitForDeployment();
        
        const queryAddress = await queryContract.getAddress();
        console.log("✅ BasketeerQuery部署成功:", queryAddress);
        
        return queryAddress;
    } catch (error) {
        console.error("❌ 查询合约部署失败:", error);
        throw error;
    }
}

// 导出类和函数
module.exports = {
    BasketeerQueryInterface,
    exampleUsage,
    deployQueryContract
};

// 如果直接运行此脚本
if (require.main === module) {
    // 可以在这里运行示例或部署
    console.log("Basketeer查询接口已加载");
    console.log("使用方法:");
    console.log("1. 部署查询合约: deployQueryContract(registryAddress)");
    console.log("2. 创建查询接口: new BasketeerQueryInterface(queryAddr, registryAddr, provider)");
    console.log("3. 运行示例: exampleUsage()");
}
