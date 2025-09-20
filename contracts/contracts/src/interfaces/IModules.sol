// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOracleModule {
    function initializeUsdPair(address token, address pair, address USD) external;
    function updateOracle(address token) external;
    function updateManySoft(address[] calldata tokenList) external;
    function getPrice(address token) external view returns (uint224);
}

interface IPricingModule {
    function quoteTokenInUSD(address token, uint256 amount) external view returns (uint256);
    function calculateBasketValue(address[] memory tokens, address basketAddress) external view returns (uint256);
}

interface ITradingModule {
    function executeSwaps(
        address tokenIn,
        uint256 amountIn,
        address[] memory targetTokens,
        uint256[] memory targetWeights,
        uint256[] calldata minOuts,
        address[][] calldata paths,
        uint256 deadline,
        address recipient
    ) external;
    
    function withdrawProportional(
        address[] memory tokens,
        address from,
        address to,
        uint256 sharesBurned,
        uint256 totalShares
    ) external;
}
