const { add } = require("lodash");
const mongoFunctions = require("./mongoFunctions");
const { alertDev } = require("./telegram");
const { updateSettlement } = require("./validations");
const { addJob } = require("./producer");

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
    },
    Settlement: async () => {
        try {
    
            // Fetch settlements
            const settlements = await mongoFunctions.find("Transaction", {
                status: "SUCCESS",
                "others.settlement": false
            });
            console.log("Settlements to process:", settlements.length);
    
            // Validate result
            if (!Array.isArray(settlements) || settlements.length === 0) {
                alertDev("No settlements found for update.");
                return true;
            }
    
            for (const settlement of settlements) {
                // console.log(settlement);
    
                // Validate each settlement record
                if (!settlement || !settlement.tId || !settlement.userId) {
                    alertDev(`Invalid settlement record found: ${JSON.stringify(settlement)}`);
                    continue;
                }
    
                try {
                    await addJob({
                        type: "DEPOSIT_SETTLEMENT",
                        tid: settlement.tId,
                        userId: settlement.userId,
                        amount: settlement.amount ?? 0,
                        fee: settlement.fee ?? 0,
                        coin: settlement.coinName || "UNKNOWN",
                        chain: settlement.chainName || "UNKNOWN",
                    });
    
                    alertDev(`✔ Settlement updated: ${settlement.tId}`);
    
                } catch (err) {
                    alertDev(`❌ Error updating settlement ID: ${settlement._id} --> ${err}`);
                }
            }
    
            return true;
    
        } catch (mainErr) {
            alertDev(`🔥 Fatal Error in Settlement function: ${mainErr}`);
            return false;
        }
    }
    

}