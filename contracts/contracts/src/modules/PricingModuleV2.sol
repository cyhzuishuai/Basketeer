// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IERC20.sol";
import "../libraries/UQ112x112.sol";
import "../interfaces/IModules.sol";

contract PricingModuleV2 is IPricingModule {
    IOracleModule public immutable oracleModule;
    
    constructor(address _oracleModule) {
        oracleModule = IOracleModule(_oracleModule);
    }
    
    function quoteTokenInUSD(address token, uint256 amount) external view override returns (uint256 usdOut) {
        uint224 avgPrice = oracleModule.getPrice(token);
        require(avgPrice != 0, "oracle not ready");
        usdOut = UQ112x112.mul(avgPrice, amount);
    }
    
    function calculateBasketValue(
        address[] memory tokens, 
        address basketAddress
    ) external view override returns (uint256 totalValue) {
        for (uint256 i; i < tokens.length; i++) {
            uint256 balance = IERC20(tokens[i]).balanceOf(basketAddress);
            if (balance > 0) {
                uint224 avgPrice = oracleModule.getPrice(tokens[i]);
                if (avgPrice != 0) {
                    totalValue += UQ112x112.mul(avgPrice, balance);
                }
            }
        }
    }
}
