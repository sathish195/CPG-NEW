const mongoose = require("mongoose");
const statSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    deposits: { type: Object, default: {} },
    withdraw: { type: Object, default: {} },
  },
  {
    timestamps: true,
  }
);

const Statistics = mongoose.model("Statistics", statSchema)

module.exports = Statistics