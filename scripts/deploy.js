
async function main() {
  const [deplyer] = await ethers.getSigners();
  console.log(deplyer.address);

  const factory1 = await ethers.getContractFactory("TokenDemo");
  const contract1 = await factory1.deploy("TokenDemo", "TDT");
  await contract1.waitForDeployment();
  console.log("TokenDemo", contract1.target);

  const factory2 = await ethers.getContractFactory("NftDemo");
  const contract2 = await factory2.deploy("NftDemo", "NDT");
  await contract2.waitForDeployment();
  console.log("NftDemo", contract2.target);

}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });