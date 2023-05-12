require('babel-register');
require('@babel/polyfill');

const HDWalletProvider = require('@truffle/hdwallet-provider');

const fs = require('fs');
const path = require('path');

module.exports = {
  contracts_directory: 'contracts',
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    sepolia: {
      provider: () => {
        const privatekey = fs
          .readFileSync(`${path.dirname(__filename)}/.secret`)
          .toString();
        return new HDWalletProvider(
          privatekey,
          // "https://eth-sepolia.g.alchemy.com/v2/j4DkeuoQAmLmSMLZ1AGZeEUdY9f5b25U"
          'wss://eth-sepolia.g.alchemy.com/v2/j4DkeuoQAmLmSMLZ1AGZeEUdY9f5b25U'
        );
      },
      network_id: 11155111,
      confirmations: 3,
      websocket: true,
      timeoutBlocks: 50000,
      networkCheckTimeout: 1000000,
      skipDryRun: true,
      gas: 3000000,
    },
    ethmainnet: {
      provider: () => {
        const privatekey = fs
          .readFileSync(`${path.dirname(__filename)}/.secret`)
          .toString();
        return new HDWalletProvider(
          privatekey,
          // 'https://eth-mainnet.g.alchemy.com/v2/PqW8aEvGaHnSPER5bnehgxLhBQdiiQUK'
          'wss://eth-mainnet.g.alchemy.com/v2/PqW8aEvGaHnSPER5bnehgxLhBQdiiQUK'
        );
      },
      network_id: 1,
      confirmations: 3,
      websocket: true,
      timeoutBlocks: 50000,
      networkCheckTimeout: 1000000,
      skipDryRun: true,
      gas: 3000000,
    },
    bsctestnet: {
      provider: () => {
        const privatekey = fs
          .readFileSync(`${path.dirname(__filename)}/.secret`)
          .toString();
        return new HDWalletProvider(
          privatekey,
          // "https://data-seed-prebsc-1-s1.binance.org:8545/"
          'https://data-seed-prebsc-1-s3.binance.org:8545/'
        );
      },
      network_id: 97,
      confirmations: 10,
      timeoutBlocks: 50000,
      networkCheckTimeout: 1000000,
      skipDryRun: true,
      gas: 3000000,
      gasPrice: 10000000000,
    },
    bscmainnet: {
      provider: () => {
        const privatekey = fs
          .readFileSync(`${path.dirname(__filename)}/.secret`)
          .toString();
        return new HDWalletProvider(
          privatekey,
          'https://bsc-dataseed4.defibit.io/'
        );
      },
      network_id: 56,
      confirmations: 10,
      timeoutBlocks: 50000,
      networkCheckTimeout: 1000000,
      skipDryRun: true,
      gas: 3000000,
      gasPrice: 10000000000,
    },
  },
  compilers: {
    solc: {
      version: '0.8.18',
      parser: 'solcjs',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  plugins: ['truffle-plugin-verify'],
  api_keys: {
    etherscan: 'KCUPM62T94YYXRK6KJFK3VMHVBRASKTHVR',
    bscscan: '3J3WPPW72ACTIR9XZA3DAQXGKUMA7Z8YRI',
  },
};
