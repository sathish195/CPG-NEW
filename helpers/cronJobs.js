const mongoFunctions = require("./mongoFunctions");
const { alertDev } = require("./telegram")

module.exports = {
    updatePendingTransactions: async () => {
        try {
            // get transactions created within 24hrs
            const prevDay = new Date()
            prevDay.setDate(prevDay.getDate() - 1);
            const filter = {
                status: 'PENDING',
                createdAt: { $lte: prevDay }
            }
            const update = { status: "FAILED" }
            const updatedTransactions = await mongoFunctions.updateMany("Transaction", filter, update)
            alertDev("✅ Updated The Status Of Pending Transactions As Failed ✅")
        }catch(err) {
            alertDev(`❌❌❌❌❌❌ Error in updating transactions cron job --> ${err} ❌❌❌❌❌❌`)
        }
    }
}