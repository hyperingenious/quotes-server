const { get_all_user_subscription, get_all_user_initiated_transations } = require("../../appwrite/get/get_appwrite");
const { create_payment_link } = require("../../razorpay/razorpay");
const { add_initiate_transaction_entry, } = require("../../appwrite/add/add_appwrite");
const { invalidateToken } = require("../../helpers/helper");

async function initiateTransaction(req, res) {
    try {
        const verifiedToken = await invalidateToken({ res, req });
        // const verifiedToken = {
        //     sub: 'user_2oFLUNePrbPyBH1zJL4gV4mn7Kp',
        //     email: 'skbmasale941@gmail.com'
        // }

        const subscription_type = req.body.subscription_type;
        const email = verifiedToken.email; // Get email from verifiedToken

        console.log("Initiate Transaction Request:");

        const { total, documents } = await get_all_user_subscription({ user_id: verifiedToken.sub });
        console.log('total', total)

        if (total > 0 && documents.length > 0) {
            console.log("User has existing subscriptions");
            const hasActiveSubscription = documents.some(subscri => {

                const endDate = subscri.end_date
                const comparison = endDate > Math.floor(new Date().getTime() / 1000)
                console.log(comparison)
                return comparison;
            });
            if (hasActiveSubscription) {
                console.log("User has an active subscription.");
                return res.status(400).json({ error: "Bad request", message: "You already have an active subscription" });
            }
        } else {
            console.log("User has no existing subscriptions.");
        }

        const { total: total_2, documents: documents_2 } = await get_all_user_initiated_transations({ user_id: verifiedToken.sub }); // Use verifiedToken.sub
        if (total_2 > 0 && documents_2.length > 0) {
            console.log("User has existing initiated transactions");
            for (const doc of documents_2) { // Use for...of loop for better readability
                const today = Math.floor(new Date().getTime() / 1000)
                if (doc.expire_by > today) {
                    return res.status(400).json({ error: "Bad request", message: "You already has an initiated transactions, please try again later" });
                }
            }
        } else {
            console.log("User has no existing initiated transactions.");
        }

        console.log("Creating payment link...");
        const payment_metadata = await create_payment_link({ email, subscription_type });
        console.log("Payment link created successfully");

        console.log("Adding initiate transaction entry...");
        await add_initiate_transaction_entry({
            amount: payment_metadata.amount,
            currency: payment_metadata.currency,
            expire_by: payment_metadata.expire_by,
            user_id: verifiedToken.sub,
            subscription_type, // Assuming subscription_id is not available here.  Add if available.
            plink_id: payment_metadata.id,
        });
        console.log("Initiate transaction entry added successfully.");

        console.log("Returning payment link details.");
        return res.status(200).json({ currency: payment_metadata.currency, payment_link: payment_metadata.short_url, amount: payment_metadata.amount, expire_by: payment_metadata.expire_by });
    } catch (error) {
        console.error("Error in /initiate_transaction:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
module.exports = { initiateTransaction }