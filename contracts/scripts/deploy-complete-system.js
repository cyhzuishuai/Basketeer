const { ethers } = require("hardhat");

/**
 * 完整的 Basketeer 系统部署脚本
 * 包括核心模块、管理合约、查询合约和示例策略
 */

async function main() {
    console.log("🚀 部署完整的 Basketeer 系统");
    console.log("================================");
    
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    
    console.log("📋 部署信息:");
    console.log("  网络:", network.name || "unknown");
    console.log("  链 ID:", network.chainId.toString());
    console.log("  部署者:", deployer.address);
    console.log("  余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    // 合约地址存储
    const deployedContracts = {
        network: network.name || "unknown",
        chainId: network.chainId.toString(),
        deployer: deployer.address,
        modules: {},
        management: {},
        query: null,
        examples: []
    };
    
    try {
        // ========================================
        // 第一步：部署核心模块
        // ========================================
        console.log("\n📦 第一步：部署核心模块");
        console.log("------------------------");
        
        // 1.1 部署 Oracle 模块
        console.log("部署 Oracle 模块...");
        const OracleModule = await ethers.getContractFactory("OracleModuleV2");
        const oracleModule = await OracleModule.deploy({
            gasLimit: 3000000
        });
        await oracleModule.waitForDeployment();
        deployedContracts.modules.oracle = await oracleModule.getAddress();
        console.log("✅ Oracle 模块:", deployedContracts.modules.oracle);
        
        // 1.2 部署 Pricing 模块
        console.log("部署 Pricing 模块...");
        const PricingModule = await ethers.getContractFactory("PricingModuleV2");
        const pricingModule = await PricingModule.deploy({
            gasLimit: 3000000
        });
        await pricingModule.waitForDeployment();
        deployedContracts.modules.pricing = await pricingModule.getAddress();
        console.log("✅ Pricing 模块:", deployedContracts.modules.pricing);
        
        // 1.3 部署 Trading 模块
        console.log("部署 Trading 模块...");
        const TradingModule = await ethers.getContractFactory("TradingModuleV2");
        const tradingModule = await TradingModule.deploy({
            gasLimit: 3000000
        });
        await tradingModule.waitForDeployment();
        deployedContracts.modules.trading = await tradingModule.getAddress();
        console.log("✅ Trading 模块:", deployedContracts.modules.trading);
        
        // ========================================
        // 第二步：部署管理合约
        // ========================================
        console.log("\n📚 第二步：部署管理合约");
        console.log("------------------------");
        
        // 2.1 部署注册表
        console.log("部署注册表...");
        const Registry = await ethers.getContractFactory("BasketeerRegistry");
        const registry = await Registry.deploy({
            gasLimit: 2000000
        });
        await registry.waitForDeployment();
        deployedContracts.management.registry = await registry.getAddress();
        console.log("✅ 注册表:", deployedContracts.management.registry);
        
        // 2.2 部署部署器
        console.log("部署部署器...");
        const Deployer = await ethers.getContractFactory("BasketeerDeployer");
        const deployerContract = await Deployer.deploy({
            gasLimit: 2000000
        });
        await deployerContract.waitForDeployment();
        deployedContracts.management.deployer = await deployerContract.getAddress();
        console.log("✅ 部署器:", deployedContracts.management.deployer);
        
        // ========================================
        // 第三步：部署查询合约
        // ========================================
        console.log("\n🔍 第三步：部署查询合约");
        console.log("------------------------");
        
        console.log("部署查询合约...");
        const QueryContract = await ethers.getContractFactory("BasketeerQuery");
        const queryContract = await QueryContract.deploy(
            deployedContracts.management.registry,
            {
                gasLimit: 5000000
            }
        );
        await queryContract.waitForDeployment();
        deployedContracts.query = await queryContract.getAddress();
        console.log("✅ 查询合约:", deployedContracts.query);
        
        // ========================================
        // 第四步：验证部署
        // ========================================
        console.log("\n🧪 第四步：验证部署");
        console.log("--------------------");
        
        // 验证注册表
        const strategiesCount = await registry.getStrategiesCount();
        console.log("✅ 注册表验证 - 策略数量:", strategiesCount.toString());
        
        // 验证查询合约
        try {
            const registryFromQuery = await queryContract.registry();
            console.log("✅ 查询合约验证 - 注册表地址:", registryFromQuery);
        } catch (error) {
            console.warn("⚠️ 查询合约验证失败:", error.message);
        }
        
        // ========================================
        // 第五步：创建示例策略（可选）
        // ========================================
        console.log("\n🎯 第五步：创建示例策略");
        console.log("------------------------");
        
        // 获取网络配置
        const networkConfig = getNetworkConfig(network.chainId);
        
        if (networkConfig) {
            console.log("检测到支持的网络，创建示例策略...");
            
            try {
                // 创建 ETH-BTC 示例策略
                const exampleConfig = {
                    tokens: [
                        ethers.getAddress(networkConfig.tokens.WETH),
                        ethers.getAddress(networkConfig.tokens.WBTC)
                    ],
                    weights: [6000, 4000], // 60% ETH, 40% BTC
                    name: "ETH-BTC Index Example",
                    symbol: "ETHBTC",
                    usdToken: ethers.getAddress(networkConfig.tokens.USDT),
                    router: ethers.getAddress(networkConfig.router),
                    pairs: [
                        ethers.getAddress(networkConfig.pairs["WETH-USDT"]),
                        ethers.getAddress(networkConfig.pairs["WBTC-USDT"])
                    ]
                };
                
                console.log("创建示例策略配置:");
                console.log("  名称:", exampleConfig.name);
                console.log("  组成: 60% WETH + 40% WBTC");
                
                // 部署策略
                const tx = await deployerContract.createStrategy(
                    exampleConfig.tokens,
                    exampleConfig.weights,
                    exampleConfig.name,
                    exampleConfig.symbol,
                    deployedContracts.modules.oracle,
                    deployedContracts.modules.pricing,
                    deployedContracts.modules.trading,
                    exampleConfig.usdToken,
                    exampleConfig.router,
                    exampleConfig.pairs,
                    {
                        gasLimit: 8000000
                    }
                );
                
                const receipt = await tx.wait();
                console.log("✅ 示例策略部署成功，Gas 使用:", receipt.gasUsed.toString());
                
                // 从事件中获取策略地址
                const strategyCreatedEvent = receipt.logs.find(
                    log => log.topics[0] === ethers.id("StrategyCreated(address,address,string,string)")
                );
                
                if (strategyCreatedEvent) {
                    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                        ['address', 'address', 'string', 'string'],
                        strategyCreatedEvent.data
                    );
                    const strategyAddress = decoded[0];
                    
                    console.log("📍 示例策略地址:", strategyAddress);
                    
                    // 注册策略
                    const registerTx = await registry.registerStrategy(
                        strategyAddress,
                        deployer.address
                    );
                    await registerTx.wait();
                    console.log("✅ 示例策略已注册到注册表");
                    
                    // 获取份额合约地址
                    const strategy = await ethers.getContractAt("BasketeerV4", strategyAddress);
                    const sharesAddress = await strategy.shares();
                    
                    deployedContracts.examples.push({
                        name: exampleConfig.name,
                        symbol: exampleConfig.symbol,
                        strategyAddress: strategyAddress,
                        sharesAddress: sharesAddress,
                        composition: "60% WETH + 40% WBTC"
                    });
                }
                
            } catch (error) {
                console.warn("⚠️ 示例策略创建失败:", error.message);
                console.log("💡 这通常是因为交易对地址无效，可以手动创建策略");
            }
        } else {
            console.log("⚠️ 不支持的网络，跳过示例策略创建");
            console.log("💡 你可以稍后手动创建策略");
        }
        
        // ========================================
        // 第六步：生成使用说明
        // ========================================
        console.log("\n📝 第六步：生成使用说明");
        console.log("------------------------");
        
        // 保存部署信息到文件
        const deploymentInfo = {
            ...deployedContracts,
            timestamp: new Date().toISOString(),
            blockNumber: await ethers.provider.getBlockNumber(),
            explorerBase: getExplorerBase(network.chainId)
        };
        
        // 写入部署信息文件
        const fs = require('fs');
        const deploymentFile = `deployment-${network.chainId}-${Date.now()}.json`;
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log("✅ 部署信息已保存到:", deploymentFile);
        
        // ========================================
        // 总结
        // ========================================
        console.log("\n🎉 系统部署完成!");
        console.log("=================");
        
        console.log("\n📋 完整合约地址:");
        console.log("🔧 核心模块:");
        console.log("  - Oracle 模块:", deployedContracts.modules.oracle);
        console.log("  - Pricing 模块:", deployedContracts.modules.pricing);
        console.log("  - Trading 模块:", deployedContracts.modules.trading);
        
        console.log("📚 管理合约:");
        console.log("  - 注册表:", deployedContracts.management.registry);
        console.log("  - 部署器:", deployedContracts.management.deployer);
        console.log("  - 查询合约:", deployedContracts.query);
        
        if (deployedContracts.examples.length > 0) {
            console.log("🎯 示例策略:");
            deployedContracts.examples.forEach((example, index) => {
                console.log(`  ${index + 1}. ${example.name} (${example.symbol})`);
                console.log(`     策略: ${example.strategyAddress}`);
                console.log(`     份额: ${example.sharesAddress}`);
                console.log(`     组成: ${example.composition}`);
            });
        }
        
        const explorerBase = getExplorerBase(network.chainId);
        if (explorerBase) {
            console.log("\n🌐 区块浏览器链接:");
            console.log(`  - 注册表: ${explorerBase}${deployedContracts.management.registry}`);
            console.log(`  - 查询合约: ${explorerBase}${deployedContracts.query}`);
            if (deployedContracts.examples.length > 0) {
                console.log(`  - 示例策略: ${explorerBase}${deployedContracts.examples[0].strategyAddress}`);
            }
        }
        
        console.log("\n🔧 API 使用示例:");
        console.log("```javascript");
        console.log("const { BasketeerAPI } = require('./scripts/basketeer-api.js');");
        console.log("");
        console.log("const contracts = {");
        console.log(`  registry: "${deployedContracts.management.registry}",`);
        console.log(`  deployer: "${deployedContracts.management.deployer}",`);
        console.log(`  query: "${deployedContracts.query}",`);
        console.log("  modules: {");
        console.log(`    oracle: "${deployedContracts.modules.oracle}",`);
        console.log(`    pricing: "${deployedContracts.modules.pricing}",`);
        console.log(`    trading: "${deployedContracts.modules.trading}"`);
        console.log("  }");
        console.log("};");
        console.log("");
        console.log("const api = new BasketeerAPI(contracts, signer, provider);");
        console.log("const strategies = await api.getAllStrategies();");
        console.log("```");
        
        console.log("\n📋 下一步操作:");
        console.log("1. 等待5分钟后更新价格预言机");
        console.log("2. 创建自定义投资策略");
        console.log("3. 开始投资和管理资产");
        console.log("4. 使用查询API监控投资组合");
        
        console.log("\n🎊 Basketeer 系统已就绪，开始你的DeFi投资之旅!");
        
        return deploymentInfo;
        
    } catch (error) {
        console.error("❌ 系统部署失败:", error.message);
        console.error("详细错误:", error);
        throw error;
    }
}

/**
 * 获取网络配置
 * @param {bigint} chainId 链ID
 * @returns {Object|null} 网络配置
 */
function getNetworkConfig(chainId) {
    const configs = {
        // Monad Testnet
        34443n: {
            name: "Monad Testnet",
            tokens: {
                USDT: "0x8D13bbDbCea96375c25e5eDb679613AA480d5E27",
                WETH: "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3",
                WBTC: "0xC5ae99a1B0b8d307F5D33343b442ab21Ca9dD475",
                SOL: "0x4175df4399Ac18A9E60148b21575ceb5eb5edc35",
                BNB: "0xf04b6BcBBcCc6Cd981D53830EF1dFeA783Ba3feB"
            },
            router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
            pairs: {
                "WETH-USDT": "0x1234567890123456789012345678901234567890",
                "WBTC-USDT": "0x2345678901234567890123456789012345678901",
                "SOL-USDT": "0x3456789012345678901234567890123456789012",
                "BNB-USDT": "0x4567890123456789012345678901234567890123"
            }
        }
        // 可以添加更多网络配置
    };
    
    return configs[chainId] || null;
}

/**
 * 获取区块浏览器基础URL
 * @param {bigint} chainId 链ID
 * @returns {string|null} 浏览器URL
 */
function getExplorerBase(chainId) {
    const explorers = {
        1n: "https://etherscan.io/address/",
        11155111n: "https://sepolia.etherscan.io/address/",
        34443n: "https://testnet.monadexplorer.com/address/"
    };
    
    return explorers[chainId] || null;
}

// 如果直接运行此脚本
if (require.main === module) {
    main()
        .then((result) => {
            console.log("\n🎊 部署成功完成!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("\n❌ 部署失败:", error);
            process.exit(1);
        });
}

module.exports = { main, getNetworkConfig, getExplorerBase };
