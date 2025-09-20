const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🔍 Deploying BasketeerQuery Contract on Monad");
    console.log("Network:", await ethers.provider.getNetwork());
    console.log("Account:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    // === 已部署的合约地址 ===
    const DEPLOYED_ADDRESSES = {
        // 核心模块
        oracle: "0x8753c059Ff1A069EDBB6c49644f29D20C19C14C9",
        pricing: "0x4036A4F9c96F012a2f7e02DEA50c16fFb97acb85",
        trading: "0xfA9FF78023050D8066167024CE492A0C8bf20dbA",
        
        // 管理合约
        registry: "0x771069BC8C34C30b1F39a3C59193056dFF6bF63f",
        deployer: "0x60ee57163bc08A83aB381D79819927f82F8dD31a",
        
        // 策略合约
        strategy: "0x83D79bC1526797cbE998626Dcd73E4C063c27C9d",
        shares: "0x0607D96740Bb0113892EaFe3F6f3b3413742510d"
    };
    
    // === 代币地址 ===
    const TOKEN_ADDRESSES = {
        USDT: "0x8D13bbDbCea96375c25e5eDb679613AA480d5E27",
        WBTC: "0xC5ae99a1B0b8d307F5D33343b442ab21Ca9dD475",
        WETH: "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3",
        SOL: "0x4175df4399Ac18A9E60148b21575ceb5eb5edc35",
        BNB: "0xf04b6BcBBcCc6Cd981D53830EF1dFeA783Ba3feB"
    };
    
    try {
        // 验证已部署的合约
        console.log("\n🔍 Verifying deployed contracts...");
        
        // 验证注册表
        const registry = await ethers.getContractAt("BasketeerRegistry", DEPLOYED_ADDRESSES.registry);
        const strategiesCount = await registry.getStrategiesCount();
        console.log("✅ Registry verified - Strategies count:", strategiesCount.toString());
        
        // 验证策略
        const strategy = await ethers.getContractAt("BasketeerV4", DEPLOYED_ADDRESSES.strategy);
        const tokensLength = await strategy.tokensLength();
        const shares = await ethers.getContractAt("BasketShares", DEPLOYED_ADDRESSES.shares);
        const strategyName = await shares.name();
        const strategySymbol = await shares.symbol();
        
        console.log("✅ Strategy verified:");
        console.log("  - Name:", strategyName);
        console.log("  - Symbol:", strategySymbol);
        console.log("  - Tokens count:", tokensLength.toString());
        
        // 部署查询合约
        console.log("\n📦 Deploying BasketeerQuery contract...");
        const QueryContract = await ethers.getContractFactory("BasketeerQuery");
        const queryContract = await QueryContract.deploy(
            DEPLOYED_ADDRESSES.registry,
            {
                gasLimit: 8000000
            }
        );
        
        await queryContract.waitForDeployment();
        const queryAddress = await queryContract.getAddress();
        console.log("✅ BasketeerQuery deployed:", queryAddress);
        
        // 测试查询功能
        console.log("\n🧪 Testing query functions...");
        
        // 1. 测试策略信息查询
        console.log("Testing strategy info query...");
        const strategyInfo = await queryContract.getStrategyInfo(DEPLOYED_ADDRESSES.strategy);
        console.log("✅ Strategy Info:");
        console.log("  - Name:", strategyInfo.name);
        console.log("  - Symbol:", strategyInfo.symbol);
        console.log("  - Total Shares:", ethers.formatEther(strategyInfo.totalShares));
        console.log("  - Total Value:", ethers.formatEther(strategyInfo.totalValue), "USDT");
        console.log("  - Share Price:", ethers.formatEther(strategyInfo.sharePrice), "USDT per share");
        console.log("  - Tokens Count:", strategyInfo.tokensCount.toString());
        console.log("  - Is Active:", strategyInfo.isActive);
        
        // 2. 测试所有策略查询
        console.log("\nTesting all strategies query...");
        const allStrategies = await queryContract.getAllStrategiesInfo();
        console.log("✅ All Strategies:");
        allStrategies.forEach((info, index) => {
            console.log(`  ${index + 1}. ${info.name} (${info.symbol})`);
            console.log(`     Address: ${info.strategyAddress}`);
            console.log(`     Value: ${ethers.formatEther(info.totalValue)} USDT`);
        });
        
        // 3. 测试策略组成查询
        console.log("\nTesting strategy composition query...");
        const composition = await queryContract.getStrategyComposition(DEPLOYED_ADDRESSES.strategy);
        console.log("✅ Strategy Composition:");
        composition.forEach((token, index) => {
            const weight = (Number(token.weight) / 100).toFixed(1);
            const balance = ethers.formatEther(token.balance);
            const value = ethers.formatEther(token.value);
            console.log(`  ${index + 1}. Token: ${token.token}`);
            console.log(`     Weight: ${weight}%`);
            console.log(`     Balance: ${balance}`);
            console.log(`     Value: ${value} USDT`);
        });
        
        // 4. 测试健康状态查询
        console.log("\nTesting strategy health query...");
        const health = await queryContract.getStrategyHealth(DEPLOYED_ADDRESSES.strategy);
        console.log("✅ Strategy Health:");
        console.log("  - Oracle Active:", health.oracleActive);
        console.log("  - Has Liquidity:", health.hasLiquidity);
        console.log("  - Status:", health.status);
        
        // 5. 测试用户持有查询（使用部署者地址）
        console.log("\nTesting user holding query...");
        const userHolding = await queryContract.getUserHolding(DEPLOYED_ADDRESSES.strategy, deployer.address);
        console.log("✅ User Holding:");
        console.log("  - Shares:", ethers.formatEther(userHolding.shares));
        console.log("  - Value:", ethers.formatEther(userHolding.value), "USDT");
        console.log("  - Percentage:", (Number(userHolding.percentage) / 100).toFixed(4), "%");
        
        console.log("\n🎉 Query Contract Deployment and Testing Completed!");
        
        console.log("\n📋 Complete Contract Addresses on Monad:");
        console.log("🔧 Core Modules:");
        console.log("  - Oracle Module:", DEPLOYED_ADDRESSES.oracle);
        console.log("  - Pricing Module:", DEPLOYED_ADDRESSES.pricing);
        console.log("  - Trading Module:", DEPLOYED_ADDRESSES.trading);
        console.log("📚 Management:");
        console.log("  - Registry:", DEPLOYED_ADDRESSES.registry);
        console.log("  - Deployer:", DEPLOYED_ADDRESSES.deployer);
        console.log("  - Query Contract:", queryAddress, "🆕");
        console.log("📊 Strategy:");
        console.log("  - Strategy Contract:", DEPLOYED_ADDRESSES.strategy);
        console.log("  - Shares Token:", DEPLOYED_ADDRESSES.shares);
        
        console.log("\n🌐 Monad Explorer Links:");
        console.log(`  - Query Contract: https://testnet.monadexplorer.com/address/${queryAddress}`);
        console.log(`  - Strategy: https://testnet.monadexplorer.com/address/${DEPLOYED_ADDRESSES.strategy}`);
        console.log(`  - Registry: https://testnet.monadexplorer.com/address/${DEPLOYED_ADDRESSES.registry}`);
        
        console.log("\n🔍 Query Interface Usage:");
        console.log("```javascript");
        console.log("const queryInterface = new BasketeerQueryInterface(");
        console.log(`  "${queryAddress}",`);
        console.log(`  "${DEPLOYED_ADDRESSES.registry}",`);
        console.log("  provider");
        console.log(");");
        console.log("");
        console.log("// 获取策略信息");
        console.log(`const info = await queryInterface.getStrategyInfo("${DEPLOYED_ADDRESSES.strategy}");`);
        console.log("");
        console.log("// 获取用户持有");
        console.log(`const holding = await queryInterface.getUserHolding("${DEPLOYED_ADDRESSES.strategy}", userAddress);`);
        console.log("```");
        
        console.log("\n📊 BTC-ETH-SOL-BNB Strategy Information:");
        console.log("  - Strategy Name: Monad BTC-ETH-SOL-BNB Portfolio");
        console.log("  - Strategy Symbol: mBESB");
        console.log("  - Composition:");
        console.log("    • WBTC (Bitcoin): 50%");
        console.log("    • WETH (Ethereum): 25%");
        console.log("    • SOL (Solana): 15%");
        console.log("    • BNB (Binance): 10%");
        
        console.log("\n📋 Next Steps for Users:");
        console.log("1. Wait 5+ minutes for TWAP window");
        console.log("2. Update oracles using strategy contract");
        console.log("3. Deposit USDT to get diversified crypto exposure");
        console.log("4. Use query contract to monitor portfolio");
        
        return {
            network: "monad",
            queryContract: queryAddress,
            addresses: DEPLOYED_ADDRESSES,
            tokens: TOKEN_ADDRESSES,
            strategyInfo: {
                name: strategyName,
                symbol: strategySymbol,
                composition: {
                    WBTC: "50%",
                    WETH: "25%",
                    SOL: "15%",
                    BNB: "10%"
                }
            },
            explorerBase: "https://testnet.monadexplorer.com/address/",
            deployer: deployer.address
        };
        
    } catch (error) {
        console.error("❌ Query contract deployment failed:", error.message);
        
        if (error.message.includes("code is too large")) {
            console.log("🚨 Query contract too large!");
            console.log("💡 May need to simplify the query contract");
        }
        
        throw error;
    }
}

main()
    .then((result) => {
        console.log("\n🎊 Query contract deployment completed successfully!");
        console.log("📊 Final result:", JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
