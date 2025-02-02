/**
 * @file This file contains the webhook endpoint for Razorpay payment link events.
 * It validates the webhook signature, checks for payment link status, and updates the database accordingly.
 */
require("dotenv").config();
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const { INITIATED_TRANSACTIONS_COLLECTION_ID, DATABASE_ID, databases, SUBSCRIPTIONS_COLLECTION_ID } = require("../../appwrite/appwrite");
const { add_subscription_quota, add_subscriptions_entry } = require("../../appwrite/add/add_appwrite");
const sdk = require("node-appwrite");

/**
 * Processes incoming Razorpay webhook events.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @async
 */
async function razorpayWebhookEndpoint(req, res) {
    try {
        // Retrieve webhook data from request
        const webhookBody = req.body;
        const webhookSignature = req.headers['x-razorpay-signature'];

        // Validate webhook signature using the Razorpay utility function.  The validateWebhookSignature function is assumed to be defined elsewhere and correctly configured.
        const isValid = validateWebhookSignature(JSON.stringify(webhookBody), webhookSignature, process.env.RAZORPAY_WEBHOOK_SECRET);

        // Check if signature is valid and event type is 'payment_link.paid'
        if (!isValid || webhookBody.event !== 'payment_link.paid') {
            console.log("Invalid webhook signature or event type.");
            return res.status(400).json({ error: "Bad Request" });
        }

        // Extract relevant data from the webhook payload
        const paymentLinkEntity = webhookBody.payload.payment_link.entity;
        const paymentEntity = webhookBody.payload.payment.entity;
        const plink_id = paymentLinkEntity.id;
        console.log(`Payment Link ID: ${plink_id}`);

        // Retrieve the initiated transaction document from Appwrite database using the payment link ID.
        const document = await databases.getDocument(
            DATABASE_ID, INITIATED_TRANSACTIONS_COLLECTION_ID,
            plink_id
        );

        // Handle case where initiated transaction is not found
        if (!document) {
            console.log("Initiated transaction not found for payment link ID:", paymentLinkEntity.id);
            return res.status(404).json({ error: "Not Found" });
        }

        // Calculate subscription start and end dates.  Assumes a 30-day subscription.
        const start_date = new Date(paymentEntity.created_at * 1000)
        const end_date = new Date(start_date);
        end_date.setDate(start_date.getDate() + 30);

        // Check for existing subscription using the unique payment ID to prevent duplicates.
        const { total, documents: existingSubscriptions } = await databases.listDocuments(DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, [sdk.Query.equal('payment_id', paymentEntity.id)]);
        if (total > 0 || existingSubscriptions.length > 0) {
            console.log("Existing subscription found for payment ID:", paymentEntity.id);
            return; // Return 200 OK if subscription already exists.
        }

        // Add subscription entry to Appwrite database.
        const added_document = await add_subscriptions_entry({
            payment_id: paymentEntity.id,
            user_id: document.user_id,
            subscription_type: document.subscription_type,
            start_date: Math.floor(start_date.getTime() / 1000),
            end_date: Math.floor(end_date.getTime() / 1000),
            payment_method: paymentEntity.method,
            amount: paymentEntity.amount,
            currency: paymentEntity.currency
        });
        console.log("Subscription entry added successfully.");

        // Add subscription quota entry to Appwrite database.
        await add_subscription_quota({ subscription_id: added_document.$id });
        console.log("Subscription quota entry added successfully");

        // Return success response
        return;
    } catch (error) {
        console.error("Error processing Razorpay webhook:", error);
        return res.status(500).json({ error: "Internal Server Error" }); // Return 500 Internal Server Error on error.
    }
}

/**
 * Exports the Razorpay webhook endpoint function.
 */
module.exports = {
    razorpayWebhookEndpoint
}