require("dotenv").config();
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils')

const { INITIATED_TRANSACTIONS_COLLECTION_ID, DATABASE_ID, databases } = require("../../appwrite/appwrite");

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

        await add_subscriptions_entry({ payment_id: paymentEntity.id, user_id: document.user_id, subscription_type: document.subscription_type, start_date: start_date.toISOString(), end_date: end_date.toISOString(), payment_method: paymentEntity.method, amount: paymentEntity.amount, currency: paymentEntity.currency });

        console.log("Subscription entry added successfully.");
        return;  // Return success response
    } catch (error) {
        console.error("Error processing Razorpay webhook:", error);
    }
}
module.exports = {
    razorpayWebhookEndpoint
}