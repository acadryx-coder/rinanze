import fs from "fs";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC);
  const network = await provider.getNetwork();
  console.log("Chain ID:", network.chainId.toString());
  if (network.chainId !== 56n) {
    throw new Error(`Wrong network! Expected BSC mainnet (56), got ${network.chainId}`);
  }

  const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC, provider);
  console.log("Deployer:", wallet.address);
  console.log("BNB:", ethers.formatEther(await provider.getBalance(wallet.address)));

  // 1. Load implementation (Rinanze)
  const implBytecode = fs.readFileSync("Rinanze_bytecode.txt", "utf8").trim();
  const implAbi = JSON.parse(fs.readFileSync("Rinanze_abi.json", "utf8"));

  // 2. Load proxy (ERC1967Proxy)
  const proxyBytecode = fs.readFileSync("ERC1967Proxy_bytecode.txt", "utf8").trim();
  const proxyAbi = JSON.parse(fs.readFileSync("ERC1967Proxy_abi.json", "utf8"));

  // 3. Set up implementation factory
  const implFactory = new ethers.ContractFactory(implAbi, implBytecode, wallet);

  // --- Gas estimate (free, no funds needed/spent) ---
  const feeData = await provider.getFeeData();
  const deployTx = await implFactory.getDeployTransaction();
  const estGas = await provider.estimateGas({ ...deployTx, from: wallet.address });
  const estCost = estGas * feeData.gasPrice;
  console.log("Estimated gas:", estGas.toString());
  console.log("Gas price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");
  console.log("Estimated cost (implementation only):", ethers.formatEther(estCost), "BNB");
  // --- end estimate ---

  // 4. Deploy implementation
  const impl = await implFactory.deploy();
  await impl.waitForDeployment();
  console.log("Implementation deployed at:", await impl.getAddress());

  // 5. Encode initialize call
  const initData = new ethers.Interface(implAbi).encodeFunctionData("initialize", ["Rinanze", "RIN"]);

  // 6. Deploy proxy with implementation + initData
  const proxyFactory = new ethers.ContractFactory(proxyAbi, proxyBytecode, wallet);
  const proxy = await proxyFactory.deploy(await impl.getAddress(), initData);
  await proxy.waitForDeployment();
  console.log("Proxy (your token) deployed at:", await proxy.getAddress());
}
main();
