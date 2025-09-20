// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./BasketeerV4.sol";

// 专门的部署者合约 - 只负责部署策略
contract BasketeerDeployer {
    address public immutable oracleModule;
    address public immutable pricingModule;
    address public immutable tradingModule;
    
    event StrategyDeployed(address indexed strategy, address indexed creator);
    
    constructor(
        address _oracleModule,
        address _pricingModule,
        address _tradingModule
    ) {
        oracleModule = _oracleModule;
        pricingModule = _pricingModule;
        tradingModule = _tradingModule;
    }
    
    function deployStrategy(
        address[] memory _tokens,
        uint256[] memory _weights,
        string memory _name,
        string memory _symbol,
        address _usdToken,
        address[] memory _pairs
    ) external returns (address strategy) {
        // 验证权重
        uint256 totalWeight;
        for (uint256 i = 0; i < _weights.length; i++) {
            totalWeight += _weights[i];
        }
        require(totalWeight == 10000, "weights must sum to 10000");
        
        // 部署策略
        BasketeerV4 newStrategy = new BasketeerV4(
            _tokens,
            _weights,
            _name,
            _symbol,
            _usdToken,
            _pairs,
            oracleModule,
            pricingModule,
            tradingModule
        );
        
        strategy = address(newStrategy);
        emit StrategyDeployed(strategy, msg.sender);
    }
}
