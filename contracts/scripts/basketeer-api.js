const { ethers } = require("hardhat");

/**
 * 完整的 Basketeer API 接口
 * 提供策略创建、存取款、查询等全部功能
 */
class BasketeerAPI {
    constructor(contracts, signer, provider) {
        this.contracts = contracts;
        this.signer = signer;
        this.provider = provider;
        
        // 合约实例
        this.registry = new ethers.Contract(contracts.registry, this.getRegistryABI(), signer);
        this.deployer = new ethers.Contract(contracts.deployer, this.getDeployerABI(), signer);
        this.query = contracts.query ? new ethers.Contract(contracts.query, this.getQueryABI(), signer) : null;
        
        // 模块合约
        this.oracleModule = new ethers.Contract(contracts.modules.oracle, this.getOracleModuleABI(), signer);
        this.pricingModule = new ethers.Contract(contracts.modules.pricing, this.getPricingModuleABI(), signer);
        this.tradingModule = new ethers.Contract(contracts.modules.trading, this.getTradingModuleABI(), signer);
    }

    // ========================================
    // 1. 策略创建相关 API
    // ========================================

    /**
     * 创建新策略
     * @param {Object} config 策略配置
     * @param {string[]} config.tokens 代币地址数组
     * @param {number[]} config.weights 权重数组（总和=10000）
     * @param {string} config.name 策略名称
     * @param {string} config.symbol 策略符号
     * @param {string} config.usdToken USD稳定币地址
     * @param {string} config.router Uniswap路由地址
     * @param {Array} config.pairs 价格对地址数组
     * @returns {Object} 创建结果
     */
    async createStrategy(config) {
        try {
            console.log("🏗️ 创建策略:", config.name);
            
            // 验证配置
            this._validateStrategyConfig(config);
            
            // 1. 准备参数
            const tokens = config.tokens.map(addr => ethers.getAddress(addr));
            const weights = config.weights;
            const usdToken = ethers.getAddress(config.usdToken);
            const router = ethers.getAddress(config.router);
            const pairs = config.pairs.map(addr => ethers.getAddress(addr));
            
            // 2. 通过 Deployer 创建策略
            console.log("📦 部署策略合约...");
            const tx = await this.deployer.createStrategy(
                tokens,
                weights,
                config.name,
                config.symbol,
                this.contracts.modules.oracle,
                this.contracts.modules.pricing,
                this.contracts.modules.trading,
                usdToken,
                router,
                pairs,
                {
                    gasLimit: 8000000
                }
            );
            
            const receipt = await tx.wait();
            console.log("✅ 策略部署成功，Gas 使用:", receipt.gasUsed.toString());
            
            // 3. 从事件中获取策略地址
            const strategyCreatedEvent = receipt.logs.find(
                log => log.topics[0] === ethers.id("StrategyCreated(address,address,string,string)")
            );
            
            if (!strategyCreatedEvent) {
                throw new Error("无法找到 StrategyCreated 事件");
            }
            
            const strategyAddress = ethers.AbiCoder.defaultAbiCoder().decode(
                ['address', 'address', 'string', 'string'],
                strategyCreatedEvent.data
            )[0];
            
            console.log("📍 策略地址:", strategyAddress);
            
            // 4. 注册到 Registry
            console.log("📝 注册策略到注册表...");
            const registerTx = await this.registry.registerStrategy(
                strategyAddress,
                await this.signer.getAddress()
            );
            await registerTx.wait();
            
            console.log("✅ 策略注册成功");
            
            // 5. 获取 shares 地址
            const strategy = new ethers.Contract(strategyAddress, this.getStrategyABI(), this.signer);
            const sharesAddress = await strategy.shares();
            
            const result = {
                strategyAddress,
                sharesAddress,
                creator: await this.signer.getAddress(),
                name: config.name,
                symbol: config.symbol,
                tokens,
                weights,
                transactionHash: tx.hash,
                gasUsed: receipt.gasUsed.toString()
            };
            
            console.log("🎉 策略创建完成:", result);
            return result;
            
        } catch (error) {
            console.error("❌ 策略创建失败:", error.message);
            throw error;
        }
    }

    /**
     * 注册已部署的策略
     * @param {string} strategyAddress 策略地址
     * @param {string} creator 创建者地址
     * @returns {Object} 注册结果
     */
    async registerStrategy(strategyAddress, creator = null) {
        try {
            const creatorAddr = creator || await this.signer.getAddress();
            
            console.log("📝 注册策略:", strategyAddress);
            
            const tx = await this.registry.registerStrategy(
                ethers.getAddress(strategyAddress),
                ethers.getAddress(creatorAddr)
            );
            
            const receipt = await tx.wait();
            
            console.log("✅ 策略注册成功");
            
            return {
                strategyAddress,
                creator: creatorAddr,
                transactionHash: tx.hash,
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            console.error("❌ 策略注册失败:", error.message);
            throw error;
        }
    }

    // ========================================
    // 2. 存取款 API
    // ========================================

    /**
     * 单币存款
     * @param {string} strategyAddress 策略地址
     * @param {string} tokenIn 入金代币地址
     * @param {string} amountIn 入金数量（字符串，避免精度问题）
     * @param {Array} minOuts 最小输出数量数组
     * @param {Array} paths 交易路径数组
     * @param {number} deadline 截止时间（Unix时间戳）
     * @returns {Object} 存款结果
     */
    async depositSingle(strategyAddress, tokenIn, amountIn, minOuts, paths, deadline = null) {
        try {
            console.log("💰 单币存款:");
            console.log("  策略:", strategyAddress);
            console.log("  代币:", tokenIn);
            console.log("  数量:", ethers.formatEther(amountIn));
            
            const strategy = new ethers.Contract(strategyAddress, this.getStrategyABI(), this.signer);
            
            // 设置默认截止时间（30分钟后）
            const finalDeadline = deadline || (Math.floor(Date.now() / 1000) + 1800);
            
            // 1. 检查代币授权
            const tokenContract = new ethers.Contract(tokenIn, this.getERC20ABI(), this.signer);
            const allowance = await tokenContract.allowance(
                await this.signer.getAddress(),
                strategyAddress
            );
            
            if (allowance < BigInt(amountIn)) {
                console.log("📋 授权代币使用...");
                const approveTx = await tokenContract.approve(strategyAddress, amountIn);
                await approveTx.wait();
                console.log("✅ 代币授权成功");
            }
            
            // 2. 执行存款
            console.log("💸 执行存款交易...");
            const tx = await strategy.depositSingle(
                ethers.getAddress(tokenIn),
                amountIn,
                minOuts,
                paths,
                finalDeadline,
                {
                    gasLimit: 5000000
                }
            );
            
            const receipt = await tx.wait();
            console.log("✅ 存款成功，Gas 使用:", receipt.gasUsed.toString());
            
            // 3. 解析事件获取份额
            const depositEvent = receipt.logs.find(
                log => log.topics[0] === ethers.id("DepositSingle(address,address,uint256,uint256)")
            );
            
            let sharesReceived = "0";
            if (depositEvent) {
                const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                    ['address', 'address', 'uint256', 'uint256'],
                    depositEvent.data
                );
                sharesReceived = decoded[3].toString();
            }
            
            const result = {
                strategyAddress,
                tokenIn,
                amountIn,
                sharesReceived,
                transactionHash: tx.hash,
                gasUsed: receipt.gasUsed.toString()
            };
            
            console.log("🎉 存款完成:", result);
            return result;
            
        } catch (error) {
            console.error("❌ 存款失败:", error.message);
            throw error;
        }
    }

    /**
     * 提款（等比例取出所有代币）
     * @param {string} strategyAddress 策略地址
     * @param {string} sharesAmount 提取的份额数量
     * @returns {Object} 提款结果
     */
    async withdraw(strategyAddress, sharesAmount) {
        try {
            console.log("💸 提款:");
            console.log("  策略:", strategyAddress);
            console.log("  份额:", ethers.formatEther(sharesAmount));
            
            const strategy = new ethers.Contract(strategyAddress, this.getStrategyABI(), this.signer);
            
            // 1. 检查份额余额
            const sharesAddress = await strategy.shares();
            const sharesContract = new ethers.Contract(sharesAddress, this.getERC20ABI(), this.signer);
            const userBalance = await sharesContract.balanceOf(await this.signer.getAddress());
            
            if (userBalance < BigInt(sharesAmount)) {
                throw new Error(`份额不足：拥有 ${ethers.formatEther(userBalance)}，尝试提取 ${ethers.formatEther(sharesAmount)}`);
            }
            
            // 2. 执行提款
            console.log("💰 执行提款交易...");
            const tx = await strategy.withdraw(sharesAmount, {
                gasLimit: 3000000
            });
            
            const receipt = await tx.wait();
            console.log("✅ 提款成功，Gas 使用:", receipt.gasUsed.toString());
            
            // 3. 解析事件获取提取的代币
            const withdrawEvent = receipt.logs.find(
                log => log.topics[0] === ethers.id("Withdraw(address,uint256)")
            );
            
            const result = {
                strategyAddress,
                sharesAmount,
                transactionHash: tx.hash,
                gasUsed: receipt.gasUsed.toString()
            };
            
            console.log("🎉 提款完成:", result);
            return result;
            
        } catch (error) {
            console.error("❌ 提款失败:", error.message);
            throw error;
        }
    }

    // ========================================
    // 3. 查询 API
    // ========================================

    /**
     * 获取策略基本信息
     * @param {string} strategyAddress 策略地址
     * @returns {Object} 策略信息
     */
    async getStrategyInfo(strategyAddress) {
        try {
            const strategy = new ethers.Contract(strategyAddress, this.getStrategyABI(), this.signer);
            
            // 基本信息
            const [name, symbol, tokensLength] = await Promise.all([
                strategy.name ? strategy.name() : "Unknown",
                strategy.symbol ? strategy.symbol() : "Unknown", 
                strategy.tokensLength()
            ]);
            
            // 份额信息
            const sharesAddress = await strategy.shares();
            const sharesContract = new ethers.Contract(sharesAddress, this.getERC20ABI(), this.signer);
            const [totalShares, sharesName, sharesSymbol] = await Promise.all([
                sharesContract.totalSupply(),
                sharesContract.name(),
                sharesContract.symbol()
            ]);
            
            // 净值信息
            const totalValue = await strategy.basketUsd();
            const sharePrice = totalShares > 0 ? 
                (totalValue * BigInt(1e18)) / totalShares : 
                BigInt(1e18);
            
            // 代币列表
            const tokens = [];
            const weights = [];
            for (let i = 0; i < tokensLength; i++) {
                const token = await strategy.tokens(i);
                const weight = await strategy.targetBps(i);
                tokens.push(token);
                weights.push(weight);
            }
            
            return {
                address: strategyAddress,
                name: sharesName,
                symbol: sharesSymbol,
                totalShares: totalShares.toString(),
                totalValue: totalValue.toString(),
                sharePrice: sharePrice.toString(),
                tokensCount: tokensLength.toString(),
                sharesAddress,
                tokens,
                weights,
                isActive: await this.registry.isStrategy(strategyAddress)
            };
            
        } catch (error) {
            console.error("❌ 获取策略信息失败:", error.message);
            throw error;
        }
    }

    /**
     * 获取用户持有信息
     * @param {string} strategyAddress 策略地址
     * @param {string} userAddress 用户地址
     * @returns {Object} 持有信息
     */
    async getUserHolding(strategyAddress, userAddress = null) {
        try {
            const user = userAddress || await this.signer.getAddress();
            const strategy = new ethers.Contract(strategyAddress, this.getStrategyABI(), this.signer);
            
            // 获取用户份额
            const sharesAddress = await strategy.shares();
            const sharesContract = new ethers.Contract(sharesAddress, this.getERC20ABI(), this.signer);
            const userShares = await sharesContract.balanceOf(user);
            
            if (userShares === 0n) {
                return {
                    user,
                    shares: "0",
                    value: "0",
                    percentage: "0"
                };
            }
            
            // 计算价值和百分比
            const totalShares = await sharesContract.totalSupply();
            const totalValue = await strategy.basketUsd();
            
            const userValue = totalShares > 0 ? 
                (totalValue * userShares) / totalShares : 
                0n;
            
            const percentage = totalShares > 0 ? 
                (userShares * 10000n) / totalShares : 
                0n;
            
            return {
                user,
                shares: userShares.toString(),
                value: userValue.toString(),
                percentage: percentage.toString()
            };
            
        } catch (error) {
            console.error("❌ 获取用户持有信息失败:", error.message);
            throw error;
        }
    }

    /**
     * 获取策略组成
     * @param {string} strategyAddress 策略地址
     * @returns {Array} 代币组成数组
     */
    async getStrategyComposition(strategyAddress) {
        try {
            const strategy = new ethers.Contract(strategyAddress, this.getStrategyABI(), this.signer);
            const tokensLength = await strategy.tokensLength();
            
            const composition = [];
            
            for (let i = 0; i < tokensLength; i++) {
                const token = await strategy.tokens(i);
                const weight = await strategy.targetBps(i);
                
                // 获取余额
                const tokenContract = new ethers.Contract(token, this.getERC20ABI(), this.signer);
                const balance = await tokenContract.balanceOf(strategyAddress);
                
                // 获取价值（通过 pricing module）
                let value = 0n;
                try {
                    value = await this.pricingModule.quoteTokenInUSD(token, balance);
                } catch (e) {
                    console.warn(`无法获取代币 ${token} 的价值:`, e.message);
                }
                
                composition.push({
                    token,
                    weight: weight.toString(),
                    balance: balance.toString(),
                    value: value.toString()
                });
            }
            
            return composition;
            
        } catch (error) {
            console.error("❌ 获取策略组成失败:", error.message);
            throw error;
        }
    }

    /**
     * 获取所有策略列表
     * @returns {Array} 策略地址数组
     */
    async getAllStrategies() {
        try {
            return await this.registry.getAllStrategies();
        } catch (error) {
            console.error("❌ 获取策略列表失败:", error.message);
            throw error;
        }
    }

    /**
     * 获取创建者的策略
     * @param {string} creator 创建者地址
     * @returns {Array} 策略地址数组
     */
    async getCreatorStrategies(creator = null) {
        try {
            const creatorAddr = creator || await this.signer.getAddress();
            return await this.registry.getCreatorStrategies(creatorAddr);
        } catch (error) {
            console.error("❌ 获取创建者策略失败:", error.message);
            throw error;
        }
    }

    /**
     * 获取用户投资组合
     * @param {string} userAddress 用户地址
     * @returns {Array} 投资组合信息
     */
    async getUserPortfolio(userAddress = null) {
        try {
            const user = userAddress || await this.signer.getAddress();
            const allStrategies = await this.getAllStrategies();
            
            const portfolio = [];
            
            for (const strategyAddr of allStrategies) {
                const holding = await this.getUserHolding(strategyAddr, user);
                
                if (BigInt(holding.shares) > 0) {
                    const strategyInfo = await this.getStrategyInfo(strategyAddr);
                    portfolio.push({
                        ...holding,
                        strategyAddress: strategyAddr,
                        strategyName: strategyInfo.name,
                        strategySymbol: strategyInfo.symbol
                    });
                }
            }
            
            return portfolio;
            
        } catch (error) {
            console.error("❌ 获取用户投资组合失败:", error.message);
            throw error;
        }
    }

    // ========================================
    // 4. 预言机和价格更新 API
    // ========================================

    /**
     * 更新策略的预言机
     * @param {string} strategyAddress 策略地址
     * @param {string[]} tokens 要更新的代币地址数组（可选，默认更新所有）
     * @returns {Object} 更新结果
     */
    async updateOracles(strategyAddress, tokens = null) {
        try {
            const strategy = new ethers.Contract(strategyAddress, this.getStrategyABI(), this.signer);
            
            let tokensToUpdate = tokens;
            if (!tokensToUpdate) {
                // 获取所有代币
                const tokensLength = await strategy.tokensLength();
                tokensToUpdate = [];
                for (let i = 0; i < tokensLength; i++) {
                    tokensToUpdate.push(await strategy.tokens(i));
                }
            }
            
            console.log("🔄 更新预言机价格:", tokensToUpdate);
            
            const tx = await strategy.updateManySoft(tokensToUpdate);
            const receipt = await tx.wait();
            
            console.log("✅ 预言机更新成功");
            
            return {
                strategyAddress,
                tokens: tokensToUpdate,
                transactionHash: tx.hash,
                gasUsed: receipt.gasUsed.toString()
            };
            
        } catch (error) {
            console.error("❌ 预言机更新失败:", error.message);
            throw error;
        }
    }

    /**
     * 获取代币价格
     * @param {string} tokenAddress 代币地址
     * @param {string} amount 数量（可选，默认1个代币）
     * @returns {string} USD价格
     */
    async getTokenPrice(tokenAddress, amount = null) {
        try {
            const queryAmount = amount || ethers.parseEther("1");
            const price = await this.pricingModule.quoteTokenInUSD(tokenAddress, queryAmount);
            return price.toString();
        } catch (error) {
            console.error("❌ 获取代币价格失败:", error.message);
            throw error;
        }
    }

    // ========================================
    // 5. 工具函数
    // ========================================

    /**
     * 验证策略配置
     * @private
     */
    _validateStrategyConfig(config) {
        if (!config.tokens || !Array.isArray(config.tokens) || config.tokens.length === 0) {
            throw new Error("代币列表不能为空");
        }
        
        if (!config.weights || !Array.isArray(config.weights)) {
            throw new Error("权重列表不能为空");
        }
        
        if (config.tokens.length !== config.weights.length) {
            throw new Error("代币数量与权重数量不匹配");
        }
        
        const totalWeight = config.weights.reduce((sum, weight) => sum + weight, 0);
        if (totalWeight !== 10000) {
            throw new Error(`权重总和必须为10000，当前为${totalWeight}`);
        }
        
        if (!config.name || !config.symbol) {
            throw new Error("策略名称和符号不能为空");
        }
        
        if (!config.pairs || config.pairs.length !== config.tokens.length) {
            throw new Error("价格对数量必须与代币数量匹配");
        }
    }

    /**
     * 格式化数值显示
     * @param {string} value 原始值
     * @param {number} decimals 小数位数
     * @returns {string} 格式化后的值
     */
    formatValue(value, decimals = 18) {
        return ethers.formatUnits(value, decimals);
    }

    /**
     * 解析数值输入
     * @param {string} value 用户输入值
     * @param {number} decimals 小数位数
     * @returns {string} 解析后的值
     */
    parseValue(value, decimals = 18) {
        return ethers.parseUnits(value, decimals).toString();
    }

    // ========================================
    // ABI 定义（简化版本）
    // ========================================

    getRegistryABI() {
        return [
            "function registerStrategy(address strategy, address creator) external",
            "function getAllStrategies() external view returns (address[])",
            "function getCreatorStrategies(address creator) external view returns (address[])",
            "function isStrategy(address strategy) external view returns (bool)",
            "function getStrategiesCount() external view returns (uint256)"
        ];
    }

    getDeployerABI() {
        return [
            "function createStrategy(address[] calldata tokens, uint256[] calldata bps, string calldata name, string calldata symbol, address oracleModule, address pricingModule, address tradingModule, address usd18, address router, address[] calldata pairs) external returns (address)",
            "event StrategyCreated(address indexed strategy, address indexed creator, string name, string symbol)"
        ];
    }

    getStrategyABI() {
        return [
            "function name() external view returns (string)",
            "function symbol() external view returns (string)",
            "function shares() external view returns (address)",
            "function tokensLength() external view returns (uint256)",
            "function tokens(uint256 index) external view returns (address)",
            "function targetBps(uint256 index) external view returns (uint256)",
            "function basketUsd() external view returns (uint256)",
            "function depositSingle(address tokenIn, uint256 amountIn, uint256[] calldata minOuts, address[][] calldata paths, uint256 deadline) external",
            "function withdraw(uint256 sharesIn) external",
            "function updateOracle(address token) external",
            "function updateManySoft(address[] calldata tokens) external",
            "event DepositSingle(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 sharesOut)",
            "event Withdraw(address indexed user, uint256 sharesIn)"
        ];
    }

    getERC20ABI() {
        return [
            "function balanceOf(address owner) external view returns (uint256)",
            "function totalSupply() external view returns (uint256)",
            "function allowance(address owner, address spender) external view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function name() external view returns (string)",
            "function symbol() external view returns (string)",
            "function decimals() external view returns (uint8)"
        ];
    }

    getOracleModuleABI() {
        return [
            "function getOracleAvgPrice(address token) external view returns (uint256)"
        ];
    }

    getPricingModuleABI() {
        return [
            "function quoteTokenInUSD(address token, uint256 amount) external view returns (uint256)"
        ];
    }

    getTradingModuleABI() {
        return [
            "function swapTokens(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut, address[] calldata path) external returns (uint256)"
        ];
    }

    getQueryABI() {
        return [
            "function getStrategyInfo(address strategy) external view returns (tuple(string name, string symbol, uint256 totalValue, uint256 sharePrice, uint256 totalShares, bool isActive))",
            "function getAllStrategiesInfo() external view returns (tuple(string name, string symbol, uint256 totalValue, uint256 sharePrice, uint256 totalShares, bool isActive)[])",
            "function getStrategyComposition(address strategy) external view returns (tuple(address token, uint256 weight, uint256 balance, uint256 value)[])",
            "function getUserHolding(address strategy, address user) external view returns (tuple(uint256 shares, uint256 value, uint256 percentage))",
            "function getUserPortfolio(address user) external view returns (tuple(address strategy, uint256 shares, uint256 value)[])"
        ];
    }
}

module.exports = { BasketeerAPI };
