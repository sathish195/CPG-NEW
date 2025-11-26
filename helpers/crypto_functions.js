const { ethers } = require("ethers");
const mongoFunctions = require("./mongoFunctions");
const producer = require('./producer')
const redis = require('./redis')


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
  

  const tokenAbi = [
        
    {
        "inputs": [
                {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                },
                {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                }
        ],
        "name": "approve",
        "outputs": [
                {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "initialOwner",
                        "type": "address"
                }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                },
                {
                        "internalType": "uint256",
                        "name": "allowance",
                        "type": "uint256"
                },
                {
                        "internalType": "uint256",
                        "name": "needed",
                        "type": "uint256"
                }
        ],
        "name": "ERC20InsufficientAllowance",
        "type": "error"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                },
                {
                        "internalType": "uint256",
                        "name": "balance",
                        "type": "uint256"
                },
                {
                        "internalType": "uint256",
                        "name": "needed",
                        "type": "uint256"
                }
        ],
        "name": "ERC20InsufficientBalance",
        "type": "error"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "approver",
                        "type": "address"
                }
        ],
        "name": "ERC20InvalidApprover",
        "type": "error"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "receiver",
                        "type": "address"
                }
        ],
        "name": "ERC20InvalidReceiver",
        "type": "error"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "sender",
                        "type": "address"
                }
        ],
        "name": "ERC20InvalidSender",
        "type": "error"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                }
        ],
        "name": "ERC20InvalidSpender",
        "type": "error"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                },
                {
                        "internalType": "uint256",
                        "name": "amount",
                        "type": "uint256"
                }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
},
{
        "anonymous": false,
        "inputs": [
                {
                        "indexed": true,
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                },
                {
                        "indexed": true,
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                },
                {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                }
        ],
        "name": "Approval",
        "type": "event"
},
{
        "anonymous": false,
        "inputs": [
                {
                        "indexed": true,
                        "internalType": "address",
                        "name": "previousOwner",
                        "type": "address"
                },
                {
                        "indexed": true,
                        "internalType": "address",
                        "name": "newOwner",
                        "type": "address"
                }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
},
{
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                },
                {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                }
        ],
        "name": "transfer",
        "outputs": [
                {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
},
{
        "anonymous": false,
        "inputs": [
                {
                        "indexed": true,
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                },
                {
                        "indexed": true,
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                },
                {
                        "indexed": false,
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                }
        ],
        "name": "Transfer",
        "type": "event"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "from",
                        "type": "address"
                },
                {
                        "internalType": "address",
                        "name": "to",
                        "type": "address"
                },
                {
                        "internalType": "uint256",
                        "name": "value",
                        "type": "uint256"
                }
        ],
        "name": "transferFrom",
        "outputs": [
                {
                        "internalType": "bool",
                        "name": "",
                        "type": "bool"
                }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "newOwner",
                        "type": "address"
                }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "owner",
                        "type": "address"
                },
                {
                        "internalType": "address",
                        "name": "spender",
                        "type": "address"
                }
        ],
        "name": "allowance",
        "outputs": [
                {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                }
        ],
        "stateMutability": "view",
        "type": "function"
},
{
        "inputs": [
                {
                        "internalType": "address",
                        "name": "account",
                        "type": "address"
                }
        ],
        "name": "balanceOf",
        "outputs": [
                {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                }
        ],
        "stateMutability": "view",
        "type": "function"
},
{
        "inputs": [],
        "name": "decimals",
        "outputs": [
                {
                        "internalType": "uint8",
                        "name": "",
                        "type": "uint8"
                }
        ],
        "stateMutability": "view",
        "type": "function"
},
{
        "inputs": [],
        "name": "name",
        "outputs": [
                {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                }
        ],
        "stateMutability": "view",
        "type": "function"
},
{
        "inputs": [],
        "name": "owner",
        "outputs": [
                {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                }
        ],
        "stateMutability": "view",
        "type": "function"
},
{
        "inputs": [],
        "name": "symbol",
        "outputs": [
                {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                }
        ],
        "stateMutability": "view",
        "type": "function"
},
{
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
                {
                        "internalType": "uint256",
                        "name": "",
                        "type": "uint256"
                }
        ],
        "stateMutability": "view",
        "type": "function"
}
];
const provider = new ethers.JsonRpcProvider(BSC_TESTNET.rpcUrls[0]);

// / Create an Interface object for decoding the data
const iface = new ethers.Interface(tokenAbi);

// async function getTransactionsInBlockRange(startBlock, endBlock, pendingHistory) {
//         const transactions = [];
      
//         try {
//           for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
//             const block = await provider.getBlock(blockNumber);
//             if (!block || !block.transactions) continue;
      
//             for (const txHash of block.transactions) {
//               const tx = await provider.getTransaction(txHash);
//               if (!tx || !tx.to) continue;
      
//               // Only consider transactions to the monitored contract
//                 try {
//                   if (tx.data.startsWith("0xa9059cbb")) {
//                     const decoded = iface.decodeFunctionData("transfer", tx.data);
//                     const recipient = decoded[0];
//                     const amount = decoded[1];
//                     const formattedAmount = ethers.formatUnits(amount, 18);
      
//                     const txReceipt = await provider.getTransactionReceipt(tx.hash);
//                     const success = txReceipt.status === 1;
      
//                     console.log(`TxHash: ${tx.hash} | Recipient: ${recipient} | Amount: ${formattedAmount} | Status: ${success ? "SUCCESS" : "FAILED"}`);
      
//                     // Match pending transactions
//                 //     const matchedPending = pendingHistory.find(p => p.addres.toLowerCase() === recipient.toLowerCase() );
//                     const matchedPending = pendingHistory.find(
//                         p => p.address.toLowerCase() === recipient.toLowerCase() && success
//                       );
                      
//                     if (matchedPending) {
//                       console.log("Matched pending transaction for address:", recipient);
//                       await producer.addJob({
//                         type: "AdminApproveCryptoWithdraw",
//                         tId: matchedPending.tId,
//                         userId: matchedPending.userId,
//                         status: success ? "SUCCESS" : "FAILED",
//                         hash: tx.hash
//                       });
//                     }
      
                 
//                   }
//                 } catch (err) {
//                   console.error("Error decoding transaction:", err.message);
//                 }
//             }
      
//             console.log(`Fetched transactions from block: ${blockNumber}`);
//           }
      
//           return true;
//         } catch (error) {
//           console.error("Error fetching transactions:", error);
//           return [];
//         }
//       }
      
//       async function main() {
//         try {
//           const history = await mongoFunctions.find("Transaction", { status: "PENDING" });
//           console.log("Pending transactions:", history.length);
      
//           const redis = require('./redis')

//           await redis.set("CPG_ALL_CRONS",true)

//           const eth_block = await redis.get(
//                 "cpg_eth_block"
//               );
//               console.log("eth_block--->",eth_block);
//             const endblock = await provider.getBlock(eth_block);

//               const startblock = parseFloat(endblock) - parseFloat(eth_block);
      
//           const transactions = await getTransactionsInBlockRange(startblock, endblock, history);
//           console.log(`Transactions fetched:`, transactions);
//         } catch (err) {
//           console.error("Error in main:", err);
//         }
//       }


const axios = require("axios");
async function fetchData() {


// const API_KEY = "3UPEGEFB3A7RZPYSMM587W7E912GFBX29F";
const API_KEY ="cqt_rQxb3RDHmgBJY4R9mtTy7BCJDDDv"
const address = "0x3c8e934d44305cf943b7cb32fb8e86d31fba5cd8";

// const url = `https://api-testnet.bscscan.com/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${API_KEY}`;
// const url = `https://api.etherscan.io/v2/api?97=1&action=balance&apikey=3UPEGEFB3A7RZPYSMM587W7E912GFBX29F`

// const url = `https://api.covalenthq.com/v1/bsc-testnet/address/${address}/transactions_v3/?key=${API_KEY}`;
const eth_block = await redis.get(
                        "cpg_eth_block"
                      );
                      console.log("eth_block--->",eth_block);
let chain_id = 97; // BSC Testnet chain ID
const url = `https://api.covalenthq.com/v1/${chain_id}/address/${address}/balances_v2/?key=${API_KEY}`

try {
    const response = await axios.get(url);
    console.log(response.data.data);
}
catch (error) {
    console.error("Error fetching data:", error);
}
}
fetchData();