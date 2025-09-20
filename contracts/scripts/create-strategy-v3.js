const { ethers } = require("hardhat");

async function main() {
    // 从 deploy-v3.js 的输出中填入工厂地址
    const FACTORY_ADDRESS = ""; // 请填入工厂合约地址
    
    if (!FACTORY_ADDRESS) {
        console.log("❌ Please set FACTORY_ADDRESS first!");
        console.log("💡 Run deploy-v3.js first and copy the factory address");
        return;
    }
    
    const [deployer] = await ethers.getSigners();
    
    console.log("🎯 Creating Strategy with V3 Architecture");
    console.log("Account:", deployer.address);
    console.log("Factory:", FACTORY_ADDRESS);
    
    try {
        // 连接到已部署的工厂
        const factory = await ethers.getContractAt("BasketeerFactoryV3", FACTORY_ADDRESS);
        
        // 获取模块地址
        const oracleModule = await factory.oracleModule();
        const pricingModule = await factory.pricingModule();
        const tradingModule = await factory.tradingModule();
        
        console.log("\n📋 Using modules:");
        console.log("- Oracle:", oracleModule);
        console.log("- Pricing:", pricingModule);
        console.log("- Trading:", tradingModule);
        
        // 策略参数
        const strategyTokens = [
            ethers.getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"), // WBTC
            ethers.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")  // WETH
        ];
        
        const strategyWeights = [3000, 7000]; // 30% WBTC, 70% WETH
        
        const strategyPairs = [
            ethers.getAddress("0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11"), // WBTC/DAI pair
            ethers.getAddress("0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11")  // WETH/DAI pair
        ];
        
        const strategyName = "V3 BTC-ETH Portfolio";
        const strategySymbol = "V3BTCETH";
        const usdToken = ethers.getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F"); // DAI
        
        console.log("\n📊 Strategy parameters:");
        console.log("- Name:", strategyName);
        console.log("- Symbol:", strategySymbol);
        console.log("- Tokens:", strategyTokens.length);
        console.log("- Weights:", strategyWeights);
        
        // 创建策略
        console.log("\n🚀 Creating strategy...");
        const createTx = await factory.createStrategy(
            strategyTokens,
            strategyWeights,
            strategyName,
            strategySymbol,
            usdToken,
            strategyPairs
        );
        
        console.log("📤 Transaction sent:", createTx.hash);
        const receipt = await createTx.wait();
        console.log("✅ Transaction confirmed! Gas used:", receipt.gasUsed.toString());
        
        // 获取新创建的策略地址
        const creatorStrategies = await factory.getCreatorStrategies(deployer.address);
        const newStrategyAddress = creatorStrategies[creatorStrategies.length - 1];
        
        console.log("\n🎉 Strategy created successfully!");
        console.log("📍 Strategy address:", newStrategyAddress);
        
        // 验证策略
        const isValid = await factory.isValidStrategy(newStrategyAddress);
        console.log("✅ Strategy is valid:", isValid);
        
        // 连接到策略合约测试功能
        const strategy = await ethers.getContractAt("BasketeerV3", newStrategyAddress);
        
        console.log("\n🔍 Strategy details:");
        const tokensLength = await strategy.tokensLength();
        console.log("- Tokens count:", tokensLength.toString());
        
        // 测试模块调用
        try {
            const netValue = await strategy.basketUsd();
            console.log("- Net value:", ethers.formatEther(netValue), "USD");
        } catch (error) {
            console.log("- Net value: Not available (oracle needs update)");
        }
        
        // 获取统计信息
        const totalStrategies = await factory.getStrategiesCount();
        console.log("📊 Total strategies in factory:", totalStrategies.toString());
        
        console.log("\n📋 Next steps:");
        console.log("1. Update oracle: strategy.updateOracle(tokenAddress)");
        console.log("2. Deposit: strategy.depositSingle(...)");
        console.log("3. Withdraw: strategy.withdraw(shares)");
        console.log("4. Check value: factory.getStrategyValue(address)");
        
        console.log("\n🎯 V3 Architecture advantages:");
        console.log("✅ Strategy contract is smaller and focused");
        console.log("✅ Modules are reused across all strategies");
        console.log("✅ Easy to upgrade modules independently");
        console.log("✅ Clear separation of concerns");
        
        return {
            strategyAddress: newStrategyAddress,
            transactionHash: createTx.hash,
            gasUsed: receipt.gasUsed.toString(),
            modules: {
                oracle: oracleModule,
                pricing: pricingModule,
                trading: tradingModule
            }
        };
        
    } catch (error) {
        console.error("❌ Strategy creation failed:", error.message);
        
        if (error.message.includes("weights must sum to 10000")) {
            console.log("💡 Fix: Make sure weights sum to exactly 10000");
        }
        
        throw error;
    }
}

main()
    .then((result) => {
        console.log("\n🎊 V3 Strategy creation completed!");
        console.log("📊 Result:", JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
