const { ethers } = require("hardhat");
const { BasketeerAPI } = require('./basketeer-api.js');

/**
 * Basketeer API 使用示例
 * 演示完整的策略创建、存取款和查询流程
 */

// Monad 网络已部署的合约地址
const MONAD_CONTRACTS = {
    registry: "0x771069BC8C34C30b1F39a3C59193056dFF6bF63f",
    deployer: "0x60ee57163bc08A83aB381D79819927f82F8dD31a",
    query: null, // 需要部署
    modules: {
        oracle: "0x8753c059Ff1A069EDBB6c49644f29D20C19C14C9",
        pricing: "0x4036A4F9c96F012a2f7e02DEA50c16fFb97acb85",
        trading: "0xfA9FF78023050D8066167024CE492A0C8bf20dbA"
    }
};

// Monad 测试网络代币地址
const MONAD_TOKENS = {
    USDT: "0x8D13bbDbCea96375c25e5eDb679613AA480d5E27",
    WBTC: "0xC5ae99a1B0b8d307F5D33343b442ab21Ca9dD475",
    WETH: "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3",
    SOL: "0x4175df4399Ac18A9E60148b21575ceb5eb5edc35",
    BNB: "0xf04b6BcBBcCc6Cd981D53830EF1dFeA783Ba3feB"
};

// Uniswap V2 交易对地址（假设）
const MONAD_PAIRS = {
    "WBTC-USDT": "0x1234567890123456789012345678901234567890",
    "WETH-USDT": "0x2345678901234567890123456789012345678901", 
    "SOL-USDT": "0x3456789012345678901234567890123456789012",
    "BNB-USDT": "0x4567890123456789012345678901234567890123"
};

const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

async function main() {
    console.log("🚀 Basketeer API 完整使用示例");
    console.log("===================================");
    
    const [signer] = await ethers.getSigners();
    const provider = ethers.provider;
    
    console.log("📋 连接信息:");
    console.log("  网络:", (await provider.getNetwork()).name);
    console.log("  账户:", signer.address);
    console.log("  余额:", ethers.formatEther(await provider.getBalance(signer.address)), "ETH");
    
    // 初始化 API
    const basketeerAPI = new BasketeerAPI(MONAD_CONTRACTS, signer, provider);
    
    try {
        // ========================================
        // 1. 查询现有策略
        // ========================================
        console.log("\n📊 步骤 1: 查询现有策略");
        console.log("------------------------");
        
        const allStrategies = await basketeerAPI.getAllStrategies();
        console.log(`找到 ${allStrategies.length} 个策略:`);
        
        if (allStrategies.length > 0) {
            for (let i = 0; i < allStrategies.length; i++) {
                const strategy = allStrategies[i];
                const info = await basketeerAPI.getStrategyInfo(strategy);
                
                console.log(`  ${i + 1}. ${info.name} (${info.symbol})`);
                console.log(`     地址: ${strategy}`);
                console.log(`     总净值: ${basketeerAPI.formatValue(info.totalValue)} USDT`);
                console.log(`     单位净值: ${basketeerAPI.formatValue(info.sharePrice)} USDT/份额`);
                console.log(`     总份额: ${basketeerAPI.formatValue(info.totalShares)}`);
                console.log(`     代币数量: ${info.tokensCount}`);
                
                // 查询策略组成
                const composition = await basketeerAPI.getStrategyComposition(strategy);
                console.log(`     组成:`);
                composition.forEach((token, index) => {
                    const weight = Number(token.weight) / 100;
                    console.log(`       ${index + 1}. 权重: ${weight}%, 余额: ${basketeerAPI.formatValue(token.balance)}, 价值: ${basketeerAPI.formatValue(token.value)} USDT`);
                });
            }
        }

        // ========================================
        // 2. 创建新策略（示例：简化版DeFi指数）
        // ========================================
        console.log("\n🏗️ 步骤 2: 创建新策略");
        console.log("------------------------");
        
        const newStrategyConfig = {
            tokens: [
                MONAD_TOKENS.WETH,  // 以太坊
                MONAD_TOKENS.WBTC   // 比特币
            ],
            weights: [6000, 4000], // 60% ETH, 40% BTC
            name: "ETH-BTC Simple Index",
            symbol: "ETHBTC",
            usdToken: MONAD_TOKENS.USDT,
            router: UNISWAP_ROUTER,
            pairs: [
                MONAD_PAIRS["WETH-USDT"],
                MONAD_PAIRS["WBTC-USDT"]
            ]
        };
        
        console.log("创建策略配置:");
        console.log("  名称:", newStrategyConfig.name);
        console.log("  符号:", newStrategyConfig.symbol);
        console.log("  组成:");
        console.log("    ETH: 60%");
        console.log("    BTC: 40%");
        
        // 注意：这里只是演示，实际部署需要有效的交易对地址
        // const newStrategy = await basketeerAPI.createStrategy(newStrategyConfig);
        // console.log("✅ 新策略创建成功:", newStrategy);

        // ========================================
        // 3. 使用现有策略进行存取款演示
        // ========================================
        if (allStrategies.length > 0) {
            const targetStrategy = allStrategies[0];
            
            console.log(`\n💰 步骤 3: 存取款演示 (策略: ${targetStrategy})`);
            console.log("----------------------------------------");
            
            // 3.1 查询用户当前持有
            console.log("3.1 查询当前持有:");
            const currentHolding = await basketeerAPI.getUserHolding(targetStrategy);
            console.log("  当前份额:", basketeerAPI.formatValue(currentHolding.shares));
            console.log("  当前价值:", basketeerAPI.formatValue(currentHolding.value), "USDT");
            console.log("  持有占比:", Number(currentHolding.percentage) / 100, "%");
            
            // 3.2 存款演示（注释掉，避免实际执行）
            /*
            console.log("\n3.2 存款演示:");
            const depositAmount = basketeerAPI.parseValue("100"); // 100 USDT
            
            // 这里需要前端计算最优路径和滑点保护
            const minOuts = [
                basketeerAPI.parseValue("0"), // 最小输出，实际应该计算
                basketeerAPI.parseValue("0")
            ];
            const paths = [
                [MONAD_TOKENS.USDT, MONAD_TOKENS.WETH],
                [MONAD_TOKENS.USDT, MONAD_TOKENS.WBTC]
            ];
            
            const depositResult = await basketeerAPI.depositSingle(
                targetStrategy,
                MONAD_TOKENS.USDT,
                depositAmount,
                minOuts,
                paths
            );
            console.log("✅ 存款成功:", depositResult);
            */
            
            // 3.3 提款演示（注释掉，避免实际执行）
            /*
            if (BigInt(currentHolding.shares) > 0) {
                console.log("\n3.3 提款演示:");
                const withdrawShares = basketeerAPI.parseValue("10"); // 提取10份额
                
                const withdrawResult = await basketeerAPI.withdraw(
                    targetStrategy,
                    withdrawShares
                );
                console.log("✅ 提款成功:", withdrawResult);
            }
            */
        }

        // ========================================
        // 4. 用户投资组合查询
        // ========================================
        console.log("\n📈 步骤 4: 用户投资组合");
        console.log("------------------------");
        
        const userPortfolio = await basketeerAPI.getUserPortfolio();
        
        if (userPortfolio.length > 0) {
            console.log(`用户总共持有 ${userPortfolio.length} 个策略的份额:`);
            
            let totalValue = 0;
            userPortfolio.forEach((holding, index) => {
                const value = Number(basketeerAPI.formatValue(holding.value));
                totalValue += value;
                
                console.log(`  ${index + 1}. ${holding.strategyName} (${holding.strategySymbol})`);
                console.log(`     份额: ${basketeerAPI.formatValue(holding.shares)}`);
                console.log(`     价值: ${value.toFixed(2)} USDT`);
                console.log(`     占比: ${Number(holding.percentage) / 100}%`);
            });
            
            console.log(`\n总投资价值: ${totalValue.toFixed(2)} USDT`);
        } else {
            console.log("用户当前没有任何策略投资");
        }

        // ========================================
        // 5. 预言机更新（如果需要）
        // ========================================
        if (allStrategies.length > 0) {
            console.log("\n🔄 步骤 5: 预言机更新");
            console.log("--------------------");
            
            const targetStrategy = allStrategies[0];
            
            console.log("更新策略的价格预言机...");
            // 注意：这里只是演示，实际执行需要等待TWAP窗口期
            // const updateResult = await basketeerAPI.updateOracles(targetStrategy);
            // console.log("✅ 预言机更新成功:", updateResult);
            
            console.log("💡 提示: 实际更新预言机需要:");
            console.log("  1. 等待至少5分钟的TWAP窗口期");
            console.log("  2. 确保交易对有足够的流动性");
            console.log("  3. 调用 updateOracles() 方法");
        }

        // ========================================
        // 6. 价格查询演示
        // ========================================
        console.log("\n💲 步骤 6: 代币价格查询");
        console.log("------------------------");
        
        const tokensToCheck = [
            { name: "WETH", address: MONAD_TOKENS.WETH },
            { name: "WBTC", address: MONAD_TOKENS.WBTC }
        ];
        
        for (const token of tokensToCheck) {
            try {
                const price = await basketeerAPI.getTokenPrice(token.address);
                console.log(`${token.name} 价格: ${basketeerAPI.formatValue(price)} USDT`);
            } catch (error) {
                console.log(`${token.name} 价格: 暂时无法获取 (${error.message})`);
            }
        }

        console.log("\n🎉 API 演示完成!");
        console.log("===============");
        
        console.log("\n📋 可用的 API 方法总结:");
        console.log("策略管理:");
        console.log("  - createStrategy(config)     创建新策略");
        console.log("  - registerStrategy(address)  注册策略");
        console.log("  - getAllStrategies()         获取所有策略");
        console.log("  - getCreatorStrategies()     获取创建者策略");
        
        console.log("\n存取款:");
        console.log("  - depositSingle(...)         单币存款");
        console.log("  - withdraw(strategy, shares) 提款");
        
        console.log("\n查询:");
        console.log("  - getStrategyInfo(address)   策略信息");
        console.log("  - getUserHolding(...)        用户持有");
        console.log("  - getUserPortfolio(user)     用户投资组合");
        console.log("  - getStrategyComposition(...) 策略组成");
        
        console.log("\n价格和预言机:");
        console.log("  - updateOracles(strategy)    更新预言机");
        console.log("  - getTokenPrice(token)       获取代币价格");
        
        console.log("\n工具方法:");
        console.log("  - formatValue(value)         格式化显示");
        console.log("  - parseValue(input)          解析用户输入");
        
    } catch (error) {
        console.error("❌ API 演示过程中出错:", error.message);
        throw error;
    }
}

// 导出给其他脚本使用
async function createAPIInstance() {
    const [signer] = await ethers.getSigners();
    const provider = ethers.provider;
    return new BasketeerAPI(MONAD_CONTRACTS, signer, provider);
}

// 快捷查询函数
async function quickQuery(strategyAddress = null) {
    const api = await createAPIInstance();
    
    if (!strategyAddress) {
        const strategies = await api.getAllStrategies();
        if (strategies.length === 0) {
            console.log("没有找到任何策略");
            return;
        }
        strategyAddress = strategies[0];
    }
    
    console.log("📊 策略快速查询:", strategyAddress);
    
    const info = await api.getStrategyInfo(strategyAddress);
    const composition = await api.getStrategyComposition(strategyAddress);
    const userHolding = await api.getUserHolding(strategyAddress);
    
    console.log("基本信息:");
    console.log("  名称:", info.name);
    console.log("  总净值:", api.formatValue(info.totalValue), "USDT");
    console.log("  单位净值:", api.formatValue(info.sharePrice), "USDT/份额");
    
    console.log("组成:");
    composition.forEach((token, i) => {
        console.log(`  ${i + 1}. 权重: ${Number(token.weight)/100}%, 价值: ${api.formatValue(token.value)} USDT`);
    });
    
    console.log("我的持有:");
    console.log("  份额:", api.formatValue(userHolding.shares));
    console.log("  价值:", api.formatValue(userHolding.value), "USDT");
}

module.exports = { 
    BasketeerAPI, 
    createAPIInstance, 
    quickQuery,
    MONAD_CONTRACTS,
    MONAD_TOKENS,
    MONAD_PAIRS
};

// 如果直接运行此脚本
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
