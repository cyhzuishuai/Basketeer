// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC20.sol";
import "./interfaces/IModules.sol";
import "./base/BasketShares.sol";

// 极简主合约 - 只包含核心功能
contract BasketeerV4 {
    uint256 public constant BPS = 10_000;
    
    // 策略参数
    IERC20Metadata[] public tokens;
    uint256[] public targetBps;
    BasketShares public shares;
    address public immutable USD;
    
    // 模块地址
    address public immutable oracleModule;
    address public immutable pricingModule;
    address public immutable tradingModule;
    
    event DepositSingle(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 sharesOut);
    event Withdraw(address indexed user, uint256 sharesIn);
    
    constructor(
        address[] memory _tokens,
        uint256[] memory _bps,
        string memory shareName,
        string memory shareSymbol,
        address _usd18,
        address[] memory _pairs,
        address _oracleModule,
        address _pricingModule,
        address _tradingModule
    ) {
        require(_tokens.length > 0 && _tokens.length == _bps.length, "len");
        require(_tokens.length == _pairs.length, "pairs len");
        
        USD = _usd18;
        oracleModule = _oracleModule;
        pricingModule = _pricingModule;
        tradingModule = _tradingModule;
        
        uint256 sum;
        for (uint256 i; i < _tokens.length; i++) {
            tokens.push(IERC20Metadata(_tokens[i]));
            targetBps.push(_bps[i]);
            sum += _bps[i];
            
            // 初始化预言机
            IOracleModule(_oracleModule).initializeUsdPair(_tokens[i], _pairs[i], _usd18);
        }
        require(sum == BPS, "bps");
        
        shares = new BasketShares(shareName, shareSymbol);
    }
    
    function tokensLength() external view returns(uint256) {
        return tokens.length;
    }
    
    function updateOracle(address token) external {
        IOracleModule(oracleModule).updateOracle(token);
    }
    
    function basketUsd() public view returns (uint256) {
        address[] memory tokenAddresses = new address[](tokens.length);
        for (uint256 i; i < tokens.length; i++) {
            tokenAddresses[i] = address(tokens[i]);
        }
        return IPricingModule(pricingModule).calculateBasketValue(tokenAddresses, address(this));
    }
    
    function depositSingle(
        address tokenIn,
        uint256 amountIn,
        uint256[] calldata minOuts,
        address[][] calldata paths,
        uint256 deadline
    ) external {
        require(amountIn > 0, "zero");
        
        uint256 beforeUSD = basketUsd();
        
        address[] memory targetTokens = new address[](tokens.length);
        for (uint256 i; i < tokens.length; i++) {
            targetTokens[i] = address(tokens[i]);
        }
        
        IERC20(tokenIn).approve(tradingModule, amountIn);
        ITradingModule(tradingModule).executeSwaps(
            tokenIn, amountIn, targetTokens, targetBps, minOuts, paths, deadline, address(this)
        );
        
        uint256 afterUSD = basketUsd();
        uint256 realizedUSD = afterUSD - beforeUSD;
        require(realizedUSD > 0, "no value");
        
        uint256 totalShares = shares.totalSupply();
        uint256 sharesOut = (totalShares == 0)
            ? realizedUSD
            : (realizedUSD * totalShares) / beforeUSD;
        
        shares._mint(msg.sender, sharesOut);
        emit DepositSingle(msg.sender, tokenIn, amountIn, sharesOut);
    }
    
    function withdraw(uint256 sharesIn) external {
        require(sharesIn > 0, "zero");
        uint256 totalShares = shares.totalSupply();
        require(totalShares > 0, "no shares");
        
        shares._burn(msg.sender, sharesIn);
        
        address[] memory tokenAddresses = new address[](tokens.length);
        for (uint256 i; i < tokens.length; i++) {
            tokenAddresses[i] = address(tokens[i]);
            IERC20(tokenAddresses[i]).approve(tradingModule, type(uint256).max);
        }
        
        ITradingModule(tradingModule).withdrawProportional(tokenAddresses, address(this), msg.sender, sharesIn, totalShares);
        
        emit Withdraw(msg.sender, sharesIn);
    }
}
