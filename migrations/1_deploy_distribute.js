const AVA = artifacts.require('AVA');
const fetch = require('node-fetch');
const { execSync } = require('child_process');
const web3Utils = require('web3-utils');

// Set this param for the multi-sig wallet address controlling the AVA token  contract
const MULTI_SIG_WALLET_ADDRESS = '0xA3915aa9B8D8efD2DaB04864540d25297f1ec98d';

// Set this param for the wallet receiving the starting supply
const STARTING_SUPPLY_RECEIVING_WALLET =
  '0xA3915aa9B8D8efD2DaB04864540d25297f1ec98d';

const STARTING_SUPPLY = 61011389;

const queryGasPrice = async () => {
  return new Promise((resolve, reject) => {
    fetch('https://ethgasstation.info/json/ethgasAPI.json', {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((json) => {
        const gasPriceData = Number(json.fast) / 10; // Gwei

        console.log(`Queried gas price: ${gasPriceData} Gwei`);
        resolve(Number(gasPriceData) * 10 ** 9);

        // Only for test
        // resolve(2000000000);
      })
      .catch((err) => {
        console.log(err);
        resolve(null);
      });
  });
};

const networkIdName = {
  1: 'ethmainnet',
  11155111: 'sepolia',
  97: 'bsctestnet',
  56: 'bscmainnet',
};

const verifyCmd = (contractName, contractAddr, networkName) => {
  return `npx truffle run verify ${contractName}@${contractAddr} --network ${networkName}`;
};

// Verify and publish to etherscan
const execVerifyCmd = (contractName, contractAddr, networkName) => {
  // Ganache case
  if (!networkName) {
    return;
  }

  let RETRIES = 5;

  try {
    execSync(verifyCmd(contractName, contractAddr, networkName));
  } catch (err) {
    while (RETRIES > 0) {
      RETRIES--;
      try {
        execSync(verifyCmd(contractName, contractAddr, networkName));
        return;
      } catch (err2) {}
    }

    console.log(
      `Cannot publish contractName:${contractName}, contractAddr:${contractAddr} `
    );
    console.log('Error:', err);
  }
};

module.exports = function (deployer, network, accounts) {
  deployer.then(async () => {
    const networkId = await web3.eth.net.getId();
    const networkName = networkIdName[networkId];

    if (!MULTI_SIG_WALLET_ADDRESS || MULTI_SIG_WALLET_ADDRESS === '') {
      console.error('Please specify MULTI_SIG_WALLET_ADDRESS');
      process.exit(1);
    }

    if (
      !STARTING_SUPPLY_RECEIVING_WALLET ||
      STARTING_SUPPLY_RECEIVING_WALLET === ''
    ) {
      console.error('Please specify STARTING_SUPPLY_RECEIVING_WALLET');
      process.exit(1);
    }

    const deployerAccount = accounts[0];

    const oriBalance = await web3.eth.getBalance(deployerAccount);

    console.log(`AVA deployment started at ${new Date()}`);

    console.log(
      `Deployer account: ${deployerAccount}, balance: ${web3.utils.fromWei(
        oriBalance
      )} ETH`
    );

    let opts = {
      from: deployerAccount,
      // gasPrice,
    };

    if (networkName === 'ethmainnet' || networkName === 'sepolia') {
      const gasPrice = await queryGasPrice();

      opts = {
        ...opts,
        gasPrice,
      };
    }

    // Deploy AVA
    const AVAContract = await deployer.deploy(
      AVA,
      STARTING_SUPPLY_RECEIVING_WALLET,
      opts
    );

    // Verify and publish to etherscan
    execVerifyCmd('AVA', AVAContract.address, networkName);

    const balanceAfterAvaDeploy = await web3.eth.getBalance(deployerAccount);
    let cost = Number(oriBalance) - Number(balanceAfterAvaDeploy);
    cost = web3.utils.fromWei(web3.utils.toBN(cost));
    console.log(`AVA deployment cost: ${cost} ETH`);

    // Verify total supply
    let totalSupply = await AVAContract.totalSupply();
    totalSupply = web3.utils.fromWei(totalSupply);
    if (STARTING_SUPPLY === Number(totalSupply)) {
      console.log(`Total supply: ${totalSupply} as expected`);
    } else {
      console.log(
        `Total supply: ${totalSupply} different from ${STARTING_SUPPLY}`
      );
    }

    // Verify STARTING_SUPPLY_RECEIVING_WALLET
    let bal = await AVAContract.balanceOf(STARTING_SUPPLY_RECEIVING_WALLET);
    bal = web3.utils.fromWei(bal);
    if (STARTING_SUPPLY === Number(bal)) {
      console.log(
        `STARTING_SUPPLY_RECEIVING_WALLET (${STARTING_SUPPLY_RECEIVING_WALLET}) balance (${bal}) as expected`
      );
    } else {
      console.log(
        `STARTING_SUPPLY_RECEIVING_WALLET balance different from ${STARTING_SUPPLY}`
      );
    }

    // grantRole to multi-sig and renounceRole of the current account
    try {
      // Get ADMIN_ROLE
      const adminRole = await AVAContract.DEFAULT_ADMIN_ROLE.call();
      console.log('adminRole:', adminRole);

      // Get MINTER_ROLE
      const minterRole = await AVAContract.MINTER_ROLE.call();
      console.log('minterRole:', minterRole);

      // Get PAUSER_ROLE
      const pauserRole = await AVAContract.PAUSER_ROLE.call();
      console.log('pauserRole:', pauserRole);

      // Define a role list
      const listRoles = [adminRole, minterRole, pauserRole];

      // grantRole to MULTI_SIG_WALLET_ADDRESS
      for (const role of listRoles) {
        const grantRoleTx = await AVAContract.grantRole(
          web3Utils.toHex(role),
          MULTI_SIG_WALLET_ADDRESS,
          opts
        );
        const grantRoleTxReceipt = grantRoleTx.receipt;

        console.log(`Role (${role}) granted to ${MULTI_SIG_WALLET_ADDRESS}`);
        console.log('Transaction:', grantRoleTxReceipt.transactionHash);
      }

      // renounceRole of the current deployerAccount
      for (const role of listRoles) {
        const renounceRoleTx = await AVAContract.renounceRole(
          web3Utils.toHex(role),
          deployerAccount,
          opts
        );
        const renounceRoleTxReceipt = renounceRoleTx.receipt;

        console.log(`Role (${role}) renounced from ${deployerAccount}`);
        console.log('Transaction:', renounceRoleTxReceipt.transactionHash);
      }
    } catch (error) {
      console.log(error);
    }

    ///////////////////

    console.log(`AVA deployment ended at ${new Date()}`);
  });
};
