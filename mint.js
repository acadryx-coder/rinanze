import fs from "fs";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC);
  const mnemonic = process.env.MNEMONIC;
  const wallet = ethers.Wallet.fromPhrase(mnemonic, provider);

  const abi = JSON.parse(fs.readFileSync("abi.json", "utf8"));
  const contractAddress = "0x8Defd97E9dF021df93383d22895286871e15BBc6";
  const contract = new ethers.Contract(contractAddress, abi, wallet);

  const amount = ethers.parseUnits("1000000", 18);
  console.log("🚀 Minting 1,000,000 RIN to", wallet.address);
  const tx = await contract.mint(wallet.address, amount);
  await tx.wait();
  console.log("✅ Done. Tx hash:", tx.hash);
}

main().catch(console.error);
