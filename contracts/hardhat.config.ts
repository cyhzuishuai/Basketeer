// 导入 Hardhat 配置类型定义
import { HardhatUserConfig } from "hardhat/config";
// 导入 Hardhat 工具箱插件，包含编译、测试、部署等功能（已包含 etherscan 插件）
import "@nomicfoundation/hardhat-toolbox";
// 导入 dotenv 用于加载环境变量
import * as dotenv from 'dotenv';
// 加载 .env 文件中的环境变量
dotenv.config();


const INFURA_KEY = process.env.INFURA_KEY || '';
const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY || '';
const MNEMONIC_PATH = "m/44'/60'/0'/0";
const MNEMONIC = process.env.MNEMONIC || '';
// Hardhat 配置对象
const config: HardhatUserConfig = {
  solidity: "0.8.25", // replace if necessary
  networks: {
    'monad': {
      url: 'https://testnet-rpc.monad.xyz',
      chainId: 10143,
      accounts: [process.env.PRIVATE_KEY, process.env.PRIVATE_KEY_2]
        .filter(key => key !== undefined),
      gasPrice: "auto",
      gas: 8000000,
      timeout: 120000
    },
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org/",
    browserUrl: "https://testnet.monadexplorer.com/"
  },
  etherscan: {
    enabled: false,
  }
};

// 导出配置对象
export default config;
