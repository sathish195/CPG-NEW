console.log("sathish");

const cron = require('node-cron');
const {all_deposits} = require('./all_deposits');
// const {saveStats} = await require('./stats');
const {Settlement} = require('./cronJobs');

// Schedule the task to run every minute
cron.schedule('* * * * *', async () => {
  console.log('----------------------------------sathish------------------------->');
  console.log('This task runs every minute');

  try {
    const deposits = await all_deposits();
    // const stats = await saveStats();
    // const settlement = await Settlement();

    // logic("Deposits fetched:", stats);
    console.log("Deposits fetched:", deposits);
  } catch (err) {
    console.error("Error fetching deposits:", err);
  }

  return true;
});
