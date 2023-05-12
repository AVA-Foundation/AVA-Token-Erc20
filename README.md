# AVA ERC20 Token Smart Contract

- `AVA.sol`: implementation of AVA ERC20 token
- `Migrations.sol`: helper contract for migration script

## Installation

`yarn`

**Notice**
If `pm2` tool (used to daemonize the process) is not yet installed, pls install it by running this cmd:

`npm i pm2 -g`

## Compile contract

`yarn build`

## Deploy to local Ganache

1. Start local Ganache

`yarn ganache`

2. Deploy

`yarn deploy-ganache`

## Deploy to Ethereum testnet

1.  Create the file `.secret` holding the private key

2.  Edit the param `MULTI_SIG_WALLET_ADDRESS` and `STARTING_SUPPLY_RECEIVING_WALLET` in the script `migrations/1_deploy_distribute.js`

3.  Deploy

- Foreground: `yarn deploy-sepolia`
- Background: `pm2 start script_deploy_rinkeby.sh --no-autorestart --time`

## Deploy to Ethereum mainnet

1.  Create the file `.secret` holding the private key

2.  Edit the param `MULTI_SIG_WALLET_ADDRESS` and `STARTING_SUPPLY_RECEIVING_WALLET` in the script `migrations/1_deploy_distribute.js`

3.  Deploy

- Foreground: `yarn deploy-ethmainnet`
- Background: `pm2 start script_deploy_ethmainnet.sh --no-autorestart --time`

## Unit-Test

1. Start local Ganache

`yarn ganache`

2. Run unit-test

`yarn test`
