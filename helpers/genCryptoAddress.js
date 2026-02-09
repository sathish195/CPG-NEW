// const { Web3 } = require("web3"); 

// const address_generate = async () => {
//   const busd_link = "https://bsc-dataseed.binance.org/";  

//   try {
    
//     const web3 = new Web3(busd_link); 

//     const address = await web3.eth.accounts.create(); 
//     console.log("Address created:", address);
//     return address;
//   } catch (error) {
//     console.error("Error creating address:", error);
//     return false;
//   }
// };

// // address_generate();
// module.exports = { address_generate };
const axios = require("axios")



const { Web3 } = require("web3"); 
const { log } = require("winston");
const crypto = require("./cryptojs");
const {TronWeb} = require('tronweb');


const address_generate = async (user,chain) => {
  console.log("Generating address for user:", user.userId, "on chain:", chain);
  // Bitcoin
  try {
    if (chain === "Bitcoin") {
      console.log("bitcotin-------------------------->");
      var body = {
        name: user.userId,
        key: "a252Ada0908a4a34d33bb5",
      };
      const result = await axios({
        method: "post",
        url: "http://topbtc-1664110145.us-east-2.elb.amazonaws.com/api/crypt/genaddress",
        data: body,
      });
      console.log(result,"bitcotin-------------------------->")

      // console.log(result);

      if (result && result.data && result.data.address) {
        console.log(result.data);
        return result.data
        
      }
    return false;
    } else if (chain === "Tron") {
      var privateKey = crypto.generateRandomString()
      // var tron_key_check = await rediscon.redisExistSingle("tronkey");
      // if (tron_key_check) {
        var tron_key = "86fca927-f9c2-4889-a7f1-ed521085fc7b"
        // await rediscon.redisget_normal_single("tronkey");
        if (tron_key) {
          const tronWeb = new TronWeb({
            fullHost: "https://api.trongrid.io",
            headers: {
              "TRON-PRO-API-KEY": tron_key,
            },
            privateKey: privateKey,
          });
          const acc = await tronWeb.createAccount();    

          return acc;
        }
        return false;
      }
    // } 
    else if (chain === "Binance Smart") {
  const busd_link = "https://bsc-dataseed.binance.org/";  
    const web3 = new Web3(busd_link); 
    const address = await web3.eth.accounts.create(); 
    console.log("Address created:", address);
    return address;
    }

    else if (chain === "Sepolia") {
// const API_KEY = "3UPEGEFB3A7RZPYSMM587W7E912GFBX29F"


//       const sepolia_rpc = `https://sepolia.infura.io`;
//       const web3 = new Web3(sepolia_rpc);
    
//       const account = web3.eth.accounts.create(); 

      const web3 = new Web3();
      const account = web3.eth.accounts.create();
      console.log("Sepolia address created:", account.address);
    
      return account; // includes address + private key
    }
    
     else if (chain === "Ethereum") {
      // var eth_link_check = await rediscon.redisExistSingle("ethlink");
      // if (eth_link_check) {
      //   var eth_link = await rediscon.redisget_normal_single("ethlink");
      const  eth_link = "https://eth.llamarpc.com";
          var web3 = new Web3(new Web3.providers.HttpProvider(eth_link));
          var address = await web3.eth.accounts.create();
          return address
        
    } else if (chain === "VENOM") {
      if (!user["cryptoaddress"] || !user["cryptoaddress"][chain]) {
        let venom_dataa = execSync(
          `/home/ubuntu/ever-wallet-api/scripts/wallet.sh -m create_account --account-type SafeMultisig`
        );
        // let venom_dataa = execSync(
        //   "~/home/ubuntu/ever-wallet-api-master/scripts/wallet.sh -m create_account --account-type SafeMultisig"
        // );
        let stdout = JSON.parse(venom_dataa.toString("utf-8"));
        console.log("std-->", stdout);
        if (stdout && stdout.status === "Ok" && stdout.data) {
          let address = `${stdout.data.workchainId}:${stdout.data.hex}`;
          var user_update = await mongofunctions.find_one_and_update(
            collection,
            { userid: user.userid },
            {
              [`cryptoaddress.${chain}`]: address,
              ["balances.venom"]: "0",
              [`balances.phpv (stable)`]: "0",
              [`others.${chain}`]: tige.encrypt(
                JSON.stringify(stdout.data)
              ),
            },
            { new: true }
          );
          let up_redis =
            collection === "Member"
              ? await rediscon.UserData(user_update.userid)
              : await rediscon.b2buser_Data(user_update);

          return true;
        }
        return true;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error creating address:", error);
    return false;
  }
};

// address_generate();
module.exports = { address_generate };
