// console.log("sathish");


// const { all_deposits } = require('); 
// async function run() {
//     console.log("----------------------------------sathish------------------------->");
// //   // Call the function
//   const deposits = await all_deposits();
//   console.log(deposits); // This should log the result from all_deposits()
//   return true
// }

// // Run the function
// run();



const cron = require('node-cron');

// Schedule the task to run every minute
cron.schedule('* * * * *', () => {
  console.log('This task runs every minute');
  // Your custom functionality goes here
});
