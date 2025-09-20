// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IERC20.sol";
import "../interfaces/IUniswap.sol";
import "../interfaces/IModules.sol";

contract TradingModuleV2 is ITradingModule {
    IUniswapV2Router02 public immutable router;
    uint256 public constant BPS = 10_000;
    
    constructor(address _router) {
        router = IUniswapV2Router02(_router);
    }
    
    function executeSwaps(
        address tokenIn,
        uint256 amountIn,
        address[] memory targetTokens,
        uint256[] memory targetWeights,
        uint256[] calldata minOuts,
        address[][] calldata paths,
        uint256 deadline,
        address recipient
    ) external override {
        require(targetTokens.length == targetWeights.length, "length mismatch");
        require(targetWeights.length == minOuts.length, "minOuts length");
        require(minOuts.length == paths.length, "paths length");
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        for (uint256 i; i < targetTokens.length; i++) {
            uint256 slice = amountIn * targetWeights[i] / BPS;
            if (slice == 0) continue;
            
            if (targetTokens[i] == tokenIn) {
                // 直接转账相同代币
                IERC20(tokenIn).transfer(recipient, slice);
                continue;
            }
            
            IERC20(tokenIn).approve(address(router), slice);
            
            address[] calldata path = paths[i];
            require(path.length >= 2, "path");
            require(path[0] == tokenIn, "path0");
            require(path[path.length-1] == targetTokens[i], "pathLast");
            
            router.swapExactTokensForTokens(
                slice, minOuts[i], path, recipient, deadline
            );
        }
    }
    
    function withdrawProportional(
        address[] memory tokens,
        address from,
        address to,
        uint256 sharesBurned,
        uint256 totalShares
    ) external override {
        require(totalShares > 0, "no shares");
        
        for (uint256 i; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            uint256 balance = token.balanceOf(from);
            uint256 amount = (balance * sharesBurned) / totalShares;
            if (amount > 0) {
                require(token.transferFrom(from, to, amount), "transfer failed");
            }
        }
    }
}
