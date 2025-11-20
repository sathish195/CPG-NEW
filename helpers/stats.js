// const mongoFunctions = require("./mongoFunctions");

// const DEFAULT_COINS = {
//   bitcoin: "0.00000000",
//   usdc: "0.00",
//   usdt: "0.00"
// };

// async function saveStats(date, deposits = {}, withdraw = {}) {
//   // Check if document exists
//   const doc = await mongoFunctions.find( "Statistics",{});
//   logic("Existing Stats Doc:", doc);

//   if (!doc) {
//     // Create new
//     return await mongoFunctions.create ("Statistics", {
//         date,
//       deposits: { ...DEFAULT_COINS, ...deposits },
//       withdraw: { ...DEFAULT_COINS, ...withdraw }
//     });
//   }

//   // Update existing document for only passed values
//   const update = {};

//   // deposits update
//   for (const key in deposits) {
//     update[`deposits.${key}`] = deposits[key];
//   }

//   // withdraw update
//   for (const key in withdraw) {
//     update[`withdraw.${key}`] = withdraw[key];
//   }

//   return await mongoFunctions.findOneAndUpdate(
//     "Statistics",
//     { },
//     { $set: update },
//     { new: true }
//   );
// }

// module.exports = { saveStats };
