const { ethers } = require("hardhat");

async function main() {
    // 从 deploy-real-strategy.js 输出中填入策略地址
    const STRATEGY_ADDRESS = ""; // 请填入策略合约地址
    
    if (!STRATEGY_ADDRESS) {
        console.log("❌ Please set STRATEGY_ADDRESS first!");
        console.log("💡 Run deploy-real-strategy.js first and copy the strategy address");
        return;
    }
    
    const [user] = await ethers.getSigners();
    
    console.log("🎯 Interacting with BTC-ETH-SOL-BNB Strategy");
    console.log("User:", user.address);
    console.log("Strategy:", STRATEGY_ADDRESS);
    
    // 合约地址
    const USDT = "0x8D13bbDbCea96375c25e5eDb679613AA480d5E27";
    const WBTC = "0xC5ae99a1B0b8d307F5D33343b442ab21Ca9dD475";
    const WETH = "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3";
    const SOL = "0x4175df4399Ac18A9E60148b21575ceb5eb5edc35";
    const BNB = "0xf04b6BcBBcCc6Cd981D53830EF1dFeA783Ba3feB";
    
    try {
        // 连接到策略合约
        const strategy = await ethers.getContractAt("BasketeerV4", STRATEGY_ADDRESS);
        
        console.log("\n📊 Strategy Information:");
        const tokensLength = await strategy.tokensLength();
        console.log("- Token count:", tokensLength.toString());
        
        // 获取策略基本信息
        const shares = await ethers.getContractAt("BasketShares", await strategy.shares());
        const shareName = await shares.name();
        const shareSymbol = await shares.symbol();
        const totalSupply = await shares.totalSupply();
        
        console.log("- Strategy name:", shareName);
        console.log("- Strategy symbol:", shareSymbol);
        console.log("- Total shares:", ethers.formatEther(totalSupply));
        
        // 获取当前净值
        try {
            const basketValue = await strategy.basketUsd();
            console.log("- Current value:", ethers.formatEther(basketValue), "USDT");
        } catch (error) {
            console.log("- Current value: Not available (oracles need update)");
        }
        
        // 更新预言机示例
        console.log("\n🔮 Oracle Update Examples:");
        console.log("✅ To update oracles, run these commands:");
        console.log(`await strategy.updateOracle("${WBTC}") // WBTC`);
        console.log(`await strategy.updateOracle("${WETH}") // WETH`);
        console.log(`await strategy.updateOracle("${SOL}")  // SOL`);
        console.log(`await strategy.updateOracle("${BNB}")  // BNB`);
        
        // 存款示例
        console.log("\n💰 Deposit Example (using USDT):");
        console.log("// 1. Approve USDT");
        console.log(`const usdt = await ethers.getContractAt("IERC20", "${USDT}");`);
        console.log(`await usdt.approve("${STRATEGY_ADDRESS}", amount);`);
        console.log("");
        console.log("// 2. Prepare parameters");
        console.log("const amount = ethers.parseEther('1000'); // 1000 USDT");
        console.log("const minOuts = [0, 0, 0, 0]; // Set proper slippage protection");
        console.log("const paths = [");
        console.log(`  ["${USDT}", "${WBTC}"], // USDT -> WBTC`);
        console.log(`  ["${USDT}", "${WETH}"], // USDT -> WETH`);
        console.log(`  ["${USDT}", "${SOL}"],  // USDT -> SOL`);
        console.log(`  ["${USDT}", "${BNB}"]   // USDT -> BNB`);
        console.log("];");
        console.log("const deadline = Math.floor(Date.now()/1000) + 1800; // 30 min");
        console.log("");
        console.log("// 3. Deposit");
        console.log(`await strategy.depositSingle("${USDT}", amount, minOuts, paths, deadline);`);
        
        // 提款示例
        console.log("\n💸 Withdraw Example:");
        console.log("// Get user's shares");
        console.log("const userShares = await shares.balanceOf(userAddress);");
        console.log("// Withdraw all or partial");
        console.log("await strategy.withdraw(userShares); // Withdraw all");
        console.log("await strategy.withdraw(userShares / 2n); // Withdraw 50%");
        
        // 查询示例
        console.log("\n📊 Query Examples:");
        console.log("// Get basket value");
        console.log("const value = await strategy.basketUsd();");
        console.log("");
        console.log("// Get individual token price");
        console.log(`const wbtcPrice = await strategy.quoteTokenInUSD("${WBTC}", ethers.parseEther("1"));`);
        console.log("");
        console.log("// Get user's shares");
        console.log("const userShares = await shares.balanceOf(userAddress);");
        console.log("const userValue = (basketValue * userShares) / totalSupply;");
        
        console.log("\n🎯 Strategy Composition:");
        console.log("- WBTC: 50% (5000 basis points)");
        console.log("- WETH: 25% (2500 basis points)");
        console.log("- SOL:  15% (1500 basis points)");
        console.log("- BNB:  10% (1000 basis points)");
        console.log("- Total: 100% (10000 basis points)");
        
        console.log("\n✅ Strategy interaction guide completed!");
        
    } catch (error) {
        console.error("❌ Interaction failed:", error.message);
        throw error;
    }
}

// 辅助函数：更新所有预言机
async function updateAllOracles(strategyAddress) {
    const strategy = await ethers.getContractAt("BasketeerV4", strategyAddress);
    
    const tokens = [
        "0xC5ae99a1B0b8d307F5D33343b442ab21Ca9dD475", // WBTC
        "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3", // WETH
        "0x4175df4399Ac18A9E60148b21575ceb5eb5edc35", // SOL
        "0xf04b6BcBBcCc6Cd981D53830EF1dFeA783Ba3feB"  // BNB
    ];
    
    console.log("🔮 Updating all oracles...");
    
    for (let i = 0; i < tokens.length; i++) {
        try {
            const tx = await strategy.updateOracle(tokens[i]);
            await tx.wait();
            console.log(`✅ Updated oracle for token ${i + 1}`);
        } catch (error) {
            console.log(`⚠️  Oracle ${i + 1} not ready yet (need to wait for TWAP window)`);
        }
    }
}

// 辅助函数：简单存款示例
async function simpleDeposit(strategyAddress, usdtAmount) {
    const [user] = await ethers.getSigners();
    const strategy = await ethers.getContractAt("BasketeerV4", strategyAddress);
    const usdt = await ethers.getContractAt("IERC20", "0x8D13bbDbCea96375c25e5eDb679613AA480d5E27");
    
    // 检查余额
    const balance = await usdt.balanceOf(user.address);
    console.log("USDT balance:", ethers.formatEther(balance));
    
    if (balance < usdtAmount) {
        console.log("❌ Insufficient USDT balance");
        return;
    }
    
    // 授权
    await usdt.approve(strategyAddress, usdtAmount);
    
    // 准备参数
    const minOuts = [0, 0, 0, 0]; // 实际使用时应设置合理的滑点保护
    const paths = [
        ["0x8D13bbDbCea96375c25e5eDb679613AA480d5E27", "0xC5ae99a1B0b8d307F5D33343b442ab21Ca9dD475"], // USDT -> WBTC
        ["0x8D13bbDbCea96375c25e5eDb679613AA480d5E27", "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3"], // USDT -> WETH
        ["0x8D13bbDbCea96375c25e5eDb679613AA480d5E27", "0x4175df4399Ac18A9E60148b21575ceb5eb5edc35"], // USDT -> SOL
        ["0x8D13bbDbCea96375c25e5eDb679613AA480d5E27", "0xf04b6BcBBcCc6Cd981D53830EF1dFeA783Ba3feB"]  // USDT -> BNB
    ];
    const deadline = Math.floor(Date.now() / 1000) + 1800; // 30分钟
    
    // 存款
    const tx = await strategy.depositSingle("0x8D13bbDbCea96375c25e5eDb679613AA480d5E27", usdtAmount, minOuts, paths, deadline);
    const receipt = await tx.wait();
    
    console.log("✅ Deposit completed! Gas used:", receipt.gasUsed.toString());
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { updateAllOracles, simpleDeposit };
