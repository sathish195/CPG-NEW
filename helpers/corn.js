console.log("sathish");

const cron = require('node-cron');
const {all_deposits} = require('./all_deposits');
// const {saveStats} = await require('./stats');
const {Settlement} = require('./cronJobs');

// Schedule the task to run every minute
cron.schedule('*/2 * * * *', async () => {
  console.log('----------------------------------run------------------------->');
  console.log('This task runs every minute');

  try {
    const deposits = await all_deposits();
    // const stats = await saveStats();
    // const settlement = await Settlement();

    // console.log("Deposits fetched:", settlement);
    console.log("Deposits fetched:", deposits);
    return deposits;
  } catch (err) {
    console.error("Error fetching deposits:", err);
  }

  return true;
});
