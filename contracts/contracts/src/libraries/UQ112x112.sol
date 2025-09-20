// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library UQ112x112 {
    uint224 constant Q112 = 2**112;
    
    // 为避免溢出，按 Uniswap 官方做法限制 y <= 2^144-1
    function mul(uint224 x, uint256 y) internal pure returns (uint256) {
        require(y <= type(uint144).max, "amount too big");
        return (uint256(x) * y) >> 112; // floor(x * y / Q112)
    }
}
