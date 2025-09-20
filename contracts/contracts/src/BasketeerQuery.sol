// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BasketeerV4.sol";
import "./BasketeerRegistry.sol";
import "./base/BasketShares.sol";
import "./interfaces/IERC20.sol";

/**
 * @title BasketeerQuery
 * @dev 提供Basketeer生态系统的完整查询接口
 */
contract BasketeerQuery {
    BasketeerRegistry public immutable registry;
    
    struct StrategyInfo {
        address strategyAddress;
        address creator;
        string name;
        string symbol;
        uint256 totalShares;
        uint256 totalValue;      // 总净值 (USD)
        uint256 sharePrice;     // 单位净值 (USD per share)
        uint256 tokensCount;
        address sharesToken;
        bool isActive;
    }
    
    struct HolderInfo {
        address holder;
        uint256 shares;
        uint256 value;          // 持有价值 (USD)
        uint256 percentage;     // 持有百分比 (basis points)
    }
    
    struct TokenComposition {
        address token;
        uint256 weight;         // 权重 (basis points)
        uint256 balance;        // 实际持有量
        uint256 value;          // 价值 (USD)
    }
    
    constructor(address _registry) {
        registry = BasketeerRegistry(_registry);
    }
    
    /**
     * @dev 获取策略基本信息
     */
    function getStrategyInfo(address strategyAddress) external view returns (StrategyInfo memory info) {
        require(registry.isStrategy(strategyAddress), "not a strategy");
        
        BasketeerV4 strategy = BasketeerV4(strategyAddress);
        BasketShares shares = BasketShares(strategy.shares());
        
        uint256 totalShares = shares.totalSupply();
        uint256 totalValue = 0;
        uint256 sharePrice = 0;
        
        try strategy.basketUsd() returns (uint256 value) {
            totalValue = value;
            if (totalShares > 0) {
                sharePrice = (value * 1e18) / totalShares; // 18位精度的单位净值
            }
        } catch {
            // 预言机未准备好时返回0
        }
        
        info = StrategyInfo({
            strategyAddress: strategyAddress,
            creator: address(0), // 需要从注册表事件中获取
            name: shares.name(),
            symbol: shares.symbol(),
            totalShares: totalShares,
            totalValue: totalValue,
            sharePrice: sharePrice,
            tokensCount: strategy.tokensLength(),
            sharesToken: address(shares),
            isActive: totalShares > 0
        });
    }
    
    /**
     * @dev 批量获取多个策略信息
     */
    function getBatchStrategyInfo(address[] calldata strategies) external view returns (StrategyInfo[] memory infos) {
        infos = new StrategyInfo[](strategies.length);
        for (uint256 i = 0; i < strategies.length; i++) {
            if (registry.isStrategy(strategies[i])) {
                infos[i] = this.getStrategyInfo(strategies[i]);
            }
        }
    }
    
    /**
     * @dev 获取所有策略信息
     */
    function getAllStrategiesInfo() external view returns (StrategyInfo[] memory infos) {
        uint256 count = registry.getStrategiesCount();
        infos = new StrategyInfo[](count);
        
        for (uint256 i = 0; i < count; i++) {
            address strategyAddr = registry.strategies(i);
            infos[i] = this.getStrategyInfo(strategyAddr);
        }
    }
    
    /**
     * @dev 获取创建者的所有策略信息
     */
    function getCreatorStrategiesInfo(address creator) external view returns (StrategyInfo[] memory infos) {
        address[] memory strategies = registry.getCreatorStrategies(creator);
        infos = new StrategyInfo[](strategies.length);
        
        for (uint256 i = 0; i < strategies.length; i++) {
            infos[i] = this.getStrategyInfo(strategies[i]);
        }
    }
    
    /**
     * @dev 获取策略的代币组成
     */
    function getStrategyComposition(address strategyAddress) external view returns (TokenComposition[] memory composition) {
        require(registry.isStrategy(strategyAddress), "not a strategy");
        
        BasketeerV4 strategy = BasketeerV4(strategyAddress);
        uint256 tokensCount = strategy.tokensLength();
        composition = new TokenComposition[](tokensCount);
        
        BasketeerV4 basketeer = BasketeerV4(strategyAddress);
        IPricingModuleV2 pricingModule = IPricingModuleV2(basketeer.pricingModule());
        
        for (uint256 i = 0; i < tokensCount; i++) {
            address token = address(strategy.tokens(i));
            uint256 weight = strategy.targetBps(i);
            uint256 balance = IERC20(token).balanceOf(strategyAddress);
            uint256 value = 0;
            
            try pricingModule.quoteTokenInUSD(token, balance) returns (uint256 tokenValue) {
                value = tokenValue;
            } catch {
                // 预言机未准备好
            }
            
            composition[i] = TokenComposition({
                token: token,
                weight: weight,
                balance: balance,
                value: value
            });
        }
    }
    
    /**
     * @dev 获取策略的前N名持有者
     */
    function getTopHolders(address strategyAddress, uint256 limit) external view returns (HolderInfo[] memory holders) {
        require(registry.isStrategy(strategyAddress), "not a strategy");
        
        BasketeerV4 strategy = BasketeerV4(strategyAddress);
        BasketShares shares = BasketShares(strategy.shares());
        uint256 totalShares = shares.totalSupply();
        uint256 totalValue = 0;
        
        try strategy.basketUsd() returns (uint256 value) {
            totalValue = value;
        } catch {
            // 预言机未准备好
        }
        
        // 注意：这个函数需要链下支持来获取所有持有者
        // 在实际实现中，可能需要通过事件日志来构建持有者列表
        holders = new HolderInfo[](0);
    }
    
    /**
     * @dev 获取用户在策略中的持有信息
     */
    function getUserHolding(address strategyAddress, address user) external view returns (HolderInfo memory holding) {
        require(registry.isStrategy(strategyAddress), "not a strategy");
        
        BasketeerV4 strategy = BasketeerV4(strategyAddress);
        BasketShares shares = BasketShares(strategy.shares());
        
        uint256 userShares = shares.balanceOf(user);
        uint256 totalShares = shares.totalSupply();
        uint256 userValue = 0;
        uint256 percentage = 0;
        
        if (userShares > 0 && totalShares > 0) {
            try strategy.basketUsd() returns (uint256 totalValue) {
                userValue = (totalValue * userShares) / totalShares;
                percentage = (userShares * 10000) / totalShares; // basis points
            } catch {
                // 预言机未准备好
            }
        }
        
        holding = HolderInfo({
            holder: user,
            shares: userShares,
            value: userValue,
            percentage: percentage
        });
    }
    
    /**
     * @dev 获取用户在多个策略中的持有信息
     */
    function getUserHoldings(address[] calldata strategies, address user) external view returns (HolderInfo[] memory holdings) {
        holdings = new HolderInfo[](strategies.length);
        
        for (uint256 i = 0; i < strategies.length; i++) {
            if (registry.isStrategy(strategies[i])) {
                holdings[i] = this.getUserHolding(strategies[i], user);
            }
        }
    }
    
    /**
     * @dev 获取用户的完整投资组合
     */
    function getUserPortfolio(address user) external view returns (HolderInfo[] memory portfolio) {
        uint256 count = registry.getStrategiesCount();
        HolderInfo[] memory temp = new HolderInfo[](count);
        uint256 actualCount = 0;
        
        for (uint256 i = 0; i < count; i++) {
            address strategyAddr = registry.strategies(i);
            HolderInfo memory holding = this.getUserHolding(strategyAddr, user);
            
            if (holding.shares > 0) {
                temp[actualCount] = holding;
                actualCount++;
            }
        }
        
        // 创建实际大小的数组
        portfolio = new HolderInfo[](actualCount);
        for (uint256 i = 0; i < actualCount; i++) {
            portfolio[i] = temp[i];
        }
    }
    
    /**
     * @dev 计算策略的历史表现（需要链下数据支持）
     */
    function getStrategyPerformance(address strategyAddress) external view returns (
        uint256 inception,      // 创建时间（需要从事件获取）
        uint256 initialValue,   // 初始净值
        uint256 currentValue,   // 当前净值
        uint256 returnRate,     // 收益率 (basis points)
        uint256 totalDeposits,  // 总存款量（需要从事件统计）
        uint256 totalWithdraws  // 总提款量（需要从事件统计）
    ) {
        require(registry.isStrategy(strategyAddress), "not a strategy");
        
        BasketeerV4 strategy = BasketeerV4(strategyAddress);
        
        try strategy.basketUsd() returns (uint256 value) {
            currentValue = value;
        } catch {
            currentValue = 0;
        }
        
        // 其他数据需要通过链下索引获取
        inception = 0;
        initialValue = 1e18; // 假设初始净值为1
        returnRate = currentValue > initialValue ? 
            ((currentValue - initialValue) * 10000) / initialValue : 0;
        totalDeposits = 0;
        totalWithdraws = 0;
    }
    
    /**
     * @dev 检查策略健康状态
     */
    function getStrategyHealth(address strategyAddress) external view returns (
        bool oracleActive,      // 预言机是否活跃
        bool hasLiquidity,      // 是否有流动性
        uint256 lastUpdate,     // 最后更新时间
        string memory status    // 状态描述
    ) {
        require(registry.isStrategy(strategyAddress), "not a strategy");
        
        BasketeerV4 strategy = BasketeerV4(strategyAddress);
        
        try strategy.basketUsd() returns (uint256 value) {
            oracleActive = true;
            hasLiquidity = value > 0;
            status = value > 0 ? "Healthy" : "No Liquidity";
        } catch {
            oracleActive = false;
            hasLiquidity = false;
            status = "Oracle Inactive";
        }
        
        lastUpdate = block.timestamp; // 实际需要从预言机获取
    }
}
