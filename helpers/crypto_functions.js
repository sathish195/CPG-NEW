const { ethers } = require("ethers");



const BSC_TESTNET = {
    SCAN_LINK:
    "https://testnet.bscscan.com",
  ID: "0x61",
  symbol: "tBNB",
  decimals: 1e18,
  rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
  chainName: "Binance Smart Chain Testnet",
  blockExplorerUrls: ["https://testnet.bscscan.com"]
  };
  

const provider = new ethers.JsonRpcProvider(BSC_TESTNET.rpcUrls[0]);

async function test() {
    const blockNumber = await provider.getBlockNumber();
    console.log("Current block:", blockNumber);

    // get the block with transactions
    const block = await provider.getBlock(blockNumber, true); // true = include all txs
    
    console.log("Total transactions in block:", block.transactions.length);

    block.transactions.forEach(async(tx, i) => {
        console.log(`Tx ${i + 1}:`, tx);
        const txx = await provider.getTransaction(tx);
        console.log(`tx_details`,txx)
        
    });

    return block.transactions;
}

test();