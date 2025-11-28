const { required } = require('joi');
const mongoose = require('mongoose');

// Define the schema for cryptocurrency transactions (history)
const historySchema = mongoose.Schema({
    t_id: { type: String, required: true, unique: true },           // Transaction ID
    type: {
        type: String,
        required: true,
        enum: ["DEPOSIT", "WITHDRAWAL"],
        uppercase: true,                                          // Transaction type (DEPOSIT or WITHDRAWAL)
    },
    userId: { type: String, required: true },                      // User ID
    userName: { type: String,  },                    // User's name
    coinName: { type: String, required: true },                     // Coin name (e.g., 'BTC', 'ETH')
    amount: { type: Number, required: true },                       // Amount for the transaction
    address: { type: String, required: true },                      // Crypto address
    fee: { type: Number, required: true },                          // Fee for the transaction
    comment: { type: String, default: "" }, 
    comment: { type: String,required:true }, 

    
    status: {
        type: String,
        required: true,
        enum: ["PENDING", "SUCCESS", "FAILED"],                    // Transaction status
        default: "PENDING",
    },
    others: { type: Object, default: {} }

}, {
    timestamps: true,  // Add createdAt and updatedAt fields
    toJSON: {
        getters: true
    }
});

// Create the Mongoose model for the "History" collection
const History = mongoose.model("History", historySchema);

// Export the model
module.exports = History;
