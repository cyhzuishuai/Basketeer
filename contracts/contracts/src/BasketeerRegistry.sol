// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// 极简注册表合约 - 只负责记录策略
contract BasketeerRegistry {
    // 策略注册表
    address[] public strategies;
    mapping(address => address[]) public creatorStrategies;
    mapping(address => bool) public isStrategy;
    
    event StrategyRegistered(address indexed strategy, address indexed creator);
    
    function registerStrategy(address strategy) external {
        require(strategy != address(0), "zero address");
        require(!isStrategy[strategy], "already registered");
        
        strategies.push(strategy);
        creatorStrategies[msg.sender].push(strategy);
        isStrategy[strategy] = true;
        
        emit StrategyRegistered(strategy, msg.sender);
    }
    
    function getStrategiesCount() external view returns (uint256) {
        return strategies.length;
    }
    
    function getCreatorStrategies(address creator) external view returns (address[] memory) {
        return creatorStrategies[creator];
    }
    
    function getAllStrategies() external view returns (address[] memory) {
        return strategies;
    }
}
