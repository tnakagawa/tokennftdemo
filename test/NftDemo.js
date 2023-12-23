const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("NftDemo", function () {
  async function deployloadFixture() {
    const [deployer, user1] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("NftDemo");
    const contract = await factory.deploy("NftDemo", "NDT");
    await contract.waitForDeployment();

    return { contract, deployer, user1 };
  }

  describe("Deployment", function () {
    it("Deploy", async function () {
      const { contract, deployer, user1 } = await loadFixture(deployloadFixture);
      expect(await contract.name()).equal("NftDemo");
      expect(await contract.symbol()).equal("NDT");
    });
  });
});
