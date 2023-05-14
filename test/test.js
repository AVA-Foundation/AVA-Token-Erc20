const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

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

  const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';

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
      // await time.increaseTo(
      //   startTime.add(time.duration.days(YEAR_DURATION * (i - 1)))
      // );
      if (i > 1) {
        await time.increaseTo(
          (await time.latest()).add(time.duration.days(YEAR_DURATION))
        );
      }

      currentYear = await AVATokenContract.getCurrentYear().then(
        (res) => +res.toString()
      );
      console.log('currentYear:', currentYear);
      assert.equal(currentYear, i);
    }
  });
  it('mintCurrentYear check require', async function () {
    await expectRevert(
      AVATokenContract.mintCurrentYear(ADDRESS_ZERO, 1),
      'AVA: invalid to address'
    );
    await expectRevert(
      AVATokenContract.mintCurrentYear(someAccount, 0),
      'AVA: amount must be positive'
    );
    await expectRevert(
      AVATokenContract.mintCurrentYear(someAccount, 100000000),
      'AVA: max supply exceeded'
    );
    await expectRevert(
      AVATokenContract.mintCurrentYear(someAccount, 100000000),
      'AVA: max supply exceeded'
    );
    await expectRevert(
      AVATokenContract.mintCurrentYear(someAccount, 1000000, {
        from: someAccount,
      }),
      'ERC20PresetMinterPauser: must have minter role to mint'
    );

    // Increase time to 10 years later
    await time.increaseTo(
      startTime.add(time.duration.days(YEAR_DURATION * 10))
    );
    await expectRevert(
      AVATokenContract.mintCurrentYear(someAccount, 1000000),
      'AVA: inflationary model for the current year not set'
    );
  });
  it('mintCurrentYear and check the inflationary model values', async function () {
    const amount = '1000000';
    const currentYearID = await AVATokenContract.getCurrentYear();
    expect(currentYearID).to.be.bignumber.equal(web3.utils.BN('1'));

    const { logs } = await AVATokenContract.mintCurrentYear(
      someAccount,
      amount,
      { from: deployerAccount }
    );
    expectEvent.inLogs(logs, 'EvtMintCurrentYear', {
      to: someAccount,
      amount: web3.utils.BN(amount),
      currentYearID,
    });
    expect(await AVATokenContract.balanceOf(someAccount)).to.be.bignumber.equal(
      web3.utils.toWei(amount)
    );

    const inflationaryModelCurrentYear =
      await AVATokenContract.getInflationayModelCurrentYear();

    // maxMintAmount
    expect(inflationaryModelCurrentYear['0']).to.be.bignumber.equal(
      web3.utils.BN('4469096')
    );
    // currentMintAmount
    expect(inflationaryModelCurrentYear['1']).to.be.bignumber.equal(
      web3.utils.BN(amount)
    );
    // remainingMintAmount
    expect(inflationaryModelCurrentYear['2']).to.be.bignumber.equal(
      web3.utils.BN(`${4469096 - Number(amount)}`)
    );
  });
  it('increaseMaxSupply', async function () {
    const maxSupplyIncreasingPercent = 280;
    await expectRevert(
      AVATokenContract.increaseMaxSupply(maxSupplyIncreasingPercent),
      'AVA: cannot increase max supply before 10-year period'
    );

    // Increase time to 10 years later
    await time.increaseTo(
      startTime.add(time.duration.days(YEAR_DURATION * 10))
    );

    const maxSupplyBeforeIncreaseBN = await AVATokenContract.MAX_SUPPLY();
    const maxSupplyBeforeIncrease = +maxSupplyBeforeIncreaseBN.toString();

    console.log(
      'maxSupplyBeforeIncrease:',
      web3.utils.fromWei(maxSupplyBeforeIncreaseBN)
    );

    assert.equal(maxSupplyBeforeIncrease, web3.utils.toWei('100000000'));

    await AVATokenContract.increaseMaxSupply(maxSupplyIncreasingPercent, {
      from: deployerAccount,
    });

    const maxSupplyAfterIncreaseBN = await AVATokenContract.MAX_SUPPLY();
    const maxSupplyAfterIncrease = +maxSupplyAfterIncreaseBN.toString();
    console.log(
      'maxSupplyAfterIncrease:',
      web3.utils.fromWei(maxSupplyAfterIncreaseBN)
    );
    const PERCENT_BASE = await AVATokenContract.PERCENT_BASE().then(
      (res) => +res.toString()
    );
    const totalSupplyBN = await AVATokenContract.totalSupply();
    console.log('totalSupply:', web3.utils.fromWei(totalSupplyBN));
    const totalSupply = +totalSupplyBN.toString();
    const maxSupplyIncreaseAmount =
      (maxSupplyIncreasingPercent * totalSupply) / PERCENT_BASE;

    assert.equal(
      maxSupplyAfterIncrease,
      maxSupplyBeforeIncrease + maxSupplyIncreaseAmount
    );

    await expectRevert(
      AVATokenContract.increaseMaxSupply(maxSupplyIncreasingPercent, {
        from: deployerAccount,
      }),
      'AVA: max supply can only be increased once in a year'
    );
  });
});
