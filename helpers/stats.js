const mongoFunctions = require("./mongoFunctions");
const controllers = require("./controllers");

const DEFAULT_COINS = {
  bitcoin: "0.00000000",
  usdc: "0.00",
  usdt: "0.00"
};

async function saveStats(type, amount, coin) {
  const precision = coin === "bitcoin" ? 8 : 2;

  console.log("Saving stats:", { type, amount, coin });

  if (!["deposits", "withdraw"].includes(type)) {
    throw new Error('type must be "deposits" or "withdraw"');
  }

  if (!coin) {
    throw new Error("coin is required");
  }

  // normalize incoming amount
  const amountStr = controllers.getExactLength(amount || "0", precision);

  // Today in YYYY-MM-DD
  const date = new Date().toISOString().split("T")[0];

  // ❗ Get today's stats document only
  const existing = await mongoFunctions.find("Statistics", { date });
  console.log("Existing stats for today:", existing.length);

  // ------------------------------------------------------------------
  // CASE 1: Document doesn't exist → create new document
  // ------------------------------------------------------------------
  if (!existing || existing.length === 0) {
    console.log("No doc for today → creating new stats");

    const depositsObj = { ...DEFAULT_COINS };
    const withdrawObj = { ...DEFAULT_COINS };

    if (type === "deposits") {
      depositsObj[coin] = amountStr;
    } else {
      withdrawObj[coin] = amountStr;
    }

    return await mongoFunctions.create("Statistics", {
      date,
      deposits: depositsObj,
      withdraw: withdrawObj
    });
  }

  // ------------------------------------------------------------------
  // CASE 2: Document exists → update it
  // ------------------------------------------------------------------

  const doc = existing[0];

  let prevBalance = doc[type][coin];
  if (!prevBalance) {
    prevBalance = DEFAULT_COINS[coin];
  }

  // normalize both values
  const prevNormalized = controllers.getExactLength(prevBalance, precision);
  const amtNormalized = controllers.getExactLength(amount, precision);

  const prevNum = parseFloat(prevNormalized);
  const addNum = parseFloat(amtNormalized);

  if (isNaN(prevNum) || isNaN(addNum)) {
    throw new Error(`Invalid numeric values prev='${prevNormalized}' amount='${amtNormalized}'`);
  }

  const newBalance = (prevNum + addNum).toFixed(precision);

  console.log("Updated balance:", newBalance);

  // update ONLY today's document
  const updated = await mongoFunctions.findOneAndUpdate(
    "Statistics",
    { date },
    { $set: { [`${type}.${coin}`]: newBalance } },
    { new: true }
  );

  return updated;
}

module.exports = { saveStats };
