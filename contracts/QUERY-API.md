# Basketeer 查询 API 接口文档

## 📋 概述

Basketeer查询系统提供完整的策略和用户数据查询功能，包括：
- 策略基本信息（总净值、单位净值、份额等）
- 用户持有信息（份额、价值、占比）
- 策略组成和健康状态
- 注册表统计信息

## 🏗️ 合约架构

```
BasketeerQuery (查询合约)
├── 策略信息查询
├── 用户持有查询  
├── 组成和健康状态
└── 统计信息

BasketeerRegistry (注册表)
├── 策略注册
├── 创建者映射
└── 策略验证
```

## 📊 核心数据结构

### StrategyInfo (策略信息)
```solidity
struct StrategyInfo {
    address strategyAddress;    // 策略合约地址
    address creator;           // 创建者地址
    string name;              // 策略名称
    string symbol;            // 策略符号
    uint256 totalShares;      // 总份额
    uint256 totalValue;       // 总净值 (USD)
    uint256 sharePrice;       // 单位净值 (USD per share)
    uint256 tokensCount;      // 代币数量
    address sharesToken;      // 份额代币地址
    bool isActive;           // 是否活跃
}
```

### HolderInfo (持有者信息)
```solidity
struct HolderInfo {
    address holder;          // 持有者地址
    uint256 shares;         // 持有份额
    uint256 value;          // 持有价值 (USD)
    uint256 percentage;     // 持有百分比 (basis points)
}
```

### TokenComposition (代币组成)
```solidity
struct TokenComposition {
    address token;          // 代币地址
    uint256 weight;        // 权重 (basis points)
    uint256 balance;       // 实际持有量
    uint256 value;         // 价值 (USD)
}
```

## 🔍 查询接口

### 1. 策略基本信息查询

#### `getStrategyInfo(address strategyAddress)`
获取单个策略的完整信息
```javascript
const strategy = await queryContract.getStrategyInfo("0x...");
console.log({
    name: strategy.name,
    totalValue: ethers.formatEther(strategy.totalValue),
    sharePrice: ethers.formatEther(strategy.sharePrice),
    totalShares: ethers.formatEther(strategy.totalShares)
});
```

#### `getAllStrategiesInfo()`
获取所有策略信息
```javascript
const strategies = await queryContract.getAllStrategiesInfo();
strategies.forEach(strategy => {
    console.log(`${strategy.name}: ${ethers.formatEther(strategy.totalValue)} USD`);
});
```

#### `getCreatorStrategiesInfo(address creator)`
获取创建者的所有策略
```javascript
const creatorStrategies = await queryContract.getCreatorStrategiesInfo("0x...");
```

### 2. 策略组成查询

#### `getStrategyComposition(address strategyAddress)`
获取策略的代币组成
```javascript
const composition = await queryContract.getStrategyComposition("0x...");
composition.forEach(token => {
    console.log({
        token: token.token,
        weight: `${Number(token.weight)/100}%`,
        balance: ethers.formatEther(token.balance),
        value: ethers.formatEther(token.value)
    });
});
```

### 3. 用户持有查询

#### `getUserHolding(address strategyAddress, address user)`
获取用户在特定策略中的持有信息
```javascript
const holding = await queryContract.getUserHolding("0x...", "0x...");
console.log({
    shares: ethers.formatEther(holding.shares),
    value: ethers.formatEther(holding.value),
    percentage: `${Number(holding.percentage)/100}%`
});
```

#### `getUserPortfolio(address user)`
获取用户的完整投资组合
```javascript
const portfolio = await queryContract.getUserPortfolio("0x...");
portfolio.forEach(holding => {
    console.log(`持有: ${ethers.formatEther(holding.value)} USD`);
});
```

### 4. 健康状态查询

#### `getStrategyHealth(address strategyAddress)`
获取策略健康状态
```javascript
const health = await queryContract.getStrategyHealth("0x...");
console.log({
    oracleActive: health.oracleActive,
    hasLiquidity: health.hasLiquidity,
    status: health.status
});
```

## 📈 JavaScript 接口类

### 安装和初始化
```javascript
const { BasketeerQueryInterface } = require('./scripts/query-interface.js');

const queryInterface = new BasketeerQueryInterface(
    "0x...", // BasketeerQuery合约地址
    "0x...", // BasketeerRegistry合约地址
    provider
);
```

### 使用示例

#### 1. 获取所有策略
```javascript
const strategies = await queryInterface.getAllStrategies();
console.log("策略列表:", strategies);
```

#### 2. 获取特定策略信息
```javascript
const info = await queryInterface.getStrategyInfo("0x...");
console.log("策略信息:", {
    name: info.name,
    totalValue: info.totalValue,
    sharePrice: info.sharePrice
});
```

#### 3. 获取用户投资组合
```javascript
const portfolio = await queryInterface.getUserPortfolio("0x...");
console.log("投资组合:", portfolio);
```

#### 4. 获取策略组成
```javascript
const composition = await queryInterface.getStrategyComposition("0x...");
console.log("策略组成:", composition);
```

## 📊 注册表查询

### Registry 直接查询
```javascript
// 获取策略总数
const count = await registry.getStrategiesCount();

// 获取所有策略地址
const strategies = await registry.getAllStrategies();

// 获取创建者的策略
const creatorStrategies = await registry.getCreatorStrategies("0x...");

// 验证是否为策略
const isValid = await registry.isStrategy("0x...");
```

## 🔧 部署查询合约

```javascript
const { deployQueryContract } = require('./scripts/query-interface.js');

// 部署查询合约
const queryAddress = await deployQueryContract("0x..."); // 注册表地址
console.log("查询合约地址:", queryAddress);
```

## 📋 完整查询示例

```javascript
async function fullQueryExample() {
    const queryInterface = new BasketeerQueryInterface(
        QUERY_ADDRESS,
        REGISTRY_ADDRESS,
        provider
    );
    
    // 1. 系统概览
    const stats = await queryInterface.getRegistryStats();
    console.log("系统统计:", stats);
    
    // 2. 所有策略
    const strategies = await queryInterface.getAllStrategies();
    console.log(`找到 ${strategies.length} 个策略`);
    
    // 3. 策略详情
    for (const strategy of strategies) {
        const composition = await queryInterface.getStrategyComposition(strategy.strategyAddress);
        const health = await queryInterface.getStrategyHealth(strategy.strategyAddress);
        
        console.log(`策略: ${strategy.name}`);
        console.log(`  总净值: ${strategy.totalValue} USD`);
        console.log(`  单位净值: ${strategy.sharePrice} USD`);
        console.log(`  健康状态: ${health.status}`);
        console.log(`  组成:`, composition);
    }
    
    // 4. 用户持有
    const userPortfolio = await queryInterface.getUserPortfolio(USER_ADDRESS);
    console.log("用户投资组合:", userPortfolio);
}
```

## 🎯 核心功能总结

| 功能 | 接口 | 返回数据 |
|------|------|----------|
| 策略基本信息 | `getStrategyInfo()` | 名称、总净值、单位净值、总份额 |
| 所有策略列表 | `getAllStrategiesInfo()` | 所有策略的基本信息数组 |
| 用户持有查询 | `getUserHolding()` | 用户份额、价值、占比 |
| 用户投资组合 | `getUserPortfolio()` | 用户在所有策略中的持有 |
| 策略组成 | `getStrategyComposition()` | 代币地址、权重、余额、价值 |
| 健康状态 | `getStrategyHealth()` | 预言机状态、流动性、更新时间 |
| 注册表统计 | `getRegistryStats()` | 策略总数、总价值、平均规模 |

这套查询系统提供了完整的 Basketeer 生态数据访问能力，支持前端应用、分析工具和第三方集成！
