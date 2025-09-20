# Basketeer V4 快速参考

## 🏗️ 简化架构图

```
                    🌐 Basketeer V4 生态系统
    ┌───────────────────────────────────────────────────────────┐
    │                                                           │
    │  👤 用户交互                                              │
    │   │                                                       │
    │   ▼                                                       │
    │  📊 BasketeerV4 (策略合约)                                  │
    │   │                                                       │
    │   ├── 🔮 OracleModuleV2    (TWAP价格)                     │
    │   ├── 💰 PricingModuleV2   (定价计算)                     │
    │   └── 🔄 TradingModuleV2   (交易执行)                     │
    │                                                           │
    │  📚 管理层                                                 │
    │   ├── BasketeerRegistry   (策略注册)                       │
    │   └── BasketeerDeployer   (策略部署)                       │
    │                                                           │
    └───────────────────────────────────────────────────────────┘
```

## 📂 核心组件

| 组件 | 功能 | 大小 | 复用性 |
|------|------|------|--------|
| 🔮 Oracle | TWAP价格管理 | ~5KB | 所有策略共享 |
| 💰 Pricing | 净值计算 | ~3KB | 所有策略共享 |
| 🔄 Trading | 交易执行 | ~4KB | 所有策略共享 |
| 📊 Strategy | 策略主逻辑 | ~8KB | 每个策略独立 |
| 📚 Registry | 策略注册表 | ~2KB | 全局唯一 |
| 🏭 Deployer | 策略工厂 | ~3KB | 全局唯一 |

## 🚀 快速部署

```bash
# 1. 部署基础设施 (一次性)
npx hardhat run scripts/deploy-ultra-minimal.js

# 2. 创建策略 (重复)
deployer.deployStrategy(tokens, weights, name, symbol, usd, pairs)

# 3. 注册策略
registry.registerStrategy(strategyAddress)
```

## 💡 核心优势

- ✅ **超小合约**: 每个组件都 < 10KB
- ✅ **极低成本**: 模块复用，策略创建便宜
- ✅ **完全去中心化**: 无管理员，无升级权限
- ✅ **高度模块化**: 功能分离，易于维护

## 🔗 调用关系

```
用户 → 策略合约 → 模块合约 → 外部协议
 │       │         │         │
 │       │         │         ├─ Uniswap V2
 │       │         │         └─ ERC20 代币
 │       │         │
 │       │         ├─ Oracle (价格)
 │       │         ├─ Pricing (计算)
 │       │         └─ Trading (交易)
 │       │
 │       ├─ 存款逻辑
 │       ├─ 提款逻辑
 │       └─ 净值查询
 │
 ├─ depositSingle()
 ├─ withdraw()
 └─ basketUsd()
```

这个V4架构是迄今为止最优化的版本，应该能完全解决合约大小限制问题！
