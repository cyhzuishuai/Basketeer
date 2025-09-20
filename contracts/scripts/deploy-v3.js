const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 Deploying Basketeer V3 Architecture");
    console.log("Account:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    try {
        // 第一步：单独部署模块合约
        console.log("\n📦 Step 1: Deploying independent modules...");
        
        // 1. 部署 Oracle 模块
        console.log("Deploying Oracle Module...");
        const OracleModule = await ethers.getContractFactory("OracleModuleV2");
        const oracleModule = await OracleModule.deploy();
        await oracleModule.waitForDeployment();
        const oracleAddress = await oracleModule.getAddress();
        console.log("✅ Oracle Module:", oracleAddress);
        
        // 2. 部署 Pricing 模块
        console.log("Deploying Pricing Module...");
        const PricingModule = await ethers.getContractFactory("PricingModuleV2");
        const pricingModule = await PricingModule.deploy(oracleAddress);
        await pricingModule.waitForDeployment();
        const pricingAddress = await pricingModule.getAddress();
        console.log("✅ Pricing Module:", pricingAddress);
        
        // 3. 部署 Trading 模块
        console.log("Deploying Trading Module...");
        const ROUTER = ethers.getAddress("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
        const TradingModule = await ethers.getContractFactory("TradingModuleV2");
        const tradingModule = await TradingModule.deploy(ROUTER);
        await tradingModule.waitForDeployment();
        const tradingAddress = await tradingModule.getAddress();
        console.log("✅ Trading Module:", tradingAddress);
        
        // 第二步：部署工厂合约
        console.log("\n📦 Step 2: Deploying factory...");
        const BasketeerFactory = await ethers.getContractFactory("BasketeerFactoryV3");
        const factory = await BasketeerFactory.deploy(
            oracleAddress,
            pricingAddress,
            tradingAddress
        );
        await factory.waitForDeployment();
        const factoryAddress = await factory.getAddress();
        console.log("✅ Factory deployed:", factoryAddress);
        
        // 第三步：测试策略创建
        console.log("\n📦 Step 3: Testing strategy creation...");
        
        const testTokens = [
            ethers.getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"), // WBTC
            ethers.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")  // WETH
        ];
        
        const testWeights = [4000, 6000]; // 40% WBTC, 60% WETH
        
        const testPairs = [
            ethers.getAddress("0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11"), // WBTC/DAI pair
            ethers.getAddress("0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11")  // WETH/DAI pair
        ];
        
        const DAI = ethers.getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F");
        
        /*
        // 创建测试策略（取消注释以执行）
        console.log("Creating test strategy...");
        const createTx = await factory.createStrategy(
            testTokens,
            testWeights,
            "V3 BTC-ETH Strategy",
            "V3BTCETH",
            DAI,
            testPairs
        );
        
        const receipt = await createTx.wait();
        console.log("✅ Strategy created! Gas used:", receipt.gasUsed.toString());
        
        // 获取策略地址
        const strategies = await factory.getCreatorStrategies(deployer.address);
        const strategyAddress = strategies[strategies.length - 1];
        console.log("📍 Strategy address:", strategyAddress);
        
        // 测试净值查询
        try {
            const netValue = await factory.getStrategyValue(strategyAddress);
            console.log("💰 Strategy net value:", ethers.formatEther(netValue), "USD");
        } catch (error) {
            console.log("⚠️  Net value not available (oracle needs update)");
        }
        */
        
        console.log("\n✅ V3 Architecture deployed successfully!");
        
        console.log("\n📋 Deployment Summary:");
        console.log("🔧 Modules (Independent):");
        console.log("  - Oracle Module:", oracleAddress);
        console.log("  - Pricing Module:", pricingAddress);
        console.log("  - Trading Module:", tradingAddress);
        console.log("🏭 Factory:", factoryAddress);
        
        console.log("\n🎯 Architecture Benefits:");
        console.log("✅ Modules are independent and reusable");
        console.log("✅ Main contracts are smaller and focused");
        console.log("✅ Easy to upgrade individual modules");
        console.log("✅ Lower gas costs for strategy creation");
        console.log("✅ Better separation of concerns");
        
        console.log("\n📋 Usage:");
        console.log("1. Modules are deployed once and reused");
        console.log("2. Factory creates strategies using module interfaces");
        console.log("3. Strategies delegate functionality to modules");
        console.log("4. Users interact with strategies normally");
        
        return {
            modules: {
                oracle: oracleAddress,
                pricing: pricingAddress,
                trading: tradingAddress
            },
            factory: factoryAddress,
            deployer: deployer.address
        };
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        
        if (error.message.includes("code is too large")) {
            console.log("🚨 Contract size issue detected!");
            console.log("💡 The V3 architecture should resolve this with smaller contracts");
        }
        
        throw error;
    }
}

main()
    .then((result) => {
        console.log("\n🎉 V3 Deployment completed successfully!");
        console.log("📊 Final result:", JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
