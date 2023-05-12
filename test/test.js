const { accounts, contract } = require('@openzeppelin/test-environment');

const {
  BN,
  constants,
  expectEvent,
  expectRevert,
  time,
} = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const AVA = contract.fromArtifact('AVA');

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

describe('AVA', function () {
  const deployerAccount = accounts[0];
  const STARTING_SUPPLY_RECEIVING_WALLET = accounts[1];
  const someAccount = accounts[2];

  const STARTING_SUPPLY = '61011389';

  const YEAR_DURATION = 365; // days

  let ADMIN_ROLE;
  let MINTER_ROLE;
  let PAUSER_ROLE;
  let AVATokenContract;

  let startTime;

  beforeEach(async function () {
    AVATokenContract = await AVA.new(STARTING_SUPPLY_RECEIVING_WALLET, {
      from: deployerAccount,
    });

    ADMIN_ROLE = await AVATokenContract.DEFAULT_ADMIN_ROLE();
    MINTER_ROLE = await AVATokenContract.MINTER_ROLE();
    PAUSER_ROLE = await AVATokenContract.PAUSER_ROLE();

    startTime = await time.latest();
  });
  it('deployed token should have expected values', async function () {
    assert.isTrue(await AVATokenContract.hasRole(ADMIN_ROLE, deployerAccount));
    assert.isTrue(await AVATokenContract.hasRole(MINTER_ROLE, deployerAccount));
    assert.isTrue(await AVATokenContract.hasRole(PAUSER_ROLE, deployerAccount));

    assert.equal(
      web3.utils.toWei(STARTING_SUPPLY),
      await AVATokenContract.balanceOf(STARTING_SUPPLY_RECEIVING_WALLET)
    );

    assert.equal(
      web3.utils.toWei(STARTING_SUPPLY),
      await AVATokenContract.totalSupply()
    );

    const inflationaryModelPerYear =
      await AVATokenContract.inflationaryModelPerYear(1);
    assert.equal(+inflationaryModelPerYear[0].toString(), 4469096);
    assert.equal(+inflationaryModelPerYear[1].toString(), 0);
    assert.equal(+inflationaryModelPerYear[2].toString(), 4469096);

    assert.equal(
      '10',
      (await AVATokenContract.inflationaryModelTotalYears()).toString()
    );
  });
  it('getCurrentYear should be correct', async function () {
    let currentYear;

    for (let i = 1; i <= 10; i++) {
      await time.increaseTo(
        startTime.add(time.duration.days(YEAR_DURATION * (i - 1)))
      );

      currentYear = await AVATokenContract.getCurrentYear().then(
        (res) => +res.toString()
      );
      console.log('currentYear:', currentYear);
      assert.equal(currentYear, i);
    }
  });
});
