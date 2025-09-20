# Basketeer 完整 API 文档

## 📋 概述

这是 Basketeer 平台的完整 API 文档，提供策略创建、存取款、查询等全部功能。API 基于 JavaScript/Node.js 环境，使用 ethers.js 与智能合约交互。

## 🏗️ 系统架构

```
Basketeer 生态系统
├── 核心模块
│   ├── OracleModule (价格预言机)
│   ├── PricingModule (定价模块)  
│   └── TradingModule (交易模块)
├── 管理合约
│   ├── BasketeerRegistry (注册表)
│   ├── BasketeerDeployer (部署器)
│   └── BasketeerQuery (查询器)
└── 策略合约
    ├── BasketeerV4 (主策略)
    └── BasketShares (份额代币)
```

## 🚀 快速开始

### 安装和初始化

```javascript
const { BasketeerAPI } = require('./scripts/basketeer-api.js');
const { ethers } = require("hardhat");

// 合约地址配置 (Monad 测试网)
const contracts = {
    registry: "0x771069BC8C34C30b1F39a3C59193056dFF6bF63f",
    deployer: "0x60ee57163bc08A83aB381D79819927f82F8dD31a",
    modules: {
        oracle: "0x8753c059Ff1A069EDBB6c49644f29D20C19C14C9",
        pricing: "0x4036A4F9c96F012a2f7e02DEA50c16fFb97acb85",
        trading: "0xfA9FF78023050D8066167024CE492A0C8bf20dbA"
    }
};

// 初始化 API
const [signer] = await ethers.getSigners();
const api = new BasketeerAPI(contracts, signer, ethers.provider);
```

## 📊 核心 API 接口

### 1. 策略管理 API

#### 1.1 创建策略 `createStrategy(config)`

创建一个新的投资策略。

**参数:**
```javascript
const config = {
    tokens: ["0x...", "0x..."],      // 代币地址数组
    weights: [6000, 4000],           // 权重数组 (总和=10000)
    name: "我的策略",                 // 策略名称
    symbol: "MYSTRAT",               // 策略符号
    usdToken: "0x...",               // USD稳定币地址
    router: "0x...",                 // Uniswap路由地址
    pairs: ["0x...", "0x..."]        // 价格对地址数组
};
```

**返回值:**
```javascript
{
    strategyAddress: "0x...",        // 新策略地址
    sharesAddress: "0x...",          // 份额代币地址
    creator: "0x...",                // 创建者地址
    name: "我的策略",                // 策略名称
    symbol: "MYSTRAT",               // 策略符号
    tokens: ["0x...", "0x..."],      // 代币列表
    weights: [6000, 4000],           // 权重列表
    transactionHash: "0x...",        // 交易哈希
    gasUsed: "1234567"               // 消耗的Gas
}
```

**使用示例:**
```javascript
const strategyConfig = {
    tokens: [
        "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3", // WETH
        "0xC5ae99a1B0b8d307F5D33343b442ab21Ca9dD475"  // WBTC
    ],
    weights: [6000, 4000], // 60% ETH, 40% BTC
    name: "ETH-BTC Index",
    symbol: "ETHBTC",
    usdToken: "0x8D13bbDbCea96375c25e5eDb679613AA480d5E27", // USDT
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    pairs: [
        "0x...", // WETH-USDT pair
        "0x..."  // WBTC-USDT pair
    ]
};

const result = await api.createStrategy(strategyConfig);
console.log("策略创建成功:", result.strategyAddress);
```

#### 1.2 注册策略 `registerStrategy(strategyAddress, creator)`

将已部署的策略注册到注册表。

**参数:**
- `strategyAddress` (string): 策略合约地址
- `creator` (string, 可选): 创建者地址，默认为当前签名者

**使用示例:**
```javascript
const result = await api.registerStrategy("0x...");
console.log("策略注册成功:", result);
```

#### 1.3 获取所有策略 `getAllStrategies()`

获取系统中所有已注册的策略地址。

```javascript
const strategies = await api.getAllStrategies();
console.log(`找到 ${strategies.length} 个策略:`, strategies);
```

#### 1.4 获取创建者策略 `getCreatorStrategies(creator)`

获取特定创建者的所有策略。

```javascript
const myStrategies = await api.getCreatorStrategies("0x...");
console.log("我创建的策略:", myStrategies);
```

### 2. 存取款 API

#### 2.1 单币存款 `depositSingle(strategyAddress, tokenIn, amountIn, minOuts, paths, deadline)`

使用单一代币投资策略，系统会自动按权重分配到各个成分代币。

**参数:**
- `strategyAddress` (string): 策略地址
- `tokenIn` (string): 入金代币地址
- `amountIn` (string): 入金数量（字符串格式，避免精度问题）
- `minOuts` (Array): 最小输出数量数组（滑点保护）
- `paths` (Array): 交易路径数组
- `deadline` (number, 可选): 截止时间，默认30分钟后

**使用示例:**
```javascript
// 用 100 USDT 投资策略
const depositAmount = ethers.parseEther("100").toString();

// 计算最小输出（需要前端计算滑点）
const minOuts = [
    ethers.parseEther("0").toString(), // 最小WETH输出
    ethers.parseEther("0").toString()  // 最小WBTC输出
];

// 交易路径
const paths = [
    ["0x8D13bbDbCea96375c25e5eDb679613AA480d5E27", "0x94bbb7DaA0B9935319B76df08E0954F64BF619d3"], // USDT -> WETH
    ["0x8D13bbDbCea96375c25e5eDb679613AA480d5E27", "0xC5ae99a1B0b8d307F5D33343b442ab21Ca9dD475"]  // USDT -> WBTC
];

const result = await api.depositSingle(
    "0x...", // 策略地址
    "0x8D13bbDbCea96375c25e5eDb679613AA480d5E27", // USDT
    depositAmount,
    minOuts,
    paths
);

console.log("存款成功:", result);
console.log("获得份额:", api.formatValue(result.sharesReceived));
```

#### 2.2 提款 `withdraw(strategyAddress, sharesAmount)`

提取投资，会按比例返回所有成分代币。

**参数:**
- `strategyAddress` (string): 策略地址
- `sharesAmount` (string): 要提取的份额数量

**使用示例:**
```javascript
// 提取 50 份额
const withdrawShares = ethers.parseEther("50").toString();

const result = await api.withdraw("0x...", withdrawShares);
console.log("提款成功:", result);
```

### 3. 查询 API

#### 3.1 获取策略信息 `getStrategyInfo(strategyAddress)`

获取策略的完整信息。

```javascript
const info = await api.getStrategyInfo("0x...");
console.log("策略信息:", {
    name: info.name,
    symbol: info.symbol,
    totalValue: api.formatValue(info.totalValue) + " USDT",
    sharePrice: api.formatValue(info.sharePrice) + " USDT/份额",
    totalShares: api.formatValue(info.totalShares),
    tokensCount: info.tokensCount,
    isActive: info.isActive
});
```

#### 3.2 获取用户持有 `getUserHolding(strategyAddress, userAddress)`

查询用户在特定策略中的持有情况。

```javascript
const holding = await api.getUserHolding("0x...", "0x...");
console.log("用户持有:", {
    shares: api.formatValue(holding.shares),
    value: api.formatValue(holding.value) + " USDT",
    percentage: (Number(holding.percentage) / 100) + "%"
});
```

#### 3.3 获取用户投资组合 `getUserPortfolio(userAddress)`

获取用户的完整投资组合。

```javascript
const portfolio = await api.getUserPortfolio("0x...");
let totalValue = 0;

portfolio.forEach((holding, index) => {
    const value = Number(api.formatValue(holding.value));
    totalValue += value;
    
    console.log(`${index + 1}. ${holding.strategyName}:`);
    console.log(`   份额: ${api.formatValue(holding.shares)}`);
    console.log(`   价值: ${value.toFixed(2)} USDT`);
});

console.log(`总投资价值: ${totalValue.toFixed(2)} USDT`);
```

#### 3.4 获取策略组成 `getStrategyComposition(strategyAddress)`

查询策略的代币组成和实际持有情况。

```javascript
const composition = await api.getStrategyComposition("0x...");

composition.forEach((token, index) => {
    console.log(`代币 ${index + 1}:`);
    console.log(`  地址: ${token.token}`);
    console.log(`  权重: ${Number(token.weight) / 100}%`);
    console.log(`  余额: ${api.formatValue(token.balance)}`);
    console.log(`  价值: ${api.formatValue(token.value)} USDT`);
});
```

### 4. 预言机和价格 API

#### 4.1 更新预言机 `updateOracles(strategyAddress, tokens)`

更新策略的价格预言机数据。

**注意:** 需要等待至少5分钟的TWAP窗口期。

```javascript
// 更新所有代币的预言机
const result = await api.updateOracles("0x...");
console.log("预言机更新成功:", result);

// 更新特定代币的预言机
const specificTokens = ["0x...", "0x..."];
const result2 = await api.updateOracles("0x...", specificTokens);
```

#### 4.2 获取代币价格 `getTokenPrice(tokenAddress, amount)`

查询代币的USD价格。

```javascript
// 获取1个WETH的价格
const ethPrice = await api.getTokenPrice("0x...");
console.log("WETH价格:", api.formatValue(ethPrice), "USDT");

// 获取指定数量的价格
const amount = ethers.parseEther("10").toString();
const totalPrice = await api.getTokenPrice("0x...", amount);
console.log("10 WETH价格:", api.formatValue(totalPrice), "USDT");
```

## 🛠️ 工具方法

### 数值格式化

```javascript
// 格式化显示（Wei -> 人类可读）
const formatted = api.formatValue("1000000000000000000"); // "1.0"

// 解析输入（人类可读 -> Wei）
const parsed = api.parseValue("100.5"); // "100500000000000000000"
```

## 🔄 完整使用流程

### 1. 创建并投资策略

```javascript
async function createAndInvestStrategy() {
    // 1. 创建策略
    const strategyConfig = {
        tokens: ["0x...", "0x..."],
        weights: [7000, 3000],
        name: "我的DeFi指数",
        symbol: "MYDEFI",
        usdToken: "0x...",
        router: "0x...",
        pairs: ["0x...", "0x..."]
    };
    
    const strategy = await api.createStrategy(strategyConfig);
    console.log("策略创建成功:", strategy.strategyAddress);
    
    // 2. 等待TWAP窗口期（5分钟）
    console.log("等待TWAP窗口期...");
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    
    // 3. 更新预言机
    await api.updateOracles(strategy.strategyAddress);
    console.log("预言机更新完成");
    
    // 4. 投资策略
    const depositAmount = api.parseValue("1000"); // 1000 USDT
    const minOuts = [api.parseValue("0"), api.parseValue("0")];
    const paths = [
        ["0x...", "0x..."], // USDT -> Token1
        ["0x...", "0x..."]  // USDT -> Token2
    ];
    
    const deposit = await api.depositSingle(
        strategy.strategyAddress,
        "0x...", // USDT地址
        depositAmount,
        minOuts,
        paths
    );
    
    console.log("投资成功，获得份额:", api.formatValue(deposit.sharesReceived));
    
    return strategy.strategyAddress;
}
```

### 2. 监控投资组合

```javascript
async function monitorPortfolio(userAddress) {
    // 获取用户投资组合
    const portfolio = await api.getUserPortfolio(userAddress);
    
    console.log(`用户投资组合 (${portfolio.length} 个策略):`);
    
    for (const holding of portfolio) {
        console.log(`\n策略: ${holding.strategyName}`);
        
        // 获取详细信息
        const info = await api.getStrategyInfo(holding.strategyAddress);
        const composition = await api.getStrategyComposition(holding.strategyAddress);
        
        console.log(`  总净值: ${api.formatValue(info.totalValue)} USDT`);
        console.log(`  单位净值: ${api.formatValue(info.sharePrice)} USDT/份额`);
        console.log(`  我的份额: ${api.formatValue(holding.shares)}`);
        console.log(`  我的价值: ${api.formatValue(holding.value)} USDT`);
        
        console.log("  组成:");
        composition.forEach((token, index) => {
            console.log(`    ${index + 1}. 权重: ${Number(token.weight)/100}%, 价值: ${api.formatValue(token.value)} USDT`);
        });
    }
}
```

## 📋 错误处理

```javascript
try {
    const result = await api.createStrategy(config);
    console.log("成功:", result);
} catch (error) {
    if (error.message.includes("权重总和")) {
        console.error("配置错误: 权重总和必须为10000");
    } else if (error.message.includes("insufficient funds")) {
        console.error("余额不足");
    } else if (error.message.includes("slippage")) {
        console.error("滑点过大，请调整minOuts参数");
    } else {
        console.error("操作失败:", error.message);
    }
}
```

## 🔐 安全注意事项

1. **权限控制:** 确保只有授权用户可以创建策略
2. **滑点保护:** 存款时必须设置合理的`minOuts`参数
3. **预言机更新:** 定期更新TWAP价格，确保估值准确性
4. **流动性检查:** 投资前确认交易对有足够流动性
5. **Gas费用:** 大型策略操作可能消耗较多Gas

## 📊 性能优化

1. **批量查询:** 使用查询合约减少RPC调用
2. **缓存机制:** 缓存不经常变化的数据
3. **并行处理:** 同时处理多个独立操作
4. **事件监听:** 监听合约事件获取实时更新

## 🎯 最佳实践

1. **策略设计:**
   - 选择流动性好的代币
   - 合理分配权重（不要过于集中）
   - 定期评估和调整

2. **风险管理:**
   - 分散投资多个策略
   - 设置止损机制
   - 定期提取收益

3. **用户体验:**
   - 提供清晰的费用说明
   - 实时显示投资收益
   - 简化操作流程

## 📞 支持和文档

- **合约地址:** 参考 `MONAD_CONTRACTS` 配置
- **测试网络:** Monad Testnet
- **区块浏览器:** https://testnet.monadexplorer.com/
- **API示例:** 参考 `api-example.js` 文件

---

这份完整的API文档涵盖了Basketeer平台的所有核心功能，从策略创建到存取款，再到复杂的查询和监控。通过这些API，开发者可以构建功能丰富的DeFi投资应用！
