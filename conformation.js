
// require("dotenv").config();
// const { ethers } = require("ethers");

// const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/PBeGbEO3r8HDl9rsXPWDd");


// // const txHash = process.env.TX_HASH;
// // const tokenAddress = process.env.TOKEN_ADDRESS.toLowerCase();
// // const watchAddress = process.env.WATCH_ADDRESS.toLowerCase();
// const tokenAddress ="0x4CCc8accD389e3E536Bf199F93826FdcaF4dfF09"
// //  process.env.TOKEN_ADDRESS.toLowerCase();
// const watchAddress = "0x88e99948953fd36abcfcfe4f7edc763a93931297"
// const expectedAmount = BigInt("3000000000000000000");

// const iface = new ethers.Interface([
//   "event Transfer(address indexed from, address indexed to, uint256 value)"
// ]);

// async function confrmation(txHash) {
//   try {
//     console.log("Checking transaction:", txHash);

//     const receipt = await provider.getTransactionReceipt(txHash);
    
//     console.log(receipt,"----->");

//     if (!receipt) {
//       console.log("Transaction not mined yet.");
//       return;
//     }

//     if (receipt.status !== 1) {
//       console.log("Transaction failed.");
//       return;
//     }

//     const currentBlock = await provider.getBlockNumber();
//     const confirmations = currentBlock - receipt.blockNumber;

//     console.log("Confirmations:", confirmations);

//     if (confirmations < 2) {
//       console.log("Waiting for confirmations...");
//       return;
//     }

//     let matched = false;

//     for (const log of receipt.logs) {
// console.log(log,"----->");
//       if (log.address.toLowerCase() !== tokenAddress) continue;

//       const parsed = iface.parseLog(log);
//       const to = parsed.args.to.toLowerCase();
//       const amount = parsed.args.value;

//       if (to === watchAddress) {
//         matched = true;

//         console.log("Token transfer found.");
//         console.log("Amount sent:", amount.toString());
//         console.log("Expected:", expectedAmount.toString());

//         if (amount >= expectedAmount) {
//           console.log("Payment amount is sufficient.");
//         } else {
//           console.log("Underpayment detected.");
//         }
//       }
//     }

//     if (!matched) {
//       console.log("No matching Transfer event found.");
//     }

//   } catch (err) {
//     console.error("Error:", err.message);
//   }
// }

// // main();
// module.exports = confrmation 


const producer = require("./helpers/producer")


async function proceed(tid,userid,coinName,chainName,fee,api_bal,to) {
    console.log("Processing confirmed transaction...");
    // Add your logic here to handle the confirmed transaction
    await producer.addJob({
      type: "CRYPTO_DEPOSITS",
      txd: tid,
      userid: userid,
      hash: hash,
      coin: coinName,
      chain: chainName,
      fee:fee,
      amount: api_bal,
      address: to,
    });
}

module .exports = proceed