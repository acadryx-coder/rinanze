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

  // Existing implementation — reused, no need to redeploy
  const implAddress = "0xe53Aceb9B0689e8e145931730e552Ee83c5831df";
  const implAbi = JSON.parse(fs.readFileSync("a.json", "utf8"));

  // Verified-correct ERC1967Proxy artifact (constructor + fallback confirmed)
  const proxyAbi = JSON.parse(fs.readFileSync("ERC1967Proxy_abi.json", "utf8"));
  const proxyBytecode = fs.readFileSync("ERC1967Proxy_bytecode.txt", "utf8").trim();

  // Encode the real initialize() call — this OZ version requires non-empty
  // constructor data (ERC1967ProxyUninitialized guards against empty data).
  const initData = new ethers.Interface(implAbi).encodeFunctionData("initialize", ["Rinanze", "RIN"]);
  console.log("initData:", initData);

  const proxyFactory = new ethers.ContractFactory(proxyAbi, proxyBytecode, wallet);
  const proxy = await proxyFactory.deploy(implAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log("New proxy deployed at:", proxyAddress);

  // Immediate on-chain confirmation
  const token = new ethers.Contract(proxyAddress, implAbi, provider);
  console.log("owner:", await token.owner());
  console.log("name:", await token.name());
  console.log("symbol:", await token.symbol());
  console.log("totalSupply:", (await token.totalSupply()).toString());
}
main();
