import fs from "fs";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC);
  const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC, provider);

  const abi = JSON.parse(fs.readFileSync("abi.json", "utf8"));
  const contractAddress = "0x59638355a0D27D5C67133F5807858957Bbec3edA"; // your deployed contract
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  // Replace with your Trust Wallet burner address on Sepolia
  const targetAddress = "0xd23d0b12509021E38b76fDB2d7dc6D35EFb11154";

  // 1,000,000 USDT (6 decimals)
  const amount = ethers.parseUnits("1000000", 6);

  console.log(`⚡ Flashing ${ethers.formatUnits(amount, 6)} fake USDT to ${targetAddress}...`);
  const tx = await contract.triggerFlash(targetAddress, amount);
  await tx.wait();

  console.log("✅ Done. Check Trust Wallet on Sepolia now.");
}

main().catch(console.error);
