import { expect } from "chai";
import { ethers } from "hardhat";
import { NauticaZKVerifier } from "../typechain-types";

// Mirror the commitment hash from zk-identity.ts (SHA-256 → bytes32)
function makeCommitment(trapdoor: string, nullifier: string): string {
  return ethers.keccak256(ethers.concat([
    ethers.toUtf8Bytes(trapdoor),
    ethers.toUtf8Bytes(nullifier),
  ]));
}

describe("NauticaZKVerifier", () => {
  let verifier: NauticaZKVerifier;
  let owner: any;
  let user: any;

  const trapdoor     = "test-trapdoor-32bytes-padded000";
  const nullifier    = "test-nullifier-32bytes-padded00";
  const commitment   = makeCommitment(trapdoor, nullifier);
  const nullifierHash = ethers.keccak256(ethers.toUtf8Bytes(nullifier + "signal"));
  const signal       = ethers.keccak256(ethers.toUtf8Bytes("0xRecipient:1.0:12345"));
  const proofA       = ethers.keccak256(ethers.toUtf8Bytes("proof-a"));
  const proofB       = ethers.keccak256(ethers.toUtf8Bytes("proof-b"));
  const proofC       = ethers.keccak256(ethers.toUtf8Bytes("proof-c"));

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("NauticaZKVerifier");
    verifier = await Factory.deploy() as NauticaZKVerifier;
    await verifier.waitForDeployment();
  });

  it("adds a member commitment", async () => {
    await verifier.addMember(commitment);
    expect(await verifier.isMember(commitment)).to.be.true;
    expect(await verifier.groupSize()).to.equal(1n);
  });

  it("rejects duplicate member", async () => {
    await verifier.addMember(commitment);
    await expect(verifier.addMember(commitment)).to.be.revertedWithCustomError(verifier, "AlreadyMember");
  });

  it("verifies a valid proof and emits event", async () => {
    await verifier.addMember(commitment);
    await expect(
      verifier.verifyProof(commitment, nullifierHash, signal, proofA, proofB, proofC)
    ).to.emit(verifier, "ProofVerified").withArgs(nullifierHash, commitment, signal, owner.address, await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
  });

  it("rejects proof for non-member", async () => {
    await expect(
      verifier.verifyProof(commitment, nullifierHash, signal, proofA, proofB, proofC)
    ).to.be.revertedWithCustomError(verifier, "NotMember");
  });

  it("rejects double-spend (same nullifier twice)", async () => {
    await verifier.addMember(commitment);
    await verifier.verifyProof(commitment, nullifierHash, signal, proofA, proofB, proofC);
    await expect(
      verifier.verifyProof(commitment, nullifierHash, signal, proofA, proofB, proofC)
    ).to.be.revertedWithCustomError(verifier, "NullifierAlreadyUsed");
  });

  it("isProofValid returns false after nullifier consumed", async () => {
    await verifier.addMember(commitment);
    expect(await verifier.isProofValid(commitment, nullifierHash, proofA, proofB, proofC)).to.be.true;
    await verifier.verifyProof(commitment, nullifierHash, signal, proofA, proofB, proofC);
    expect(await verifier.isProofValid(commitment, nullifierHash, proofA, proofB, proofC)).to.be.false;
  });

  it("batch adds members", async () => {
    const c2 = ethers.keccak256(ethers.toUtf8Bytes("commitment2"));
    await verifier.addMembers([commitment, c2]);
    expect(await verifier.groupSize()).to.equal(2n);
  });
});
