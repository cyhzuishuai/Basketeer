# Basketeer V3 Architecture

## 🏗️ 架构概述

Basketeer V3 采用模块化架构设计，解决了合约字节码过大的问题，提供了更好的可扩展性和维护性。

### 📁 文件结构

```
contracts/src/
├── interfaces/           # 接口定义
│   ├── IERC20.sol       # ERC20接口
│   ├── IModules.sol     # 模块接口定义
│   └── IUniswap.sol     # Uniswap V2接口
├── base/                # 基础合约
│   └── BasketShares.sol # 份额代币合约
├── libraries/           # 工具库
│   ├── UQ112x112.sol    # 固定点数学库
│   └── V2Oracle.sol     # V2预言机辅助库
├── modules/             # 独立模块
│   ├── OracleModuleV2.sol  # TWAP预言机模块
│   ├── PricingModuleV2.sol # 定价计算模块
│   └── TradingModuleV2.sol # 交易执行模块
├── BasketeerV3.sol      # 主策略合约
└── BasketeerFactoryV3.sol # 工厂合约

scripts/
├── deploy-v3.js         # V3架构部署脚本
└── create-strategy-v3.js # 策略创建脚本
```

## 🔧 模块说明

### 1. 独立模块合约
- **OracleModuleV2**: 管理Uniswap V2 TWAP价格更新
- **PricingModuleV2**: 基于预言机进行代币定价和净值计算
- **TradingModuleV2**: 处理Uniswap交易和提取操作

### 2. 主合约
- **BasketeerV3**: 策略主合约，通过接口调用模块功能
- **BasketeerFactoryV3**: 工厂合约，接受预部署模块地址创建策略

### 3. 接口定义
- **IModules.sol**: 定义所有模块的标准接口

## 🚀 部署流程

### 第一步：部署模块合约
```bash
npx hardhat run scripts/deploy-v3.js --network <network>
```

这会依次部署：
1. OracleModuleV2 - 独立预言机模块
2. PricingModuleV2 - 独立定价模块
3. TradingModuleV2 - 独立交易模块
4. BasketeerFactoryV3 - 工厂合约

### 第二步：创建策略
```bash
# 编辑 create-strategy-v3.js 中的 FACTORY_ADDRESS
npx hardhat run scripts/create-strategy-v3.js --network <network>
```

## 💡 架构优势

### 1. 解决合约大小限制
- ✅ 每个模块都很小，避免24KB限制
- ✅ 主合约只包含协调逻辑
- ✅ 可以顺利部署到任何网络

### 2. 成本优化
- ✅ 模块只需部署一次，可被多个策略复用
- ✅ 策略创建成本大幅降低
- ✅ 更高效的Gas使用

### 3. 可维护性
- ✅ 模块化设计，职责分离
- ✅ 可以单独升级模块
- ✅ 代码复用性强
- ✅ 便于测试和调试

### 4. 去中心化
- ✅ 无管理员功能
- ✅ 参数在构造时固定
- ✅ 完全去中心化运行

## 📋 使用示例

### 创建策略
```javascript
const factory = await ethers.getContractAt("BasketeerFactoryV3", factoryAddress);

const strategy = await factory.createStrategy(
    tokens,      // 代币地址数组
    weights,     // 权重数组（基点）
    name,        // 策略名称
    symbol,      // 策略符号
    usdToken,    // 基准USD代币
    pairs        // Uniswap V2交易对数组
);
```

### 用户操作
```javascript
const strategy = await ethers.getContractAt("BasketeerV3", strategyAddress);

// 存款
await strategy.depositSingle(tokenIn, amount, minOuts, paths, deadline);

// 提款
await strategy.withdraw(shares);

// 查询净值
const value = await strategy.basketUsd();
```

## 🔍 技术特点

- **接口驱动**: 主合约通过接口调用模块功能
- **模块复用**: 多个策略可以共享同一套模块
- **气体优化**: 模块调用比内联代码更高效
- **升级友好**: 可以部署新版本模块而不影响现有策略

这个V3架构完美解决了合约大小问题，同时提供了更好的架构设计和用户体验！
