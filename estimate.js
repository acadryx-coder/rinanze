import fs from "fs";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC);
  const network = await provider.getNetwork();
  console.log("Chain ID:", network.chainId.toString());

  const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC, provider);
  console.log("Deployer:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("Current BNB Balance:", ethers.formatEther(balance));

  // 1. Load artifacts
  const implBytecode = fs.readFileSync("Rinanze_bytecode.txt", "utf8").trim();
  const implAbi = JSON.parse(fs.readFileSync("Rinanze_abi.json", "utf8"));
  const proxyBytecode = fs.readFileSync("ERC1967Proxy_bytecode.txt", "utf8").trim();
  const proxyAbi = JSON.parse(fs.readFileSync("ERC1967Proxy_abi.json", "utf8"));

  const implFactory = new ethers.ContractFactory(implAbi, implBytecode, wallet);
  const proxyFactory = new ethers.ContractFactory(proxyAbi, proxyBytecode, wallet);

  // 2. Estimate Implementation Gas
  const implDeployTx = await implFactory.getDeployTransaction();
  const implGas = await provider.estimateGas({ ...implDeployTx, from: wallet.address });

  // 3. Estimate Proxy Gas 
  // We use a dummy address for the implementation just to simulate the proxy deployment payload size
  const dummyImplAddress = "0x0000000000000000000000000000000000000001";
  const initData = new ethers.Interface(implAbi).encodeFunctionData("initialize", ["Rinanze", "RIN"]);
  const proxyDeployTx = await proxyFactory.getDeployTransaction(dummyImplAddress, initData);
  const proxyGas = await provider.estimateGas({ ...proxyDeployTx, from: wallet.address });

  // 4. Calculate Total Costs
  const totalGas = implGas + proxyGas;
  
  // Fetch current fee data (ethers v6 syntax)
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice; 
  
  const totalCostWei = totalGas * gasPrice;
  const totalCostBNB = ethers.formatEther(totalCostWei);

  console.log("\n=========================================");
  console.log("ESTIMATION RESULTS (NO TX SENT)");
  console.log("=========================================");
  console.log(`Implementation Gas: ${implGas.toString()}`);
  console.log(`Proxy Gas:          ${proxyGas.toString()}`);
  console.log(`Total Gas Limit:    ${totalGas.toString()}`);
  console.log(`Gas Price:          ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
  console.log(`Total Est. Cost:    ${totalCostBNB} BNB`);
  console.log("=========================================\n");
  
  if (balance < totalCostWei) {
      console.log("❌ WARNING: Insufficient funds for deployment!");
  } else {
      console.log("✅ Status: Sufficient funds available. Ready to deploy.");
  }
}

main().catch(console.error);
