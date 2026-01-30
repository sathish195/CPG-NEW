const mongoFunctions = require("./mongoFunctions");
const redis = require("./redis");
const telegram = require("./telegram");
const controllers = require("./controllers");
const { log } = require("winston");
const { HmacSHA3 } = require("crypto-js");
const cryptojs = require("./cryptojs");
const { set, conformsTo } = require("lodash");
const { saveStats } = require("./stats");
const { getExactLength } = require("./controllers");

module.exports = {
  crypto_withdaw: async (job) => {
    try {
      const { tId, userId } = job.data;
      // get transaction
      const transaction = await mongoFunctions.findOne("Transaction", {
        tId,
        userId,
        status: "PENDING",
      });
      if (transaction) {
        // get user
        const user = await mongoFunctions.findOne("User", {
          userId,
          status: "ACTIVE",
          withdrawStatus: "ENABLE",
        });
        if (user) {
          // get admin controls
          const adminControls = await redis.hGet(
            "cpg_admin",
            "controls",
            "AdminControls",
            {}
          );
          if (adminControls && adminControls.withdraw === "ENABLE") {
            // get current coin controls
            const allCoins = adminControls.coins;
            const currentCoin = allCoins.filter(
              (coin) => coin.coinId === transaction.coinId
            )[0];
            if (
              currentCoin &&
              currentCoin.withdraw?.withdrawStatus === "ENABLE"
            ) {
              // const precision = await controllers.getPrecisionByCoin(0, transaction.coinName)
              // console.log(precision," precision-------------------------------->");
              // console.log(precision.length," precision-------------------------------->");

              const precision =
                transaction.coinName.toLowerCase() === "bitcoin"
                  ? 8
                  : transaction.coinName === "ethereum"
                  ? 18
                  : 2;

              // create amounts
              const requestedAmount = parseFloat(transaction.amount);
              const amountToBeTransfer =
                controllers.getExactLength(transaction.amount, precision) -
                controllers.getExactLength(transaction.fee, precision);

              // const requestedAmount = Number(transaction.amount);

              // Get current balance (string → number)
              const currentBalance = parseFloat(
                user.balances.find((b) => b.coinId === transaction.coinId)
                  .balance
              );

              // Calculate new balance
              const newBalance = (
                controllers.getExactLength(currentBalance, precision) -
                controllers.getExactLength(requestedAmount, precision)
              ).toString();
              console.log(newBalance);

              // Build update
              const filter = {
                userId: user.userId,
                "balances.coinId": transaction.coinId,
              };

              const update = {
                $set: {
                  "balances.$.balance": newBalance,
                },
              };

              const updatedUser = await mongoFunctions.findOneAndUpdate(
                "User",
                filter,
                update,
                { new: true }
              );

              await redis.hSet(
                "cpg_users",
                user.email,
                JSON.stringify(updatedUser)
              ); // update in redis

              // transaction success
              const finalTransaction = await mongoFunctions.findOneAndUpdate(
                "Transaction",
                { tId: transaction.tId },
                { status: "PENDING", amount: amountToBeTransfer },
                { new: true }
              );

              // alert dev
              telegram.alertDev(`✅ Transaction success ✅ %0A
							tId --> ${finalTransaction.tId} %0A
							type --> ${finalTransaction.type} ${
                finalTransaction.type === "CREDIT" ? "💵" : "💸"
              } %0A
							from --> ${user.email} %0A
							coin --> ${finalTransaction.coinName} %0A
							amount --> ${finalTransaction.amount} %0A
							address --> ${finalTransaction.address} %0A
							fee --> ${finalTransaction.fee} %0A
							status --> ${finalTransaction.status} %0A
							comment --> ${finalTransaction.comment}`);
            } else {
              // transaction failed
              await mongoFunctions.findOneAndUpdate(
                "Transaction",
                { tId: transaction.tId },
                { status: "FAILED" }
              );

              // alert dev
              telegram.alertDev(`❌ Transaction failed ❌ %0A
							❗ Withdraw status of ${currentCoin.coinName} disabled in admin controls❗ %0A
							tId --> ${transaction.tId} %0A
							type --> ${transaction.type} ${transaction.type === "CREDIT" ? "💵" : "💸"} %0A
							from --> ${user.email} %0A
							coin --> ${transaction.coinName} %0A
							address --> ${transaction.address}`);
            }
          } else {
            // transaction failed
            await mongoFunctions.findOneAndUpdate(
              "Transaction",
              { tId: transaction.tId },
              { status: "FAILED" }
            );

            // alert dev
            telegram.alertDev(`❌ Transaction failed ❌ %0A
						❗ Withdraw status disabled in admin controls ❗ %0A
						tId --> ${transaction.tId} %0A
						type --> ${transaction.type} ${transaction.type === "CREDIT" ? "💵" : "💸"} %0A
						from --> ${user.email} %0A
						coin --> ${transaction.coinName} %0A
						address --> ${transaction.address}`);
          }
        } else {
          // transaction failed
          await mongoFunctions.findOneAndUpdate(
            "Transaction",
            { tId: transaction.tId },
            { status: "FAILED" }
          );

          // alert dev
          telegram.alertDev(`❌ Transaction failed ❌ %0A
					❗ User not found ❗ %0A
					tId --> ${transaction.tId} %0A
					userId --> ${userId} %0A
					type --> ${transaction.type} ${transaction.type === "CREDIT" ? "💵" : "💸"} %0A
					coin --> ${transaction.coinName} %0A
					address --> ${transaction.address}`);
        }
      } else {
        // alert dev
        telegram.alertDev(`❌ Transaction failed ❌ %0A
				❗ Transaction not found ❗ %0A
				tId --> ${tId} %0A
				userId --> ${userId}`);
      }
    } catch (err) {
      telegram.alertDev(
        `Error in crypto withdraw job --> ❌❌❌❌❌❌ \n ${err.stack} \n ❌❌❌❌❌❌`
      );
    }
  },

  // crypto_deposite: async (job) => {
  //     console.log("sathish----->>");
  //     // {userid,tid,fee,amount,coin,chain}
  //     const data = job.data;

  //     try {
  //         const user = await mongoFunctions.findOne("User", { userId: data.userid });
  //         // console.log(user.balance);
  //         if (user) {
  //             console.log(data.txd);
  //             // Check if the deposit has already been recorded
  //             const check_history_crypto = await mongoFunctions.findOne("History", { "others.refno": data.txd });
  //             console.log("check_history_crypto", "--------------->>", check_history_crypto);
  //             // return true
  //             // 23D7A17877BE7DE3

  //             // If no existing transaction with the same refno
  //             if (!check_history_crypto) {
  //                 // Find the coin object in the user's balances array based on coinName
  //                 const user_balance = user.balances.find(c => c.coinName.toLowerCase() === data.coin.toLowerCase());

  //                 if (user_balance) {
  //                     let fee = parseFloat(data.fee);
  //                     let amount_to_add = parseFloat(data.amount) - fee;
  //                     const updatedBalance = parseFloat(user_balance.balance) + amount_to_add;

  //                     console.log("Current balance:", user_balance.balance);
  //                     console.log("Amount to add:", amount_to_add);
  //                     console.log("Updated balance:", updatedBalance);

  //                     // Build the update query to update the specific balance in the balances array
  //                     const filter = {
  //                         userId: user.userId,
  //                         "balances.coinName": data.coin
  //                     };

  //                     const update = {
  //                         $set: {
  //                             "balances.$.balance": updatedBalance // Update balance for the matched coin
  //                         }
  //                     };

  //                     // Perform the update
  //                     const updated_user = await mongoFunctions.findOneAndUpdate(
  //                         "User",
  //                         filter,
  //                         update,
  //                         { new: true }
  //                     );

  //                     // console.log("Updated user:", updated_user);

  //                     // return true

  //                     // Create the deposit history record
  //                     let history_obj = {
  //                         t_id: cryptojs.generateRandomString(),
  //                         type: "DEPOSIT",
  //                         userId: updated_user.userId,
  //                         userName: updated_user.userName || "",
  //                         coinName: data.coin,
  //                         amount: amount_to_add,
  //                         address: data.address,
  //                         fee: fee,
  //                         comment: `New deposit of ${data.coin}`,
  //                         status: "SUCCESS",
  //                         "others.refno": data.txd,
  //                         "others.chain": data.chain,
  //                     };

  //                     // Save deposit history
  //                     await mongoFunctions.create("History", history_obj);

  //                     // await mongoFunctions.findOneAndUpdate("Transaction",{tId:data.txd},{$status:"SUCCES"})
  //                     await mongoFunctions.findOneAndUpdate(
  //                         "Transaction",
  //                         { tId: data.txd },
  //                         { $set: { status: "SUCCESS" ,"others.hash":data.hash} }
  //                     );

  //                     // Send alert to developers
  //                     telegram.alertDev(
  //                         `✅ New Deposit Received ✅
  //                         Username: ${updated_user.userName}
  //                         Amount: ${data.amount}
  //                         Coin: ${data.coin}
  //                         Chain: ${data.chain}
  //                         Fee: ${fee}`
  //                     );
  //                     return true;

  //                 } else {
  //                     console.log(`Coin ${data.coin} not found in user's balances.`);
  //                     return false;
  //                 }
  //             } else {
  //                 console.log("Transaction already exists with refno:", data.txd);
  //                 return false; // Transaction already exists, no need to proceed further
  //             }
  //         } else {
  //             console.log("User not found");
  //             return false; // User not found
  //         }
  //     } catch (err) {
  //         console.error("Error in deposit process:", err);
  //         telegram.alertDev(`❌❌ Error in project X deposit process --> ${err} ❌❌`);
  //         return false; // Return false on error
  //     }
  // },

  crypto_deposite: async (job) => {
    console.log("sathish----->>");
    // {userid,tid,fee,amount,coin,chain}
    const data = job.data;

    try {
      const user = await mongoFunctions.findOne("User", {
        userId: data.userid,
      });
      // console.log(user.balance);
      if (user) {
        console.log(data.txd);
        // Check if the deposit has already been recorded
        const check_history_crypto = await mongoFunctions.findOne(
          "Transaction",
          { tId: data.txd, status: "PENDING" }
        );
        // console.log(
        //   "check_history_crypto",
        //   "--------------->>",
        //   check_history_crypto
        // );
        // return true
        // 23D7A17877BE7DE3

        // If no existing transaction with the same refno
        if (check_history_crypto) {
          // Find the coin object in the user's balances array based on coinName
          const user_balance = user.balances.find(c => c.coinName.toLowerCase() === data.coin.toLowerCase());

          if (user_balance) {
          let fee = parseFloat(data.fee);
          let amount_to_add = parseFloat(data.amount) - fee;
          const updatedBalance = parseFloat(user_balance.balance) + amount_to_add;

          console.log("Current balance:", user_balance.balance);
          console.log("Amount to add:", amount_to_add);
          console.log("Updated balance:", updatedBalance);

          // Build the update query to update the specific balance in the balances array
          const filter = {
              userId: user.userId,
              "balances.coinName": data.coin
          };

          const update = {
              $set: {
                  "balances.$.balance": updatedBalance // Update balance for the matched coin
              }
          };
        
          // Perform the update
          const updated_user = await mongoFunctions.findOneAndUpdate(
              "User",
              filter,
              update,
              { new: true }
          );

          await redis.hSet(
            "cpg_users",
            user.email,
            JSON.stringify(updated_user)
          ); // update in redis
        }
          const updated_user = await mongoFunctions.findOneAndUpdate(
            "Transaction",
            { tId: data.txd },
            {
              $set: {
                status: "SUCCESS",
                "others.hash": data.hash,
                "others.settlement": false,
                "others.tax_amount": data.amount,
              },
              new: true,
            }
          );





          // Send alert to developers
          telegram.alertDev(
            `✅ New Deposit Received ✅
                            Username: ${updated_user.userName}
                            Amount: ${updated_user.amount}
                            Coin: ${data.coin}
                            Chain: ${data.chain}
                            Fee: ${data.fee}`
          );
          return true;

          // } else {
          //     console.log(`Coin ${data.coin} not found in user's balances.`);
          //     return false;
          // }
        } else {
          console.log("Transaction already exists with refno:", data.txd);
          return false; // Transaction already exists, no need to proceed further
        }
      } else {
        console.log("User not found");
        return false; // User not found
      }
    } catch (err) {
      console.error("Error in deposit process:", err);
      telegram.alertDev(
        `❌❌ Error in project X deposit process --> ${err} ❌❌`
      );
      return false; // Return false on error
    }
  },

  admin_crypto_withdrawal_approve: async (job) => {
    try {
      console.log(
        job.data,
        " admin crypto withdrawal approve job data----------------->"
      );
      const { tId, userId, status, hash } = job.data;
      console.log(
        tId,
        userId,
        status,
        hash,
        " admin crypto withdrawal approve job data----------------->"
      );
      // get transaction
      const transaction = await mongoFunctions.findOne("Transaction", {
        tId,
        userId,
        status: "PENDING",
      });
      if (transaction) {
        // get user
        const user = await mongoFunctions.findOne("User", {
          userId,
          status: "ACTIVE",
          withdrawStatus: "ENABLE",
        });
        // log("User fetched:", user);
        if (user) {
          // get admin controls
          const adminControls = await redis.hGet(
            "cpg_admin",
            "controls",
            "AdminControls",
            {}
          );
          if (adminControls && adminControls.withdraw === "ENABLE") {
            // get current coin controls
            const allCoins = adminControls.coins;
            const currentCoin = allCoins.filter(
              (coin) => coin.coinId === transaction.coinId
            )[0];
            if (
              currentCoin &&
              currentCoin.withdraw?.withdrawStatus === "ENABLE"
            ) {
              if (status !== "SUCCESS") {
                const precision =
                  transaction.coinName.toLowerCase() === "bitcoin"
                    ? 8
                    : transaction.coinName === "ethereum"
                    ? 18
                    : 2;
                console.log(
                  transaction.amount,
                  " amount-------------------------------->"
                );
                console.log(
                  transaction.fee,
                  " fee-------------------------------->"
                );
                // create amounts
                const amountToBeTransfer =
                  parseFloat(
                    controllers.getExactLength(transaction.amount, precision)
                  ) +
                  parseFloat(
                    controllers.getExactLength(transaction.fee, precision)
                  );
                let newbal = controllers.getExactLength(
                  amountToBeTransfer,
                  precision
                );
                console.log(newbal, "amountToBeTransfer------->");
                // const requestedAmount = Number(transaction.amount);

                // Get current balance (string → number)
                const balanceObject = user.balances.find(
                  (b) => b.coinId === transaction.coinId
                );

                const currentBalance = controllers.getExactLength(
                  parseFloat(balanceObject.balance),
                  precision
                );
                console.log(currentBalance, " currentBalance----------->");

                const newBalance =
                  parseFloat(currentBalance) + parseFloat(newbal);
                let finalAmount = controllers.getExactLength(
                  newBalance,
                  precision
                );
                // Calculate new balance
                // const newBalance = parseFloat((controllers.getExactLength(currentBalance,precision)) + parseFloat(controllers.getExactLength(amountToBeTransfer,precision))).toString();
                console.log("newbalance----------->", finalAmount);
                // return true

                // Build update
                const filter = {
                  userId: user.userId,
                  "balances.coinId": transaction.coinId,
                };

                const update = {
                  $set: {
                    "balances.$.balance": finalAmount,
                  },
                };

                const updatedUser = await mongoFunctions.findOneAndUpdate(
                  "User",
                  filter,
                  update,
                  { new: true }
                );

                await redis.hSet(
                  "cpg_users",
                  user.email,
                  JSON.stringify(updatedUser)
                ); // update in redis
              }
              // transaction success
              const finalTransaction = await mongoFunctions.findOneAndUpdate(
                "Transaction",
                { tId: transaction.tId },
                { status: status, others: { hash: hash } },
                { new: true }
              );

              // alert dev
              telegram.alertDev(`✅ Transaction ${status} ✅ %0A
                                tId --> ${finalTransaction.tId} %0A
                                type --> ${finalTransaction.type} ${
                finalTransaction.type === "CREDIT" ? "💵" : "💸"
              } %0A
                                from --> ${user.email} %0A
                                coin --> ${finalTransaction.coinName} %0A
                                amount --> ${finalTransaction.amount} %0A
                                address --> ${finalTransaction.address} %0A
                                fee --> ${finalTransaction.fee} %0A
                                status --> ${finalTransaction.status} %0A
                                comment --> ${finalTransaction.comment}`);
            } else {
              // transaction failed
              await mongoFunctions.findOneAndUpdate(
                "Transaction",
                { tId: transaction.tId },
                { status: "FAILED" }
              );

              // alert dev
              telegram.alertDev(`❌ Transaction failed ❌ %0A
                                ❗ Withdraw status of ${
                                  currentCoin.coinName
                                } disabled in admin controls❗ %0A
                                tId --> ${transaction.tId} %0A
                                type --> ${transaction.type} ${
                transaction.type === "CREDIT" ? "💵" : "💸"
              } %0A
                                from --> ${user.email} %0A
                                coin --> ${transaction.coinName} %0A
                                address --> ${transaction.address}`);
            }
          } else {
            // transaction failed
            await mongoFunctions.findOneAndUpdate(
              "Transaction",
              { tId: transaction.tId },
              { status: "FAILED" }
            );

            // alert dev
            telegram.alertDev(`❌ Transaction failed ❌ %0A
                            ❗ Withdraw status disabled in admin controls ❗ %0A
                            tId --> ${transaction.tId} %0A
                            type --> ${transaction.type} ${
              transaction.type === "CREDIT" ? "💵" : "💸"
            } %0A
                            from --> ${user.email} %0A
                            coin --> ${transaction.coinName} %0A
                            address --> ${transaction.address}`);
          }
        } else {
          // transaction failed
          await mongoFunctions.findOneAndUpdate(
            "Transaction",
            { tId: transaction.tId },
            { status: "FAILED" }
          );

          // alert dev
          telegram.alertDev(`❌ Transaction failed ❌ %0A
                        ❗ User not found ❗ %0A
                        tId --> ${transaction.tId} %0A
                        userId --> ${userId} %0A
                        type --> ${transaction.type} ${
            transaction.type === "CREDIT" ? "💵" : "💸"
          } %0A
                        coin --> ${transaction.coinName} %0A
                        address --> ${transaction.address}`);
        }
      } else {
        // alert dev
        telegram.alertDev(`❌ Transaction failed ❌ %0A
                    ❗ Transaction not found ❗ %0A
                    tId --> ${tId} %0A
                    userId --> ${userId}`);
      }
    } catch (err) {
      telegram.alertDev(
        `Error in admin crypto withdrawal approve job --> ❌❌❌❌❌❌ \n ${err.stack} \n ❌❌❌❌❌❌`
      );
    }
  },

  cryptoo_settlement: async (job) => {
    log("Deposit settlement job data:", job.data);
    const { tid, userId, amount, fee, coin, chain, hash, txd } = job.data;

    try {
      // Step 1: Fetch the active user based on userId
      const user = await mongoFunctions.findOne("User", {
        userId: userId,
        status: "ACTIVE",
      });

      if (!user) {
        console.log(`User with userId ${userId} not found or not active.`);
        // return false;
      }

      // Step 2: Fetch the transaction based on tId and userId with SUCCESS status
      const transaction = await mongoFunctions.findOne("Transaction", {
        tId: tid,
        userId: userId,
        status: "SUCCESS",
      });

      if (!transaction) {
        console.log(
          `Transaction with tId ${tid} for userId ${userId} not found or not successful.`
        );
        return false;
      }

      // Step 3: Find the coin object in the user's balances array based on coinName
      const user_balance = user.balances.find(
        (c) => c.coinName.toLowerCase() === coin.toLowerCase()
      );
      console.log("User balance object:", user_balance);
      // return false

      if (!user_balance) {
        console.log(`Coin ${coin} not found in user's balance.`);
        return false;
      }

      // Step 4: Calculate the amount to add after deducting the fee
      const precesion =
        coin.toLowerCase() === "bitcoin"
          ? 8
          : coin.toLowerCase() === "ethereum"
          ? 18
          : 2;

      const parsedFee = parseFloat(getExactLength(fee, precesion));
      log("Parsed fee:", parsedFee);

      const parsedAmount = parseFloat(getExactLength(amount, precesion));
      console.log(
        "parsed Amount--------------------------------->",
        parsedAmount
      );

      const amountToAdd = parsedAmount - parsedFee;

      // Update the user's balance by adding the amount
      const updatedBalanceRaw = parseFloat(user_balance.balance) + amountToAdd;

      // Format final balance with exact decimals (NO EXTRA ADDING)
      const updatedBalance = updatedBalanceRaw.toFixed(precesion);

      console.log("Current balance:", user_balance.balance);
      console.log("Amount to add:", amountToAdd.toFixed(precesion));
      console.log("Updated balance:", updatedBalance);

      // Step 5: Update the user's balance in the database
      const filter = {
        userId: user.userId,
        "balances.coinName": coin,
      };

      const update = {
        $set: {
          "balances.$.balance": updatedBalance,
        },
      };
      // return true
      const updatedUser = await mongoFunctions.findOneAndUpdate(
        "User",
        filter,
        update,
        { new: true }
      );

      if (!updatedUser) {
        console.log(`Failed to update user balance for userId ${userId}.`);
        return false;
      }

      // const transactionUpdate = {
      //     $set: {
      //         // status: "SUCCESS",
      //         // "others.hash": hash,
      //         "others.settlemrnt": true
      //     }
      // };

      const updatedTransaction = await mongoFunctions.findOneAndUpdate(
        "Transaction",
        { tId: tid },
        { $set: { "others.settlement": true } },
        { new: true }
      );

      await saveStats("deposits", parsedFee, coin);

      if (!updatedTransaction) {
        console.log(`Failed to update transaction status for tId ${txd}.`);
        return false;
      }

      // Step 7: Send an alert to developers (optional)
      telegram.alertDev(
        `✅ New Deposit Settled ✅
                Username: ${updatedUser.userName}
                Coin: ${coin}
                Chain: ${chain}
                Fee: ${parsedFee}`
      );

      console.log("Deposit processed successfully.");
      return true;
    } catch (error) {
      console.error("Error processing deposit settlement:", error);
      return false;
    }
  },
};
