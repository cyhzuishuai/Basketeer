// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IUniswap.sol";
import "../libraries/V2Oracle.sol";
import "../interfaces/IModules.sol";

contract OracleModuleV2 is IOracleModule {
    uint32 public constant TWAP_WINDOW = 300; // 5 min
    
    struct UsdPairOracle {
        IUniswapV2Pair pair;
        bool tokenIs0;
        uint256 price0CumulativeLast;
        uint256 price1CumulativeLast;
        uint32 timestampLast;
        uint224 avgPriceUQ112x112;
    }
    
    mapping(address => UsdPairOracle) public oracles;
    
    event OracleUpdated(address indexed token, uint32 timeElapsed, uint224 avgPrice);
    event SetUsdPair(address indexed token, address pair, bool tokenIs0);
    
    function initializeUsdPair(address token, address pair, address USD) external override {
        require(token != address(0) && pair != address(0), "zero");
        
        IUniswapV2Pair p = IUniswapV2Pair(pair);
        address t0 = p.token0();
        address t1 = p.token1();
        require((t0 == token && t1 == USD) || (t1 == token && t0 == USD), "not token/USD");
        
        UsdPairOracle storage o = oracles[token];
        o.pair = p;
        o.tokenIs0 = (t0 == token);
        
        (uint256 p0, uint256 p1, uint32 ts) = V2Oracle.currentCumulativePrices(p);
        o.price0CumulativeLast = p0;
        o.price1CumulativeLast = p1;
        o.timestampLast = ts;
        o.avgPriceUQ112x112 = 0;
        
        emit SetUsdPair(token, pair, o.tokenIs0);
    }
    
    function updateOracle(address token) external override {
        UsdPairOracle storage o = oracles[token];
        require(address(o.pair) != address(0), "no pair");
        
        (uint256 p0Now, uint256 p1Now, uint32 tsNow) = V2Oracle.currentCumulativePrices(o.pair);
        uint32 elapsed = tsNow - o.timestampLast;
        require(elapsed >= TWAP_WINDOW, "window");
        
        uint224 avg;
        if (o.tokenIs0) {
            uint256 px = (p0Now - o.price0CumulativeLast) / elapsed;
            avg = uint224(px);
        } else {
            uint256 px = (p1Now - o.price1CumulativeLast) / elapsed;
            avg = uint224(px);
        }
        
        o.avgPriceUQ112x112 = avg;
        o.price0CumulativeLast = p0Now;
        o.price1CumulativeLast = p1Now;
        o.timestampLast = tsNow;
        
        emit OracleUpdated(token, elapsed, avg);
    }
    
    function updateManySoft(address[] calldata tokenList) external override {
        for (uint256 i; i < tokenList.length; i++) {
            UsdPairOracle storage o = oracles[tokenList[i]];
            if (address(o.pair) == address(0)) continue;
            (uint256 p0Now, uint256 p1Now, uint32 tsNow) = V2Oracle.currentCumulativePrices(o.pair);
            uint32 elapsed = tsNow - o.timestampLast;
            if (elapsed < TWAP_WINDOW) continue;
            uint224 avg = o.tokenIs0
                ? uint224((p0Now - o.price0CumulativeLast) / elapsed)
                : uint224((p1Now - o.price1CumulativeLast) / elapsed);
            o.avgPriceUQ112x112 = avg;
            o.price0CumulativeLast = p0Now;
            o.price1CumulativeLast = p1Now;
            o.timestampLast = tsNow;
            emit OracleUpdated(tokenList[i], elapsed, avg);
        }
    }
    
    function getPrice(address token) external view override returns (uint224) {
        return oracles[token].avgPriceUQ112x112;
    }
}
