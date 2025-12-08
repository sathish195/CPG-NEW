// // require("dotenv").config();
// // require("../helpers/mongodb")();
const { getExactLength } = require("./controllers");
const mongofunctions = require("./mongoFunctions");
const producer = require("./producer");
const { ethers } = require("ethers");

// const rediscon = require("./redis");
const {
  get_transactions,
  check_history,
  get_balance,
  add_queue,
} = require("./functions");
const { log } = require("winston");
const user = require("../routes/user/user");
// const { log } = require("winston");
const delay = 1500;
async function all_deposits() {
  // console.log("Starting all_deposits cron job...");
  // let check_ALL_cron_status = await rediscon.get("CPG_ALL_CRONS");
  // // // console.log("check_ALL_cron_status-->", check_ALL_cron_status);

  // if (check_ALL_cron_status) {
  //   let cron_status = await rediscon.get("CPG_ALL_CRONS");
  //   if (cron_status) {

  const e_abi =    [
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
]
// const provider = new ethers.JsonRpcProvider(BSC_TESTNET.rpcUrls[0]);

// / Create an Interface object for decoding the data
const iface = new ethers.Interface(e_abi);
  let users = await mongofunctions.find(
    "Transaction",
    { status: "PENDING" },
    { _id: -1 }
  );
  let count = users.length;
  console.log("users length", users.length);
  // console.log(users,"------>users");

  let i = 0;
  for (const each of users) {
    let address = each.address;
    console.log(each);
    // console.log(each, "------>each");
    // console.log({ chain: each.chain, address: each.address });

    if (each.chain === "Tron") {
      await new Promise((resolve) => setTimeout(resolve, delay));
      let arr_data = await get_transactions(
        "Tron",
        "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        address
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      // console.log("arr_data", arr_data.length);

      if (arr_data && arr_data.length > 0) {
        for (const e of arr_data) {
          if (e.to === address) {
            let nohistory = await check_history(e.transaction_id);

            await new Promise((resolve) => setTimeout(resolve, delay));
            if (nohistory) {
              // console.log("no history");

              const tron_balance = await get_balance(
                "Tron",
                address,
                "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
              );
              if (tron_balance) {
                // console.log("tron_balance-->", tron_balance);

                const api_bal = parseFloat(e.value) / 1000000;
                // let fee = parseFloat(api_bal) >= 25 ? 0 : 2.5;
                let fee = 0; //parseFloat(api_bal) >= 25 ? 0 : 2.5;
                // console.log({
                //   tron_bal: parseFloat(getExactLength(tron_balance, 3)),
                //   api_bal: parseFloat(getExactLength(api_bal, 3)),
                // });

                if (
                  parseFloat(getExactLength(tron_balance, 3)) >=
                    parseFloat(getExactLength(api_bal, 3)) &&
                  parseFloat(getExactLength(api_bal, 3)) > 1 &&
                  parseFloat(getExactLength(api_bal, 3)) > fee
                ) {
                  // console.log({
                  //   "t-->": "before bull data",
                  //   amount: parseFloat(getExactLength(api_bal, 3)),
                  //   txd: e.transaction_id,
                  //   chain: "Tron",
                  //   coin: "USDT",
                  //   userid: each.userid,
                  //   fee: fee,
                  //   address,
                  // });

                  let bull_ad = await add_queue(
                    (amount = parseFloat(getExactLength(api_bal, 3))),
                    (txd = e.transaction_id),
                    (chain = "Tron"),
                    (coin = "USDT"),
                    (userid = each.userid),
                    (fee = fee),
                    (address = address),
                    (from_address = e.from)
                  );
                  await new Promise((resolve) => setTimeout(resolve, delay));
                }
              }
            }
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    } else if (each.chain === "Ethereum") {
      let tokens = [
        {
          coin: "USDT",
          contract_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        },
        {
          coin: "USDC",
          contract_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
      ];
      tokens.forEach(async (each_token) => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        let arr_data = await get_transactions(
          "Ethereum",
          each_token.contract_address,
          address
        );
        if (arr_data && arr_data.length > 0) {
          for (const e of arr_data) {
            if (e.to.toUpperCase() === address.toUpperCase()) {
              let nohistory = await check_history(e.hash);
              await new Promise((resolve) => setTimeout(resolve, delay));
              if (nohistory) {
                const eth_balance = await get_balance(
                  "Ethereum",
                  address,
                  each_token.contract_address
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                if (eth_balance) {
                  const api_bal = parseFloat(e.value) / 1000000;
                  let fee = 0; // parseFloat(api_bal) >= 250 ? 0 : 20;
                  if (
                    parseFloat(getExactLength(eth_balance, 3)) >=
                      parseFloat(getExactLength(api_bal, 3)) &&
                    parseFloat(getExactLength(api_bal, 3)) > 1 &&
                    parseFloat(getExactLength(api_bal, 3)) > fee
                  ) {
                    await add_queue(
                      (amount = parseFloat(getExactLength(api_bal, 3))),
                      (txd = e.hash),
                      (chain = "Ethereum"),
                      (coin = each_token.coin),
                      (userid = each.userid),
                      (fee = fee),
                      (address = address),
                      (from_address = e.from)
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                  }
                }
              }
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      });
    } else if (each.chain === "Binance Smart") {
      let tokens = [
        {
          coin: "USDT",
          contract_address: "0x55d398326f99059fF775485246999027B3197955",
        },
        {
          coin: "USDC",
          contract_address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        },
      ];
      tokens.forEach(async (each_token) => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        let arr_data = await get_transactions(
          "Binance Smart",
          each_token.contract_address,
          address
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (arr_data && arr_data.length > 0) {
          for (const e of arr_data) {
            if (
              e.to.toUpperCase() === address.toUpperCase() &&
              parseFloat(e.value) > 0
            ) {
              let nohistory = await check_history(e.hash);
              await new Promise((resolve) => setTimeout(resolve, delay));
              if (nohistory) {
                const bsc_balance = await get_balance(
                  "Binance Smart",
                  address,
                  each_token.contract_address
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                if (bsc_balance) {
                  const api_bal = parseFloat(e.value) / 1000000000000000000;
                  let fee = 0; //parseFloat(api_bal) >= 25 ? 0 : 2.5;
                  if (
                    parseFloat(getExactLength(bsc_balance, 3)) >=
                      parseFloat(getExactLength(api_bal, 3)) &&
                    parseFloat(getExactLength(api_bal, 3)) > 1 &&
                    parseFloat(getExactLength(api_bal, 3)) > fee
                  ) {
                    await add_queue(
                      (amount = parseFloat(getExactLength(api_bal, 3))),
                      (txd = e.hash),
                      (chain = "Binance Smart"),
                      (coin = each_token.coin),
                      (userid = each.userid),
                      (fee = fee),
                      (address = address),
                      (from_address = e.from)
                    );
                  }
                  await new Promise((resolve) => setTimeout(resolve, delay));
                }
              }
            }
          }
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      });
    } else if (each.chain === "BSC testnetR") {
      await new Promise((resolve) => setTimeout(resolve, delay));
      let arr_data = await get_transactions("BSC testnet", address);
      await new Promise((resolve) => setTimeout(resolve, delay));
      // console.log("arr_data", arr_data.length);
      console.log("arr_data", arr_data);

      if (arr_data && arr_data.length > 0) {
        for (const e of arr_data) {
          if (e.to === address) {
            let nohistory = await check_history(e.transaction_id);

            await new Promise((resolve) => setTimeout(resolve, delay));
            if (nohistory) {
              // console.log("no history");

              const test_balance = await get_balance(
                "BSC testnet",
                address,
                "0x3c8e934d44305cf943b7cb32fb8e86d31fba5cd8"
              );
              if (test_balance) {
                // console.log("tron_balance-->", tron_balance);

                const api_bal = parseFloat(e.value) / 1000000;
                // let fee = parseFloat(api_bal) >= 25 ? 0 : 2.5;
                let fee = 0; //parseFloat(api_bal) >= 25 ? 0 : 2.5;
                // console.log({
                //   tron_bal: parseFloat(getExactLength(tron_balance, 3)),
                //   api_bal: parseFloat(getExactLength(api_bal, 3)),
                // });

                if (
                  parseFloat(getExactLength(test_balance, 3)) >=
                    parseFloat(getExactLength(api_bal, 3)) &&
                  parseFloat(getExactLength(api_bal, 3)) > 1 &&
                  parseFloat(getExactLength(api_bal, 3)) > fee
                ) {
                  // console.log({
                  //   "t-->": "before bull data",
                  //   amount: parseFloat(getExactLength(api_bal, 3)),
                  //   txd: e.transaction_id,
                  //   chain: "Tron",
                  //   coin: "USDT",
                  //   userid: each.userid,
                  //   fee: fee,
                  //   address,
                  // });

                  let bull_ad = await add_queue(
                    (amount = parseFloat(getExactLength(api_bal, 3))),
                    (txd = e.transaction_id),
                    (chain = "Tron"),
                    (coin = "USDT"),
                    (userid = each.userid),
                    (fee = fee),
                    (address = address),
                    (from_address = e.from)((hash = e.hash))
                  );
                  await new Promise((resolve) => setTimeout(resolve, delay));
                }
              }
            }
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    } else if (each.chainName.toLowerCase() === "sepolia") {
      console.log("------------> in BSC testnet-------------------");
      await new Promise((resolve) => setTimeout(resolve, delay));
      //             const API_KEY = "3UPEGEFB3A7RZPYSMM587W7E912GFBX29F";
      // const ADDRESS = "0x3c8e934d44305cf943b7cb32fb8e86d31fba5cd8";
      // const CHAIN_ID = 11155111;
      let arr_data = await get_transactions("sepolia",11155111,
        address,
        "",
        each.secret_key);
      await new Promise((resolve) => setTimeout(resolve, delay));
      // console.log("arr_data", arr_data.length);
      // console.log("arr_data", arr_data);
      let i = 1;
      let api_bal=0
      if (arr_data && arr_data.length > 0) {
        for (const e of arr_data) {
          // console.log(i++, "-------> sepolia txs", e.to, "===", address);
            const decoded = iface.decodeFunctionData("transfer", e.input);
            const recipient = decoded[0];
            const amount = decoded[1];
           
  // return true;
  console.log(decoded[0],"====",address);
          if (decoded[0] === address) {
            let nohistory = await check_history(e.tId);
            console.log("nohistory-->", nohistory);

            await new Promise((resolve) => setTimeout(resolve, delay));
            if (nohistory) {
              // console.log("no history");
              api_bal = ethers.formatUnits(amount, 18);
              // console.log(decoded,abi_bal);
              const test_balance = await get_balance(
                "sepolia",
                address,
                "",
                each.secret_key
              );
              console.log("test_balance-->", test_balance);
              if (test_balance) {
                // console.log("tron_balance-->", tron_balance);

                // const api_bal = parseFloat(e.value) / 1000000;
          

                // let fee = parseFloat(api_bal) >= 25 ? 0 : 2.5;
                let fee = each.fee; //parseFloat(api_bal) >= 25 ? 0 : 2.5;
                // console.log({
                //   tron_bal: parseFloat(getExactLength(tron_balance, 3)),
                //   api_bal: parseFloat(getExactLength(api_bal, 3)),
                // });

                if (
                  parseFloat(getExactLength(test_balance, 3)) >=
                    parseFloat(getExactLength(api_bal, 3)) 
                  // parseFloat(getExactLength(api_bal, 3)) > 1 &&
                  // parseFloat(getExactLength(api_bal, 3)) > fee &&
                  // parseFloat(getExactLength(api_bal, 3)) === parseFloat(getExactLength(each.amount,3))
                ) {
                  console.log(
                    "-----------> before adding to bullmq sepolia deposit"
                  );

                  await producer.addJob({
                    type: "CRYPTO_DEPOSITS",
                    txd: each.tId,
                    userid: each.userId,
                    hash: e.hash,
                    coin: each.coinName,
                    chain: each.chainName,
                    fee: fee,
                    amount: api_bal,
                    address: e.to,
                  });
                  console.log(
                    "-----------> before adding to bullmq sepolia deposit"
                  );
                  await new Promise((resolve) => setTimeout(resolve, delay));
                }
              }
            }
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    i += 1;
    if (i >= count) {
      return true;
      // process.exit(0);
    }
  }
  if (i === count) {
    return true;
    // process.exit(0);
  }
  //   }
  // }
  setTimeout(() => {
    // process.exit(0);
    return true;
  }, 280000);
}

// exports.all_deposits = all_deposits;
// all_deposits();

module.exports = { all_deposits };
