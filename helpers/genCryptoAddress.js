const { Web3 } = require("web3"); 

const address_generate = async () => {
  const busd_link = "https://bsc-dataseed.binance.org/";  

  try {
    const web3 = new Web3(busd_link); 

    const address = await web3.eth.accounts.create(); 
    console.log("Address created:", address);
    return address;
  } catch (error) {
    console.error("Error creating address:", error);
    return false;
  }
};

// address_generate();
module.exports = { address_generate };
