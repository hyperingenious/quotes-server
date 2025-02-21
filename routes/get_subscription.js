require("dotenv").config();
const { databases, DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, SUBSCRIPTION_QUOTA_COLLECTION_ID, FREE_CONTENT_GENERATION_ENTRIES } = require('../appwrite/appwrite');
const sdk = require("node-appwrite");
const { invalidateToken } = require("../helpers/helper");

async function getSubscription(req, res) {
    try {
        const verifiedToken = await invalidateToken({ res, req });

        const { documents } = await databases.listDocuments(DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, [sdk.Query.equal('user_id', verifiedToken.sub)]);

        let subscription = { isActiveSubscription: false };
        const currentDate = Math.floor(new Date().getTime() / 1000);

        for (let i = 0; i < documents.length; ++i) {
            if (documents[i].end_date > currentDate) {
                try {
                    const { documents: [subscriptionQuota] } = await databases.listDocuments(DATABASE_ID, SUBSCRIPTION_QUOTA_COLLECTION_ID, [sdk.Query.equal('subscriptions', documents[i].$id)]);
                    subscription = { ...subscription, ...documents[i], quota: subscriptionQuota, isActiveSubscription: true };
                } catch (quotaError) {
                    console.error("Error fetching subscription quota:", quotaError);
                    return res.status(500).json({ error: "Internal Server Error fetching quota" });
                }
                break; // Exit loop after finding an active subscription
            }
        }

        const { total: freeBlogCount } = await databases.listDocuments(DATABASE_ID, FREE_CONTENT_GENERATION_ENTRIES, [sdk.Query.equal('user_id', verifiedToken.sub), sdk.Query.equal('type', 'blog'), sdk.Query.select(['$id'])]);
        const { total: freeBookCount } = await databases.listDocuments(DATABASE_ID, FREE_CONTENT_GENERATION_ENTRIES, [sdk.Query.equal('user_id', verifiedToken.sub), sdk.Query.equal('type', 'book'), sdk.Query.select(['$id'])]);

        subscription.freeBlogCount = freeBlogCount;
        subscription.freeBookCount = freeBookCount;


        return res.status(200).json(subscription);
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return res.status(500).json({ error: "Internal Server Error fetching subscriptions" });
    }
}
module.exports = { getSubscription }
