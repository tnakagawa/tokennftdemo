const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("TokenDemo", function () {
  async function deployloadFixture() {
    const [deployer, user1] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("TokenDemo");
    const contract = await factory.deploy("TokenDemo", "TDT");
    await contract.waitForDeployment();

    return { contract, deployer, user1 };
  }

  describe("Deployment", function () {
    it("Deploy", async function () {
      const { contract, deployer, user1 } = await loadFixture(deployloadFixture);
      expect(await contract.name()).equal("TokenDemo");
      expect(await contract.symbol()).equal("TDT");
    });
  });
});
