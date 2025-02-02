require("dotenv").config();
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils')
const { INITIATED_TRANSACTIONS_COLLECTION_ID, DATABASE_ID, databases } = require("../../appwrite/appwrite");
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const { INITIATED_TRANSACTIONS_COLLECTION_ID, DATABASE_ID, databases, SUBSCRIPTIONS_COLLECTION_ID } = require("../../appwrite/appwrite");
const { add_subscription_quota, add_subscriptions_entry } = require("../../appwrite/add/add_appwrite");
const sdk = require("node-appwrite");

async function razorpayWebhookEndpoint(req, res) {
    try {
        const webhookBody = req.body;
        const webhookSignature = req.headers['x-razorpay-signature'];

        // Validate webhook signature.  The validateWebhookSignature function needs to be defined elsewhere.
        const isValid = validateWebhookSignature(JSON.stringify(webhookBody), webhookSignature, process.env.RAZORPAY_WEBHOOK_SECRET)

        if (!isValid || webhookBody.event !== 'payment_link.paid') {
            console.log("Invalid webhook signature or event type.");
            return res.status(400).json({ error: "Bad Request" });
        }

        const paymentLinkEntity = webhookBody.payload.payment_link.entity;
        const paymentEntity = webhookBody.payload.payment.entity;

        const plink_id = paymentLinkEntity.id
        console.log(plink_id)

        /* documentID === plink_id in initiated_transactions collection */
        const document = await databases.getDocument(
            DATABASE_ID, INITIATED_TRANSACTIONS_COLLECTION_ID,
            plink_id
        );

        if (!document) {
            console.log("Initiated transaction not found for payment link ID:", paymentLinkEntity.id);
            return res.status(404).json({ error: "Not Found" }); // Return 404 if document not found.
        }

        const start_date = new Date(paymentEntity.created_at);
        const end_date = new Date(start_date);
        end_date.setDate(start_date.getDate() + 30);

        const added_document = await add_subscriptions_entry({ payment_id: paymentEntity.id, user_id: document.user_id, subscription_type: document.subscription_type, start_date: start_date.toISOString(), end_date: end_date.toISOString(), payment_method: paymentEntity.method, amount: paymentEntity.amount, currency: paymentEntity.currency });
        // Check for existing subscription using the unique payment ID to prevent duplicates.
        const { total, documents: existingSubscriptions } = await databases.listDocuments(DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, [sdk.Query.equal('payment_id', paymentEntity.id)]);
        if (total > 0 || existingSubscriptions.length > 0) {
            console.log("Existing subscription found for payment ID:", paymentEntity.id);
            return; // Return 200 OK if subscription already exists.
        }
        console.log("Subscription entry added successfully.");

        await add_subscription_quota({ subscription_id: added_document.$id })
        console.log("Subscription quota entry added successfully");

        // Return success response
        return;
    } catch (error) {
        console.error("Error processing Razorpay webhook:", error);
    }
}
module.exports = {
    razorpayWebhookEndpoint
}