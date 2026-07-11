import fs from "fs";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC);
  const mnemonic = process.env.MNEMONIC;
  const wallet = ethers.Wallet.fromPhrase(mnemonic, provider);

  const abi = JSON.parse(fs.readFileSync("abi.json", "utf8"));
  const contractAddress = "0x869D1fbFF4cc081ca468CC6df54B1FA099931250";

  const contract = new ethers.Contract(contractAddress, abi, wallet);

  // Transfer 1,000 RIN to self to wake up the Trust Wallet UI
  const amount = ethers.parseUnits("1000", 18);
  console.log(`🚀 Transferring 1,000 RIN to self (${wallet.address})...`);

  const tx = await contract.transfer(wallet.address, amount);
  console.log("📝 Transaction sent:", tx.hash);
  
  await tx.wait();
  console.log("✅ Self-transfer completed! Trust Wallet should update now.");
}

main().catch(console.error);
