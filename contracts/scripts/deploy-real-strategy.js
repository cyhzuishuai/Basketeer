const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 Deploying Real Basketeer Strategy");
    console.log("Account:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    // === 真实合约地址 ===
    const ROUTER = "0x6BCDFA953d800D21B14301738f8ce2728Bb5C87b";
    const WETH = "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3";
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
    
    const strategyName = "BTC-ETH-SOL-BNB Portfolio";
    const strategySymbol = "BESB";
    
    try {
        // 第一步：部署模块合约
        console.log("\n📦 Step 1: Deploying modules...");
        
        // 1. Oracle Module
        const OracleModule = await ethers.getContractFactory("OracleModuleV2");
        const oracleModule = await OracleModule.deploy();
        await oracleModule.waitForDeployment();
        const oracleAddress = await oracleModule.getAddress();
        console.log("✅ Oracle Module:", oracleAddress);
        
        // 2. Pricing Module
        const PricingModule = await ethers.getContractFactory("PricingModuleV2");
        const pricingModule = await PricingModule.deploy(oracleAddress);
        await pricingModule.waitForDeployment();
        const pricingAddress = await pricingModule.getAddress();
        console.log("✅ Pricing Module:", pricingAddress);
        
        // 3. Trading Module
        const TradingModule = await ethers.getContractFactory("TradingModuleV2");
        const tradingModule = await TradingModule.deploy(ROUTER);
        await tradingModule.waitForDeployment();
        const tradingAddress = await tradingModule.getAddress();
        console.log("✅ Trading Module:", tradingAddress);
        
        // 第二步：部署管理合约
        console.log("\n📦 Step 2: Deploying management contracts...");
        
        // Registry
        const Registry = await ethers.getContractFactory("BasketeerRegistry");
        const registry = await Registry.deploy();
        await registry.waitForDeployment();
        const registryAddress = await registry.getAddress();
        console.log("✅ Registry:", registryAddress);
        
        // Deployer
        const Deployer = await ethers.getContractFactory("BasketeerDeployer");
        const deployerContract = await Deployer.deploy(
            oracleAddress,
            pricingAddress,
            tradingAddress
        );
        await deployerContract.waitForDeployment();
        const deployerAddress = await deployerContract.getAddress();
        console.log("✅ Deployer:", deployerAddress);
        
        // 第三步：创建策略
        console.log("\n📦 Step 3: Creating strategy...");
        console.log("📊 Strategy composition:");
        console.log("  - WBTC: 50%");
        console.log("  - WETH: 25%");
        console.log("  - SOL:  15%");
        console.log("  - BNB:  10%");
        
        const deployTx = await deployerContract.deployStrategy(
            strategyTokens,
            strategyWeights,
            strategyName,
            strategySymbol,
            USDT, // 使用 USDT 作为基准
            strategyPairs
        );
        
        const receipt = await deployTx.wait();
        console.log("✅ Strategy deployed! Gas used:", receipt.gasUsed.toString());
        
        // 从事件中获取策略地址
        const deployEvent = receipt.logs.find(log => {
            try {
                const parsed = deployerContract.interface.parseLog(log);
                return parsed.name === 'StrategyDeployed';
            } catch {
                return false;
            }
        });
        
        if (deployEvent) {
            const parsed = deployerContract.interface.parseLog(deployEvent);
            const strategyAddress = parsed.args.strategy;
            console.log("📍 Strategy address:", strategyAddress);
            
            // 注册策略
            console.log("\n📦 Step 4: Registering strategy...");
            const registerTx = await registry.registerStrategy(strategyAddress);
            await registerTx.wait();
            console.log("✅ Strategy registered");
            
            // 验证策略
            const strategy = await ethers.getContractAt("BasketeerV4", strategyAddress);
            
            console.log("\n🔍 Strategy verification:");
            const tokensLength = await strategy.tokensLength();
            console.log("- Tokens count:", tokensLength.toString());
            
            const sharesAddress = await strategy.shares();
            console.log("- Shares token:", sharesAddress);
            
            // 尝试获取初始净值
            try {
                const initialValue = await strategy.basketUsd();
                console.log("- Initial basket value:", ethers.formatEther(initialValue), "USDT");
            } catch (error) {
                console.log("- Initial value: 0 (no tokens yet)");
            }
            
            console.log("\n🎉 Strategy creation completed!");
            console.log("\n📋 Contract Addresses:");
            console.log("🔧 Core Modules:");
            console.log("  - Oracle:", oracleAddress);
            console.log("  - Pricing:", pricingAddress);
            console.log("  - Trading:", tradingAddress);
            console.log("📚 Management:");
            console.log("  - Registry:", registryAddress);
            console.log("  - Deployer:", deployerAddress);
            console.log("📊 Strategy:");
            console.log("  - Strategy Contract:", strategyAddress);
            console.log("  - Shares Token:", sharesAddress);
            
            console.log("\n📋 Next Steps:");
            console.log("1. Update oracles for each token:");
            console.log("   strategy.updateOracle('WBTC_ADDRESS')");
            console.log("   strategy.updateOracle('WETH_ADDRESS')");
            console.log("   strategy.updateOracle('SOL_ADDRESS')");
            console.log("   strategy.updateOracle('BNB_ADDRESS')");
            console.log("");
            console.log("2. Users can deposit:");
            console.log("   strategy.depositSingle(tokenIn, amount, minOuts, paths, deadline)");
            console.log("");
            console.log("3. Users can withdraw:");
            console.log("   strategy.withdraw(sharesAmount)");
            
            return {
                modules: {
                    oracle: oracleAddress,
                    pricing: pricingAddress,
                    trading: tradingAddress
                },
                management: {
                    registry: registryAddress,
                    deployer: deployerAddress
                },
                strategy: {
                    address: strategyAddress,
                    shares: sharesAddress,
                    name: strategyName,
                    symbol: strategySymbol,
                    composition: {
                        WBTC: "50%",
                        WETH: "25%",
                        SOL: "15%",
                        BNB: "10%"
                    }
                },
                deployer: deployer.address
            };
            
        } else {
            throw new Error("Could not find StrategyDeployed event");
        }
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        
        if (error.message.includes("code is too large")) {
            console.log("🚨 Contract still too large!");
            console.log("💡 May need further optimization");
        }
        
        throw error;
    }
}

main()
    .then((result) => {
        console.log("\n🎊 Real strategy deployment completed!");
        console.log("📊 Final result:", JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
