import { expect } from "chai";
import { ethers } from "hardhat";
import { NauticaNFT } from "../typechain-types";

describe("NauticaNFT", () => {
  let nft: NauticaNFT;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("NauticaNFT");
    nft = await Factory.deploy("Nautica", "NAUT", 0n, 500n) as NauticaNFT;
    await nft.waitForDeployment();
  });

  it("mints with correct tokenURI", async () => {
    const uri = "ipfs://QmTest123";
    await nft.mint(user.address, uri);
    expect(await nft.tokenURI(1)).to.equal(uri);
    expect(await nft.ownerOf(1)).to.equal(user.address);
  });

  it("increments totalSupply", async () => {
    await nft.mint(user.address, "ipfs://a");
    await nft.mint(user.address, "ipfs://b");
    expect(await nft.totalSupply()).to.equal(2n);
  });

  it("rejects mint when paused", async () => {
    await nft.setMintingPaused(true);
    await expect(nft.mint(user.address, "ipfs://x")).to.be.revertedWithCustomError(nft, "MintingIsPaused");
  });

  it("rejects mint with insufficient fee", async () => {
    const fee = ethers.parseEther("0.01");
    await nft.setMintFee(fee);
    await expect(
      nft.connect(user).mint(user.address, "ipfs://y", { value: 0n })
    ).to.be.revertedWithCustomError(nft, "InsufficientFee");
  });

  it("accepts mint with correct fee", async () => {
    const fee = ethers.parseEther("0.01");
    await nft.setMintFee(fee);
    await nft.connect(user).mint(user.address, "ipfs://z", { value: fee });
    expect(await nft.totalSupply()).to.equal(1n);
  });

  it("returns royalty info", async () => {
    await nft.mint(user.address, "ipfs://r");
    const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther("1"));
    expect(receiver).to.equal(owner.address);
    expect(amount).to.equal(ethers.parseEther("0.05")); // 5%
  });

  it("batch mints", async () => {
    await nft.batchMint(user.address, ["ipfs://1", "ipfs://2", "ipfs://3"]);
    expect(await nft.totalSupply()).to.equal(3n);
    expect(await nft.ownerOf(1)).to.equal(user.address);
    expect(await nft.ownerOf(3)).to.equal(user.address);
  });
});
