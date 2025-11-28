// const User = require("../models/User");
// const mongoFunctions = require("./mongoFunctions");
// const { addJob } = require("./producer");

// const processSettledTransactions = async () => {
//     try {
//         // Find all transactions with "SUCCESS" status (if there are multiple)
//         const settledTransactions = await mongoFunctions.find("Transaction", { status: "SUCCESS" });

//         if (settledTransactions && settledTransactions.length > 0) {
//             for (const item of settledTransactions) {
//                 // Add a job for each settled transaction
//                 await addJob({
//                     type: "DEPOSIT_SETTLEMENT",
//                     tid: item.tId,
//                     userId: item.userId,
//                     amount: item.amount,
//                     fee: item.fee,
//                 });

//             }

//             console.log("All settled transactions processed.");
//         } else {
//             console.log("No settled transactions found.");
//         }
//     } catch (err) {
//         console.error("Error processing transactions:", err);
//     }
// };

// // Call the function to process settled transactions
// processSettledTransactions();




// app.js (or any other file)

// const  all_deposits  = require('./all_deposits'); // Import the function from the file

// async function run() {
//     console.log("----------------------------------sathish------------------------->");
//   // Call the function
//   const deposits = await all_deposits();
//   console.log(deposits); // This should log the result from all_deposits()
//   return true
// }

// // Run the function
// run();
console.log("sathish");
const cron = require('node-cron');
const  all_deposits  = require('./all_deposits'); 

// Schedule the task to run every minute
cron.schedule('* * * * *', async() => {
  console.log('This task runs every minute');
  const deposits = await all_deposits();

  // Your custom functionality goes here
});


