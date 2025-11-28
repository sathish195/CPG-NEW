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
        // const provider = new ethers.JsonRpcProvider(BSC_TESTNET.rpcUrls[0]);

        // / Create an Interface object for decoding the data
        // const iface = new ethers.Interface(tokenAbi);

        // async function getTransactionsInBlockRange(startBlock, endBlock, pendingHistory) {
        //         const transactions = [];
        
        //         try {
        //         for (let blockNumber = startBlock; blockNumber <= endBlock; blockNumber++) {
        //                 // console.log("Data------");
        //         const block = await provider.getBlock(blockNumber);
        //         // console.log("Data------",block);

        //         if (!block || !block.transactions) continue;
        
        //         for (const txHash of block.transactions) {
        //         const tx = await provider.getTransaction(txHash);
        //         if (!tx || !tx.to) continue;
        
        //         // Only consider transactions to the monitored contract
        //                 try {
        //                 if (tx.data.startsWith("0xa9059cbb")) {
        //                 const decoded = iface.decodeFunctionData("transfer", tx.data);
        //                 const recipient = decoded[0];
        //                 const amount = decoded[1];
        //                 const formattedAmount = ethers.formatUnits(amount, 18);
        
        //                 const txReceipt = await provider.getTransactionReceipt(tx.hash);
        //                 const success = txReceipt.status === 1;
        
        //                 console.log(`TxHash: ${tx.hash} | Recipient: ${recipient} | Amount: ${formattedAmount} | Status: ${success ? "SUCCESS" : "FAILED"}`);
        
        //                 // Match pending transactions
        //                 //     const matchedPending = pendingHistory.find(p => p.addres.toLowerCase() === recipient.toLowerCase() );
        //                 const matchedPending = pendingHistory.find(
        //                         p => p.address.toLowerCase() === recipient.toLowerCase() && success
        //                 );
                        
        //                 if (matchedPending) {
        //                 console.log("Matched pending transaction for address:", recipient);
        //                 // await producer.addJob({
        //                 //         type: "AdminApproveCryptoWithdraw",
        //                 //         tId: matchedPending.tId,
        //                 //         userId: matchedPending.userId,
        //                 //         status: success ? "SUCCESS" : "FAILED",
        //                 //         hash: tx.hash
        //                 // });


        //                 await producer.addJob({
        //                         type: "CRYPTO_DEPOSITS",
        //                         txd: matchedPending.tId,
        //                         userid: matchedPending.userId,
        //                         hash: tx.hash,
        //                         coin:matchedPending.coinName,
        //                         chain:matchedPending.chainName,
        //                         fee:matchedPending.fee,
        //                         amount:formattedAmount,
        //                         address:matchedPending.address,
        //                 });
        //                 }
        
                        
        //                 }
        //                 } catch (err) {
        //                 console.error("Error decoding transaction:", err.message);
        //                 }
        //         }
        
        //         console.log(`Fetched transactions from block: ${blockNumber}`);
        //         }
        
        //         return true;
        //         } catch (error) {
        //         console.error("Error fetching transactions:", error);
        //         return [];
        //         }
        // }
        
        // async function main() {
        //         try {
        //         const history = await mongoFunctions.find("Transaction", { status: "PENDING" });
        //         console.log("Pending transactions:", history.length);
        
        //         const redis = require('./redis')

        //         await redis.set("CPG_ALL_CRONS",true)

        //         const eth_block = await redis.get(
        //                 "cpg_eth_block"
        //         );
        //         console.log("eth_block--->",eth_block);
        //         const endblock = await provider.getBlockNumber(eth_block);

        //         const startblock = parseFloat(endblock) - parseFloat(eth_block);
        //         console.log(startblock,"blockstart------>");
        
        //         const transactions = await getTransactionsInBlockRange(	75326849,75326849, history);
        //         console.log(`Transactions fetched:`, transactions);
        //         } catch (err) {
        //         console.error("Error in main:", err);
        //         }
        // }

        // main()








//         const axios = require('axios');
// // The wallet address to check for incoming transactions
// // const wallet_address = "0x3c8e934d44305cf943b7cb32fb8e86d31fba5cd8";
// const wallet_address = "0xbBB3D4891Eb70817E27E92537dF2e54B8AF98f8e"
// const blockRange = 1000; // You can change this value depending on how far back you want to look

// const apiKey = 'cqt_rQxb3RDHmgBJY4R9mtTy7BCJDDDv'; // Replace with your API key

// // Function to fetch and filter transactions
// async function fetchTransactions() {
//   try {
//     // Get the latest block number using the provider
//     const currentBlock = await provider.getBlockNumber();
//     console.log("Latest Block Number:", currentBlock);

//     // Calculate start block based on the current block and block range
//     const startblock = currentBlock - blockRange;
//     const endblock = currentBlock; // End block is the current block

//     console.log(`Fetching transactions from block ${startblock} to ${endblock}`);

//     // Build the Covalent API URL
//     const url = `https://api.covalenthq.com/v1/97/address/${wallet_address}/transactions_v3/?starting-block=${startblock}&ending-block=${endblock}&key=${apiKey}`;

//     // Make the API request to fetch the transactions
//     const response = await axios.get(url);
    
//     // Log the full response for debugging
//     console.log("Full Covalent Response:", response.data);
    
//     const transactions = response.data.data.items;

//     // Log all fetched transactions for debugging
//     console.log("Fetched Transactions:", transactions);

//     // Loop through each transaction and check if it matches the wallet address
// //     let matchFound = false;
// //     for (const tx of transactions) {
// //       // Debugging log for each transaction's to_address and wallet address
// //       console.log(`Checking transaction ${tx.tx_hash} with to_address: ${tx.to_address}`);
      
// //       if (tx.to_address && tx.to_address.toLowerCase() === wallet_address.toLowerCase()) {
// //         console.log("Matched Transaction:", tx);
// //         matchFound = true;
// //       }
// //     }

// //     // If no matches found
// //     if (!matchFound) {
// //       console.log("No transactions matched for the given wallet address in the specified block range.");
// //     }

//   } catch (err) {
//     // Improved error handling
//     console.error("Error fetching transactions:", err.message);

//     // If the error has a response from the API, log more details
//     if (err.response) {
//       console.error("API response error:", err.response.status);
//       console.error("Error details:", err.response.data);
//     }
//   }
// }

// // Call the function to fetch transactions
// fetchTransactions();








// Etherscan API endpoint

// Replace with your actual address and Etherscan API key
// 0x4CCc8accD389e3E536Bf199F93826FdcaF4dfF09
// const axios = require('axios');

// const API_KEY = "3UPEGEFB3A7RZPYSMM587W7E912GFBX29F";
// const ADDRESS = "0x3c8e934d44305cf943b7cb32fb8e86d31fba5cd8";
// const CHAIN_ID = 11155111; // Sepolia Testnet

// async function getTransactions() {
//   const url = `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}&module=account&action=txlist&address=${ADDRESS}&apikey=${API_KEY}`;

//   try {
//     const { data } = await axios.get(url);

//     if (data.status === "1") {
//       console.log(`Found ${data.result.length} transactions:`);
//       console.log(data.result);
//     } else {
//       console.log("Error:", data.result);
//     }
//   } catch (err) {
//     console.error("Request failed:", err.message);
//   }
// }

// getTransactions();



const axios = require("axios");
// const { ethers } = require("ethers");

const API_KEY = "3UPEGEFB3A7RZPYSMM587W7E912GFBX29F";
const ADDRESS = "0x3c8e934d44305cf943b7cb32fb8e86d31fba5cd8";
const CHAIN_ID = 11155111; // Sepolia
const START_BLOCK = 9700000;
const END_BLOCK = 9725000;

async function getTxByBlockRange() {
//   const url = `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}&module=account&action=txlist&address=${ADDRESS}&startblock=${START_BLOCK}&endblock=${END_BLOCK}&sort=asc&apikey=${API_KEY}`;
//   const url = `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}&module=account&action=txlist&address=${ADDRESS}&sort=asc&apikey=${API_KEY}`;
//   const url =  `https://api.etherscan.io/v2/api?chainid=11155111&action=balance&apikey=3UPEGEFB3A7RZPYSMM587W7E912GFBX29F`
 

// Construct the API URL with the address, chainId, and API Key
const url = `https://api.etherscan.io/v2/api?module=account&action=balance&address=${ADDRESS}&chainid=${CHAIN_ID}&apikey=${API_KEY}`;


  

  try {
    const { data } = await axios.get(url);
    console.log(data);

    if (data.status === "1") {
      console.log(`Found ${data.result.length} transactions between blocks ${START_BLOCK} and ${END_BLOCK}:`);

      data.result.forEach((tx) => {
        const valueInEth = ethers.formatEther(tx.value);
        console.log(`Block: ${tx.blockNumber} | From: ${tx.from} | To: ${tx.to} | Amount: ${valueInEth} ETH | TxHash: ${tx.hash}`);
      });
    } else {
      console.log("No transactions found in this block range:", data.result);
    }
  } catch (err) {
    console.error("Error fetching transactions:", err.message);
  }
}

getTxByBlockRange();



// Set up the provider (Sepolia RPC)
const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");

// Define the address for which you want to get the balance
const address = "0x3c8e934d44305cf943b7cb32fb8e86d31fba5cd8"; // Replace with the actual address

async function getBalance() {
  try {
    // Fetch the balance of the address
    const balance = await provider.getBalance(address);

    // Check if the balance is fetched properly
    if (!balance) {
      throw new Error("Balance not found for this address");
    }

    // Convert the balance from wei to ether (ETH)
    const balanceInEth = ethers.utils.formatEther(balance);

    console.log(`Balance of address ${address}: ${balanceInEth} ETH`);
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
}

// Get the balance of the address
// getBalance();
