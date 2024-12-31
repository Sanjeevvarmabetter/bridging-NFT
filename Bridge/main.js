const { ethers } = require("ethers");
const fs = require("fs");
require('dotenv').config();

// RPC Endpoints
const polygonRpcUrl = process.env.polyRpc;
const sepoliaRpcUrl = process.env.sepoRpc;

// Private Key
const privateKey = process.env.ACCOUNT;

// Contract Addresses
const polygonContractAddress = "0xA90CeD32E40A95725C943D5392F862aEBf3C7928";
const sepoliaContractAddress = "0x064E7B51564504a95C262eD136547EF43e9973b4";

// Load ABI from JSON files
const polygonAbi = JSON.parse(fs.readFileSync('polygonAbi.json', 'utf-8'));
const sepoliaAbi = JSON.parse(fs.readFileSync('sepoliaAbi.json', 'utf-8'));

(async () => {
  try {
    const polygonProvider = new ethers.providers.JsonRpcProvider(polygonRpcUrl);
    const sepoliaProvider = new ethers.providers.JsonRpcProvider(sepoliaRpcUrl);
    const wallet = new ethers.Wallet(privateKey);

    const polygonSigner = wallet.connect(polygonProvider);
    const sepoliaSigner = wallet.connect(sepoliaProvider);

    // Contract Instances
    const polygonContract = new ethers.Contract(polygonContractAddress, polygonAbi, polygonSigner);
    const sepoliaContract = new ethers.Contract(sepoliaContractAddress, sepoliaAbi, sepoliaSigner);

    const tokenId = 1; 
    console.log(`Locking NFT with Token ID: ${tokenId} on Polygon...`);

    // Estimate gas for the lockNFT function on Polygon
    const lockEstimate = await polygonContract.estimateGas.lockNFT(tokenId);
    const lockGasPrice = await polygonProvider.getGasPrice();
    const lockGasFee = lockEstimate.mul(lockGasPrice);
    console.log(`Estimated Gas Fee for Lock on Polygon: ${ethers.utils.formatEther(lockGasFee)} MATIC`);

    // Execute lock NFT transaction on Polygon
    const lockTx = await polygonContract.lockNFT(tokenId);
    const lockReceipt = await lockTx.wait();
    const lockDuration = lockReceipt.timestamp - lockTx.timestamp;
    console.log(`NFT Locked on Polygon: Tx Hash ${lockTx.hash} | Time Taken: ${lockDuration} seconds`);

    console.log("Fetching Locked Event...");
    const lockEvents = await polygonContract.queryFilter(polygonContract.filters.Locked(null, null, null));
    if (lockEvents.length === 0) {
      console.log("No Locked Event found.");
      return;
    }

    const parsedLockEvent = lockEvents[0]; 
    const owner = parsedLockEvent.args.owner;
    const tokenURI = parsedLockEvent.args.tokenURI;

    console.log(`Owner: ${owner}, Token URI: ${tokenURI}`);

    console.log(`Minting NFT with Token ID: ${tokenId} on Sepolia...`);

    // Estimate gas for the mintBridgedNFT function on Sepolia
    const mintEstimate = await sepoliaContract.estimateGas.mintBridgedNFT(owner, tokenId, tokenURI);
    const mintGasPrice = await sepoliaProvider.getGasPrice();
    const mintGasFee = mintEstimate.mul(mintGasPrice);
    console.log(`Estimated Gas Fee for Minting on Sepolia: ${ethers.utils.formatEther(mintGasFee)} ETH`);

    // Execute minting of NFT on Sepolia
    const mintTx = await sepoliaContract.mintBridgedNFT(owner, tokenId, tokenURI);
    const mintReceipt = await mintTx.wait();
    const mintDuration = mintReceipt.timestamp - mintTx.timestamp;
    console.log(`NFT Minted on Sepolia: Tx Hash ${mintTx.hash} | Time Taken: ${mintDuration} seconds`);

  } catch (error) {
    console.error("Error during NFT transfer:", error);
  }
})();
