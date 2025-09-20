const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 Deploying BTC-ETH-SOL-BNB Strategy on Monad Network");
    console.log("Network:", await ethers.provider.getNetwork());
    console.log("Account:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    // === Monad 网络真实合约地址 ===
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
    
    const strategyName = "Monad BTC-ETH-SOL-BNB Portfolio";
    const strategySymbol = "mBESB";
    
    try {
        // 第一步：部署模块合约
        console.log("\n📦 Step 1: Deploying modules on Monad...");
        
        // 1. Oracle Module
        console.log("Deploying Oracle Module...");
        const OracleModule = await ethers.getContractFactory("OracleModuleV2");
        const oracleModule = await OracleModule.deploy();
        await oracleModule.waitForDeployment();
        const oracleAddress = await oracleModule.getAddress();
        console.log("✅ Oracle Module:", oracleAddress);
        
        // 2. Pricing Module
        console.log("Deploying Pricing Module...");
        const PricingModule = await ethers.getContractFactory("PricingModuleV2");
        const pricingModule = await PricingModule.deploy(oracleAddress);
        await pricingModule.waitForDeployment();
        const pricingAddress = await pricingModule.getAddress();
        console.log("✅ Pricing Module:", pricingAddress);
        
        // 3. Trading Module
        console.log("Deploying Trading Module...");
        const TradingModule = await ethers.getContractFactory("TradingModuleV2");
        const tradingModule = await TradingModule.deploy(ROUTER);
        await tradingModule.waitForDeployment();
        const tradingAddress = await tradingModule.getAddress();
        console.log("✅ Trading Module:", tradingAddress);
        
        // 第二步：部署管理合约
        console.log("\n📦 Step 2: Deploying management contracts...");
        
        // Registry
        console.log("Deploying Registry...");
        const Registry = await ethers.getContractFactory("BasketeerRegistry");
        const registry = await Registry.deploy();
        await registry.waitForDeployment();
        const registryAddress = await registry.getAddress();
        console.log("✅ Registry:", registryAddress);
        
        // Deployer
        console.log("Deploying Deployer...");
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
        console.log("\n📦 Step 3: Creating BTC-ETH-SOL-BNB strategy...");
        console.log("📊 Strategy composition:");
        console.log("  - WBTC (Bitcoin): 50%");
        console.log("  - WETH (Ethereum): 25%");
        console.log("  - SOL (Solana): 15%");
        console.log("  - BNB (Binance): 10%");
        
        console.log("\nDeploying strategy contract...");
        const deployTx = await deployerContract.deployStrategy(
            strategyTokens,
            strategyWeights,
            strategyName,
            strategySymbol,
            USDT, // 使用 USDT 作为基准
            strategyPairs,
            {
                gasLimit: 8000000 // 明确设置gas限制
            }
        );
        
        console.log("📤 Transaction sent:", deployTx.hash);
        const receipt = await deployTx.wait();
        console.log("✅ Strategy deployed! Gas used:", receipt.gasUsed.toString());
        
        // 从事件中获取策略地址
        let strategyAddress;
        for (const log of receipt.logs) {
            try {
                const parsed = deployerContract.interface.parseLog(log);
                if (parsed.name === 'StrategyDeployed') {
                    strategyAddress = parsed.args.strategy;
                    break;
                }
            } catch (e) {
                // 继续查找
            }
        }
        
        if (!strategyAddress) {
            throw new Error("Could not find StrategyDeployed event in transaction logs");
        }
        
        console.log("📍 Strategy address:", strategyAddress);
        
        // 注册策略
        console.log("\n📦 Step 4: Registering strategy...");
        const registerTx = await registry.registerStrategy(strategyAddress);
        await registerTx.wait();
        console.log("✅ Strategy registered in registry");
        
        // 验证策略
        console.log("\n🔍 Strategy verification:");
        const strategy = await ethers.getContractAt("BasketeerV4", strategyAddress);
        
        const tokensLength = await strategy.tokensLength();
        console.log("- Tokens count:", tokensLength.toString());
        
        const sharesContract = await strategy.shares();
        const shares = await ethers.getContractAt("BasketShares", sharesContract);
        const shareName = await shares.name();
        const shareSymbol = await shares.symbol();
        
        console.log("- Strategy name:", shareName);
        console.log("- Strategy symbol:", shareSymbol);
        console.log("- Shares contract:", sharesContract);
        
        // 尝试获取初始净值
        try {
            const initialValue = await strategy.basketUsd();
            console.log("- Initial basket value:", ethers.formatEther(initialValue), "USDT");
        } catch (error) {
            console.log("- Initial value: 0 USDT (no tokens deposited yet)");
        }
        
        console.log("\n🎉 Monad Strategy Deployment Completed!");
        
        console.log("\n📋 Contract Addresses on Monad:");
        console.log("🔧 Core Modules:");
        console.log("  - Oracle Module:", oracleAddress);
        console.log("  - Pricing Module:", pricingAddress);
        console.log("  - Trading Module:", tradingAddress);
        console.log("📚 Management:");
        console.log("  - Registry:", registryAddress);
        console.log("  - Deployer:", deployerAddress);
        console.log("📊 Strategy:");
        console.log("  - Strategy Contract:", strategyAddress);
        console.log("  - Shares Token:", sharesContract);
        
        console.log("\n🌐 Monad Explorer Links:");
        console.log(`  - Strategy: https://testnet.monadexplorer.com/address/${strategyAddress}`);
        console.log(`  - Registry: https://testnet.monadexplorer.com/address/${registryAddress}`);
        console.log(`  - Oracle: https://testnet.monadexplorer.com/address/${oracleAddress}`);
        
        console.log("\n📋 Next Steps:");
        console.log("1. Wait 5+ minutes for TWAP window");
        console.log("2. Update oracles for price feeds:");
        console.log(`   strategy.updateOracle("${strategyTokens[0]}") // WBTC`);
        console.log(`   strategy.updateOracle("${strategyTokens[1]}") // WETH`);
        console.log(`   strategy.updateOracle("${strategyTokens[2]}") // SOL`);
        console.log(`   strategy.updateOracle("${strategyTokens[3]}") // BNB`);
        console.log("3. Users can deposit USDT to get diversified exposure");
        console.log("4. Users can withdraw to get proportional tokens back");
        
        return {
            network: "monad",
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
                shares: sharesContract,
                name: strategyName,
                symbol: strategySymbol,
                composition: {
                    WBTC: "50%",
                    WETH: "25%",
                    SOL: "15%",
                    BNB: "10%"
                }
            },
            deployer: deployer.address,
            explorerBase: "https://testnet.monadexplorer.com/address/"
        };
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        
        if (error.message.includes("code is too large")) {
            console.log("🚨 Contract still too large!");
            console.log("💡 May need further optimization");
        } else if (error.message.includes("function returned an unexpected amount of data")) {
            console.log("🚨 Contract address issue!");
            console.log("💡 Some provided addresses may not be valid contracts on Monad");
        }
        
        throw error;
    }
}

main()
    .then((result) => {
        console.log("\n🎊 Monad deployment completed successfully!");
        console.log("📊 Final result:", JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
