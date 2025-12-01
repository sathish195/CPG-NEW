const mongoFunctions = require("./mongoFunctions");
const controllers = require("./controllers");

const DEFAULT_COINS = {
  bitcoin: "0.00000000",
  usdc: "0.00",
  usdt: "0.00"
};

async function saveStats(type, amount, coin) {
  // normalize inputs
  coin = (coin || "").toLowerCase();
  const precision = coin === "bitcoin" ? 8 : 2;

  log("Saving stats:", { type, amount, coin });

  if (!["deposits", "withdraw"].includes(type)) {
    throw new Error('type must be "deposits" or "withdraw"');
  }
  if (!coin) throw new Error("coin is required");

  // Normalize amount using your helper (returns formatted string or number)
  const amtStr = (amount === undefined || amount === null)
    ? "0"
    : controllers.getExactLength(amount, precision);

  // date key (YYYY-MM-DD)
  const date = new Date().toISOString().split("T")[0];

  // get existing stats docs for today (your mongoFunctions.find returns an array)
  const existing = await mongoFunctions.find("Statistics", {});
  log("Existing stats for date", date, "count:", (existing || []).length);

  if (!existing || existing.length === 0) {
    log("No existing stats for date", date, "- creating new document");

    const depositsObj = { ...DEFAULT_COINS };
    const withdrawObj = { ...DEFAULT_COINS };

    if (type === "deposits") depositsObj[coin] = amtStr;
    else withdrawObj[coin] = amtStr;

    // create and return new document
    return await mongoFunctions.create("Statistics", {
      date,
      deposits: depositsObj,
      withdraw: withdrawObj
    });
  }

  // document exists -> update only the provided field
  let prevBal = existing[0][type] && existing[0][type][coin];
  if (prevBal === undefined || prevBal === null) {
    // if missing, assume default
    prevBal = DEFAULT_COINS[coin] || "0";
  }

  // Use your controller to normalize prevBal and amount to correct precision
  const prevNormalized = controllers.getExactLength(prevBal, precision);
  const amountNormalized = controllers.getExactLength(amount, precision);

  log("Previous Balance (normalized):", prevNormalized);
  log("Amount to add (normalized):", amountNormalized);

  // do arithmetic as numbers, then format to the required precision
  const prevNum = parseFloat(prevNormalized);
  const addNum = parseFloat(amountNormalized);

  if (Number.isNaN(prevNum) || Number.isNaN(addNum)) {
    throw new Error(`Invalid numeric value: prev='${prevNormalized}', amount='${amountNormalized}'`);
  }

  const newBalStr = (prevNum + addNum).toFixed(precision);
  log("New balance computed:", newBalStr);

  const update = { $set: { [`${type}.${coin}`]: newBalStr } };

  // filter by date to update the right doc
  const updated = await mongoFunctions.findOneAndUpdate(
    "Statistics",
    { date },
    update,
    { new: true }
  );

  return updated;
}

module.exports = { saveStats };
