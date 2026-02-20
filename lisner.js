require("dotenv").config();
const { ethers } = require("ethers");
const express = require('express')
require('dotenv').config()
require('./helpers/errorHandler')

const app = express()
// const confrmation = require("./lisners/conformation");
const mongoFunctions = require("./helpers/mongoFunctions");
const {getExactLength} = require("./helpers/controllers");
const producer = require("./helpers/producer");
const  db  = require("./helpers/dbConnect");
// const dbConnect = require('./helpers/dbConnect')

// const dbConnect = require("./helpers/dbConnect");
// dbConnect()
const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/PBeGbEO3r8HDl9rsXPWDd");

const tokenAddress ="0x4CCc8accD389e3E536Bf199F93826FdcaF4dfF09"
//  process.env.TOKEN_ADDRESS.toLowerCase();
// const watchAddress = "0x88e99948953fd36abcfcfe4f7edc763a93931297"

// process.env.WATCH_ADDRESS.toLowerCase();

const CONFIRMATIONS = 5;
const POLL_INTERVAL = 5000;

const TRANSFER_TOPIC = ethers.id(
"Transfer(address,address,uint256)"
);

const iface = new ethers.Interface([
"event Transfer(address indexed from, address indexed to, uint256 value)"
]);

async function main() {
console.log("Network: Sepolia");
console.log("Monitoring token:", tokenAddress);
// console.log("Watching address:", watchAddress);
console.log("Confirmation buffer:", CONFIRMATIONS, "blocks");

let lastScannedBlock = await provider.getBlockNumber();
console.log("Initial head block:", lastScannedBlock);

setInterval(async () => {
try {
const currentBlock = await provider.getBlockNumber();

//confirmation buffer
const safeBlock = currentBlock - CONFIRMATIONS;

if (safeBlock <= lastScannedBlock) {
return;
}

console.log(`Scanning blocks ${lastScannedBlock + 1} → ${safeBlock}`);

const logs = await provider.getLogs({
fromBlock: lastScannedBlock + 1,
toBlock: safeBlock,
address: tokenAddress,
topics: [TRANSFER_TOPIC]
});

for (const log of logs) {
    // console.log(log);
const parsed = iface.parseLog(log);
// console.log(parsed,"---->");
const to = parsed.args[1];
// console.log(to,"------>");

const getTransaction = await mongoFunctions.findOne("Transaction", { address : to ,status :"PENDING"});
// console.log(getTransaction,"----->");

if (getTransaction) {
console.log("\n=== ERC20 PAYMENT DETECTED ===");
console.log("Tx Hash:", log.transactionHash);
console.log("From:", parsed.args.from);
console.log("To:", parsed.args.to);
console.log("Amount (raw):", parsed.args.value.toString());
console.log("Block:", log.blockNumber);
// const data =await confrmation(log.transactionHash);
// console.log(data,"sdfadsf---");
const api_bal = ethers.formatUnits(parsed.args.value.toString(), 18)
// console.log(parseFloat(getExactLength(api_bal, 3,"----->")));
// console.log(parseFloat(getExactLength(getTransaction.amount, 3)),"----->");

if(parseFloat(getExactLength(api_bal, 3)) >= parseFloat(getExactLength(getTransaction.amount, 3)))  {
    console.log("Balance check passed, preparing to add to queue");
    await producer.addJob({
      type: "CRYPTO_DEPOSITS",
      txd: getTransaction.tId,
      userid: getTransaction.userId,
      hash: log.transactionHash,
      coin: getTransaction.coinName,
      chain: getTransaction.chainName,
      fee: getTransaction.fee,
      amount: api_bal,
      address: to,
    });
}
}}

lastScannedBlock = safeBlock;

} catch (err) {
console.error("Error:", err.message);
}
}, POLL_INTERVAL);
}

module.exports = main;
