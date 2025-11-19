const mongoFunctions = require("./mongoFunctions")
const redis = require("./redis")
const telegram = require("./telegram")

module.exports = {
    crypto_withdaw: async (job) => {
        try {
            const { tId, userId } = job.data
            // get transaction
            const transaction = await mongoFunctions.findOne("Transaction", { tId, userId, status: "PENDING" })
            if(transaction) {
                // get user
                const user = await mongoFunctions.findOne("User", { userId, status: "ACTIVE", withdrawStatus: "ENABLE" })
                if(user) {
                    // get admin controls
                    const adminControls = await redis.hGet("cpg_admin", "controls", "AdminControls", { })
                    if(adminControls && adminControls.withdraw === "ENABLE") {
                        // get current coin controls
                        const allCoins = adminControls.coins
                        const currentCoin = (allCoins.filter(coin => coin.coinId === transaction.coinId))[0]
                        if(currentCoin && currentCoin.withdraw?.withdrawStatus === "ENABLE") {
                            // create amounts
                            const requestedAmount = parseFloat(transaction.amount)
                            const amountToBeTransfer = transaction.amount - transaction.fee
                            // const requestedAmount = Number(transaction.amount);

                            // Get current balance (string → number)
                            const currentBalance = parseFloat(
                                user.balances.find(b => b.coinId === transaction.coinId).balance
                            );
                            
                            if (currentBalance < requestedAmount) throw new Error("Insufficient funds");

                            const precision = Number(balanceObj.precision || 2);
                            const newBalanceStr = (currentBalance - requestedAmount).toFixed(precision);
                            
                            // filter must match the array element
                            const filter = {
                              userId: user.userId,
                              "balances.coinId": transaction.coinId
                            };
                            
                            const update = {
                              $set: {
                                "balances.$.balance": newBalanceStr // NOTE the $. here
                              }
                            };
                            
                            
                            
                            const updatedUser = await mongoFunctions.findOneAndUpdate(
                                "User",
                                filter,
                                update,
                                { new: true }
                            );
                            
                            await redis.hSet("cpg_users", user.email, JSON.stringify(updatedUser)) // update in redis
        
                            // transaction success
                            const finalTransaction = await mongoFunctions.findOneAndUpdate("Transaction", { tId: transaction.tId }, { status: "SUCCESS", amount: amountToBeTransfer }, { new: true })

                            // alert dev
                            telegram.alertDev(`✅ Transaction success ✅ %0A
							tId --> ${finalTransaction.tId} %0A
							type --> ${finalTransaction.type} ${finalTransaction.type === "CREDIT" ? '💵' : '💸'} %0A
							from --> ${user.email} %0A
							coin --> ${finalTransaction.coinName} %0A
							amount --> ${finalTransaction.amount} %0A
							address --> ${finalTransaction.address} %0A
							fee --> ${finalTransaction.fee} %0A
							status --> ${finalTransaction.status} %0A
							comment --> ${finalTransaction.comment}`)
                        }else {
                            // transaction failed
                            await mongoFunctions.findOneAndUpdate("Transaction", { tId: transaction.tId }, { status: "FAILED"})

                            // alert dev
                            telegram.alertDev(`❌ Transaction failed ❌ %0A
							❗ Withdraw status of ${currentCoin.coinName} disabled in admin controls❗ %0A
							tId --> ${transaction.tId} %0A
							type --> ${transaction.type} ${transaction.type === "CREDIT" ? '💵' : '💸'} %0A
							from --> ${user.email} %0A
							coin --> ${transaction.coinName} %0A
							address --> ${transaction.address}`)
                        }
                    }else {
                        // transaction failed
                        await mongoFunctions.findOneAndUpdate("Transaction", { tId: transaction.tId }, { status: "FAILED"})

                        // alert dev
                        telegram.alertDev(`❌ Transaction failed ❌ %0A
						❗ Withdraw status disabled in admin controls ❗ %0A
						tId --> ${transaction.tId} %0A
						type --> ${transaction.type} ${transaction.type === "CREDIT" ? '💵' : '💸'} %0A
						from --> ${user.email} %0A
						coin --> ${transaction.coinName} %0A
						address --> ${transaction.address}`)
                    }
                }else {
                    // transaction failed
                    await mongoFunctions.findOneAndUpdate("Transaction", { tId: transaction.tId }, { status: "FAILED"})

                    // alert dev
                    telegram.alertDev(`❌ Transaction failed ❌ %0A
					❗ User not found ❗ %0A
					tId --> ${transaction.tId} %0A
					userId --> ${userId} %0A
					type --> ${transaction.type} ${transaction.type === "CREDIT" ? '💵' : '💸'} %0A
					coin --> ${transaction.coinName} %0A
					address --> ${transaction.address}`)
                }
            }else {
                // alert dev
                telegram.alertDev(`❌ Transaction failed ❌ %0A
				❗ Transaction not found ❗ %0A
				tId --> ${tId} %0A
				userId --> ${userId}`)
            }
        }catch(err) {
            telegram.alertDev(`Error in crypto withdraw job --> ❌❌❌❌❌❌ \n ${err.stack} \n ❌❌❌❌❌❌`)
        }
    },
    // CRYPTO_DEPOSITS: async (data) => {
    //     try {
    //       const user = await mongofunctions.find_one("USER", {
    //         userid: data.userid,
    //         [`crypto_address.${data.chain}`]: data.address,
    //       });
    //       if (user) {
    //         addlog(
    //           user.userid,
    //           "before crypto deposit--",
    //           JSON.stringify(user),
    //           ""
    //         );
    //         var check_histoty_crypto = await mongofunctions.find_one("HISTORY", {
    //           "others.refno": data.txd,
    //         });
    
    //         if (!check_histoty_crypto) {
    //           let user_balance = parseFloat(user["balances"][data.coin]);
    //           let fee = parseFloat(data.fee);
    //           if (fee >= parseFloat(data.amount)) {
    //             let history_obj = {
    //               t_id: functions.get_random_string("CWD", 14),
    //               type: "DEPOSIT",
    //               userid: user.userid,
    //               user_name: user.user_name,
    //               coin_name: data.coin,
    //               amount: 0,
    //               address: user["crypto_address"][data.chain],
    //               fee: fee,
    //               comment: ` New deposit of ${data.coin} fee is greater than amount`,
    //               status: "Success",
    //               "others.refno": data.txd,
    //               "others.chain": data.chain,
    //             };
    //             await mongofunctions.create_new_record("HISTORY", history_obj);
    //             await tele.alert_Developers(
    //               `✅ New Deposit Received ✅
    //                Fee is greater than Amount
    //                Username: ${user.user_name}
    //                Amount: ${data.amount}
    //                coin: ${data.coin}
    //                chain: ${data.chain}
    //                fee: ${data.fee}`
    //             );
    //           } else {
    //             let amount_to_add = parseFloat(data.amount) - fee;
    //             const update_user_balance = parseFloat(
    //               functions.getExactLength(
    //                 parseFloat(user_balance) + parseFloat(amount_to_add),
    //                 3
    //               )
    //             );
    //             // user balance update
    //             var updated_user = await mongofunctions.find_one_and_update(
    //               "USER",
    //               { userid: user.userid },
    //               { [`balances.${data.coin}`]: update_user_balance },
    //               { new: true }
    //             );
    //             let history_obj = {
    //               t_id: functions.get_random_string("CWD", 14),
    //               type: "DEPOSIT",
    //               userid: updated_user.userid,
    //               user_name: updated_user.user_name,
    //               coin_name: data.coin,
    //               amount: amount_to_add,
    //               address: updated_user["crypto_address"][data.chain],
    //               fee: fee,
    //               comment: ` New deposit of ${data.coin}`,
    //               status: "Success",
    //               "others.refno": data.txd,
    //               "others.chain": data.chain,
    //             };
    //             await mongofunctions.create_new_record("HISTORY", history_obj);
    //             await rediscon.update_user_redis(updated_user);
    //             await functions.updateStats("deposits", data.coin, data.amount);
    //             addlog(
    //               user.userid,
    //               "crypto deposit",
    //               "crypto deposit Success",
    //               `${user.user_name} has deposited ${data.coin}, updated balance from ${user_balance} to ${update_user_balance} ${data.coin} .`
    //             );
    //             addlog(
    //               updated_user.userid,
    //               "after crypto deposit--",
    //               JSON.stringify(updated_user),
    //               ""
    //             );
    //             await tele.alert_Developers(
    //               `✅ New Deposit Received ✅
    //                Username: ${updated_user.user_name}
    //                Amount: ${data.amount}
    //                coin: ${data.coin}
    //                chain: ${data.chain}
    //                fee: ${fee}`
    //             );
    //             return true;
    //           }
    //           return true;
    //         }
    //         return true;
    //       }
    //       return true;
    //     } catch (err) {
    //       tele.alert_Dev(
    //         `❌❌err in project x deposit in bull process-->${err} ❌❌`
    //       );
    //       return true;
    //     } finally {
    //       return true;
    //     }
    //   },
}