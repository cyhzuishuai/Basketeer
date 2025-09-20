// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IUniswap.sol";
import "./UQ112x112.sol";

library V2Oracle {
    function currentCumulativePrices(IUniswapV2Pair pair) internal view returns (
        uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp
    ) {
        price0Cumulative = pair.price0CumulativeLast();
        price1Cumulative = pair.price1CumulativeLast();
        ( , , uint32 tsLast) = pair.getReserves();
        blockTimestamp = uint32(block.timestamp);

        if (tsLast != blockTimestamp) {
            (uint112 r0, uint112 r1, ) = pair.getReserves();
            uint32 timeElapsed = blockTimestamp - tsLast;
            // price0 = (reserve1 / reserve0) in UQ112x112
            price0Cumulative += uint256(UQ112x112.Q112) * uint256(r1) / uint256(r0) * timeElapsed;
            price1Cumulative += uint256(UQ112x112.Q112) * uint256(r0) / uint256(r1) * timeElapsed;
        }
    }
}
