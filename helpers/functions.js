require("dotenv").config();
const Web3 = require("web3");
const { ethers } = require("ethers");
const TronWeb = require("tronweb");
const { bullprocess } = require("../helpers/bull_process");
const ABI = [
  {
    inputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    constant: true,
    inputs: [],
    name: "_decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "_name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "_symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "burn",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "getOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

const axios = require("axios");
const rediscon = require("./redis");
const mongofunctions = require("./mongoFunctions");
const { alert_Dev } = require("./telegram");
const tron_key = process.env.TRON_KEY;
const bsc_link =
  "https://nd-791-836-551.p2pify.com/32766e338388be45072d18e0be86a513";
const eth_link =
  "https://ethereum-mainnet.core.chainstack.com/067114e2dbc3ecc411e343c3d9d8f87e";
const bsc_web3 = new Web3(new Web3.providers.HttpProvider(bsc_link));
const eth_web3 = new Web3(new Web3.providers.HttpProvider(eth_link));
const eth_provider = new ethers.providers.JsonRpcProvider(eth_link);
const bsc_provider = new ethers.providers.JsonRpcProvider(bsc_link);
const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io",
  headers: {
    "TRON-PRO-API-KEY": "86fca927-f9c2-4889-a7f1-ed521085fc7b", //tron_key,
  },
});
module.exports = {
  get_transactions: async (chain,chain_id, contract_address, address) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (chain === "Binance Smart") {
          const bsc_block = await rediscon.get(
            "TOP_bsc_block"
          );
          const endblock = await bsc_web3.eth.getBlockNumber();
          const startblock = parseFloat(endblock) - parseFloat(bsc_block);
          let url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${contract_address}&address=${address}&page=1&offset=50&startblock=${startblock}&endblock=${endblock}&sort=asc&apikey=2UBCF9JBZI9AD23351UKU7VEG5682EBZJA`;
          axios
            .get(url)
            .then((response) => {
              if (response.data.status === "0") {
                resolve([]);
              } else if (response.data && response.data.result) {
                resolve(response.data.result);
              }
            })
            .catch((error) => {
              alert_Dev(
                `err in crypto functions get transactions BSC-->${JSON.stringify(
                  {
                    err: error,
                  }
                )}`
              );
              reject(error);
            });
        } else if (chain === "Ethereum") {
          const eth_block = await rediscon.redisget_normal_single(
            "TOP_eth_block"
          );
          const endblock = await eth_web3.eth.getBlockNumber();
          const startblock = parseFloat(endblock) - parseFloat(eth_block);
          let url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${contract_address}&address=${address}&page=1&offset=50&startblock=${startblock}&endblock=${endblock}&sort=asc&apikey=RB1ZG5IRRQCCMK41KAUNA4D92XY1Z13TCA`;
          axios
            .get(url)
            .then((response) => {
              if (response.data.status === "0") {
                resolve([]);
              } else if (response.data && response.data.result) {
                resolve(response.data.result);
              }
            })
            .catch((error) => {
              alert_Dev(
                `err in crypto functions get transactions ETH-->${JSON.stringify(
                  {
                    err: error,
                  }
                )}`
              );
              reject(error);
            });
        } else if (chain === "Tron") {
          const tron_time = await rediscon.redisget_normal_single(
            "TOP_TRON_TIME"
          );
          var now = Date.now();
          var onehour = Date.now() - 3600000 * parseFloat(tron_time);
          let url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?&contract_address=${contract_address}&only_confirmed=true&event_name=Transfer&limit=100&min_timestamp=${onehour}&max_timestamp=${now}&order_by=timestamp,asc`;
          axios
            .get(url)
            .then((response) => {
              if (response.data && response.data.data) {
                resolve(response.data.data);
              }
            })
            .catch((error) => {
              alert_Dev(
                `err in crypto functions get transactions TRON-->${JSON.stringify(
                  {
                    err: error,
                  }
                )}`
              );
              reject(error);
            });
        }
       else if (chain === "BSC testnet") {
            const bsc_block = await rediscon.get(
              "cpg_eth_block"
            );
            const endblock = await bsc_web3.eth.getBlockNumber();
            const startblock = parseFloat(endblock) - parseFloat(bsc_block);
            // const url = `https://api.covalenthq.com/v1/${chain_id}/address/${address}/balances_v2/?key=cqt_rQxb3RDHmgBJY4R9mtTy7BCJDDDv`
            const url = `https://api.covalenthq.com/v1/97/address/${address}/transactions_v3/?starting-block=${startblock}&ending-block=${endblock}&key=cqt_rQxb3RDHmgBJY4R9mtTy7BCJDDDv`;

            axios
              .get(url)
              .then((response) => {
                if (response.data.status === "0") {
                  resolve([]);
                } else if (response.data && response.data.result) {
                  resolve(response.data.result);
                }
              })
              .catch((error) => {
                alert_Dev(
                  `err in crypto functions get transactions BSC-->${JSON.stringify(
                    {
                      err: error,
                    }
                  )}`
                );
                reject(error);
              });
          } 
      } catch (error) {
        alert_Dev(`err in crypto functions get transactions catch-->${error}`);
      }
    });
  },
  check_history: async (tid) => {
    return new Promise(async (resolve, reject) => {
      var check_histoty_crypto = await mongofunctions.find_one(
        "Transaction",
        {
          type: "DEPOSIT",
          hash: tid,
        }
      );
      if (!check_histoty_crypto) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  },
  get_balance: async (chain, address, contract_address) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (chain === "Tron") {
          tronWeb.setAddress(contract_address);
          const { abi } = await tronWeb.trx.getContract(contract_address);
          const contract = tronWeb.contract(abi.entrys, contract_address);
          const balance = await contract.methods.balanceOf(address).call();
          var tronwebbalance = parseFloat(balance) / 1000000;
          resolve(tronwebbalance);
        } else if (chain === "Ethereum") {
          const contract = new ethers.Contract(
            contract_address,
            ABI,
            eth_provider
          );
          const bl = await contract.balanceOf(address);
          const balanceInWei = bl.toString();
          const bscanbalance = parseFloat(balanceInWei) / 1000000;
          resolve(bscanbalance);
        } else if (chain === "Binance Smart") {
          const contract = new ethers.Contract(
            contract_address,
            ABI,
            bsc_provider
          );
          const bl = await contract.balanceOf(address);
          const balanceInWei = await bsc_web3.utils.fromWei(bl._hex);
          const bscanbalance = parseFloat(balanceInWei);
          resolve(bscanbalance);
        }
        else if (chain === "BSC testnet") {
            const contract = new ethers.Contract(
              contract_address,
              ABI,
              bsc_provider
            );
            const bl = await contract.balanceOf(address);
            const balanceInWei = await bsc_web3.utils.fromWei(bl._hex);
            const bscanbalance = parseFloat(balanceInWei);
            resolve(bscanbalance);
          }
      } catch (error) {
        alert_Dev(
          `err in crypto functions get balance-->${JSON.stringify({
            err: error,
          })}`
        );
        reject(error);
      }
    });
  },
  add_queue: async (
    amount,
    txd,
    chain,
    coin,
    userid,
    fee,
    address,
    from_address,
    hash
  ) => {
    return new Promise(async (resolve, reject) => {
      const queue_obj = {
     type: "AdminApproveCryptoWithdraw", 
     tId: txd, 
     userId: userid,
     status:payload.status ,
     hash : hash
      };
      resolve(await bullprocess(queue_obj, 5));
    });
  },
};
