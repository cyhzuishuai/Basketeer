const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 Deploying Ultra-Minimal Basketeer Architecture");
    console.log("Account:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    try {
        // 第一步：部署独立模块（最小）
        console.log("\n📦 Step 1: Deploying tiny modules...");
        
        const OracleModule = await ethers.getContractFactory("OracleModuleV2");
        const oracleModule = await OracleModule.deploy();
        await oracleModule.waitForDeployment();
        const oracleAddress = await oracleModule.getAddress();
        console.log("✅ Oracle Module:", oracleAddress);
        
        const PricingModule = await ethers.getContractFactory("PricingModuleV2");
        const pricingModule = await PricingModule.deploy(oracleAddress);
        await pricingModule.waitForDeployment();
        const pricingAddress = await pricingModule.getAddress();
        console.log("✅ Pricing Module:", pricingAddress);
        
        const ROUTER = ethers.getAddress("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
        const TradingModule = await ethers.getContractFactory("TradingModuleV2");
        const tradingModule = await TradingModule.deploy(ROUTER);
        await tradingModule.waitForDeployment();
        const tradingAddress = await tradingModule.getAddress();
        console.log("✅ Trading Module:", tradingAddress);
        
        // 第二步：部署极简注册表
        console.log("\n📦 Step 2: Deploying tiny registry...");
        const Registry = await ethers.getContractFactory("BasketeerRegistry");
        const registry = await Registry.deploy();
        await registry.waitForDeployment();
        const registryAddress = await registry.getAddress();
        console.log("✅ Registry:", registryAddress);
        
        // 第三步：部署极简部署者
        console.log("\n📦 Step 3: Deploying tiny deployer...");
        const Deployer = await ethers.getContractFactory("BasketeerDeployer");
        const deployerContract = await Deployer.deploy(
            oracleAddress,
            pricingAddress,
            tradingAddress
        );
        await deployerContract.waitForDeployment();
        const deployerAddress = await deployerContract.getAddress();
        console.log("✅ Deployer:", deployerAddress);
        
        // 第四步：测试策略部署
        console.log("\n📦 Step 4: Testing strategy deployment...");
        
        const testTokens = [
            ethers.getAddress("0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"), // WBTC
            ethers.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")  // WETH
        ];
        
        const testWeights = [5000, 5000]; // 50-50
        const testPairs = [
            ethers.getAddress("0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11"),
            ethers.getAddress("0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11")
        ];
        const DAI = ethers.getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F");
        
        /*
        // 测试策略部署（取消注释执行）
        console.log("Creating test strategy...");
        const deployTx = await deployerContract.deployStrategy(
            testTokens,
            testWeights,
            "Ultra-Minimal Strategy",
            "UMS",
            DAI,
            testPairs
        );
        
        const receipt = await deployTx.wait();
        console.log("✅ Strategy deployed! Gas used:", receipt.gasUsed.toString());
        
        // 从事件中获取策略地址
        const deployEvent = receipt.logs.find(log => 
            log.topics[0] === deployerContract.interface.getEvent('StrategyDeployed').topicHash
        );
        const strategyAddress = ethers.getAddress('0x' + deployEvent.topics[1].slice(26));
        console.log("📍 Strategy address:", strategyAddress);
        
        // 注册到注册表
        const registerTx = await registry.registerStrategy(strategyAddress);
        await registerTx.wait();
        console.log("✅ Strategy registered");
        
        // 验证
        const isRegistered = await registry.isStrategy(strategyAddress);
        console.log("✅ Registration verified:", isRegistered);
        */
        
        console.log("\n✅ Ultra-Minimal Architecture deployed!");
        
        console.log("\n📋 Component Summary:");
        console.log("🔧 Core Modules:");
        console.log("  - Oracle:", oracleAddress);
        console.log("  - Pricing:", pricingAddress);
        console.log("  - Trading:", tradingAddress);
        console.log("📚 Management:");
        console.log("  - Registry:", registryAddress);
        console.log("  - Deployer:", deployerAddress);
        
        console.log("\n🎯 Ultra-Minimal Benefits:");
        console.log("✅ Each contract is as small as possible");
        console.log("✅ Complete separation of concerns");
        console.log("✅ Registry and deployer are tiny");
        console.log("✅ Modules are reusable across all strategies");
        console.log("✅ No complex factory logic");
        
        console.log("\n📋 Usage Pattern:");
        console.log("1. Deploy strategy: deployer.deployStrategy(...)");
        console.log("2. Register strategy: registry.registerStrategy(address)");
        console.log("3. Query strategies: registry.getCreatorStrategies(creator)");
        console.log("4. Use strategy: strategy.depositSingle(...) / withdraw(...)");
        
        return {
            modules: {
                oracle: oracleAddress,
                pricing: pricingAddress,
                trading: tradingAddress
            },
            registry: registryAddress,
            deployer: deployerAddress,
            deployer_account: deployer.address
        };
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        
        if (error.message.includes("code is too large")) {
            console.log("🚨 STILL too large! Need even more aggressive splitting");
            console.log("💡 Consider removing more functionality or using CREATE2");
        }
        
        throw error;
    }
}

main()
    .then((result) => {
        console.log("\n🎉 Ultra-Minimal deployment success!");
        console.log("📊 Result:", JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Still failed:", error);
        console.log("\n🔥 If this still fails, we need to:");
        console.log("1. Remove even more code from contracts");
        console.log("2. Use external libraries");
        console.log("3. Consider proxy patterns");
        console.log("4. Or use CREATE2 deployment");
        process.exit(1);
    });
