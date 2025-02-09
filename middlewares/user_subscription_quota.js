require("dotenv").config();
const { invalidateToken } = require("../helpers/helper");
const { databases, DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, SUBSCRIPTION_QUOTA_COLLECTION_ID } = require('../appwrite/appwrite');
const sdk = require("node-appwrite");

async function userSubscriptionQuota(req, res, next) {
    try {
        /**
          * Verifies the user's token using the invalidateToken helper function.
          */
        const verifiedToken = await invalidateToken({ req, res });

        const { documents } = await databases.listDocuments(DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, [sdk.Query.equal('user_id', verifiedToken.sub)]);

        const currentDate = Math.floor(new Date().getTime() / 1000);

        /**
         * Checking if the subscription's ending date is not ended 
         */
        for (let i = 0; i < documents.length; ++i) {
            /**
             * if ending date is not ended 
             */
            if (documents[i].end_date > currentDate) {
                try {
                    /**
                     * Getting the usage quota for the subscription
                     */
                    const { documents: [subscriptionQuota] } = await databases.listDocuments(DATABASE_ID, SUBSCRIPTION_QUOTA_COLLECTION_ID, [sdk.Query.equal('subscriptions', documents[i].$id)]);

                    /**
                     * If generated blogs doesn't exceeds allocated quota, executes further
                     */
                    if (subscriptionQuota.allocated_blog_quota > subscriptionQuota.blogs_generated) {
                        req.subscriptionQuota = subscriptionQuota;
                        const subscription_type = documents[i].subscription_type;
                        const fileSize = req.file.size;
                        if (subscription_type == 'reader') {
                            if (fileSize > 1050000) {
                                return res.status(400).json({ error: "Bad Request", message: "File exceeded 10Mb try smaller" })
                            }
                        }
                        if (subscription_type == 'avid_reader') {
                            if (fileSize > 21000000) {
                                return res.status(400).json({ error: "Bad Request", message: "File exceeded 20Mb try smaller" })
                            }
                        }
                        next()
                        return;
                    }
                    /**
                     * If generated blogs exceeded allocated quota.
                     */
                    if (subscriptionQuota.allocated_blog_quota < subscriptionQuota.blogs_generated) {
                        return res.status(403).json({ message: "You ran our of your monthly subscription limit" })
                    }
                } catch (quotaError) {
                    console.error("Error fetching subscription quota:", quotaError);
                    return res.status(500).json({ error: "Internal Server Error fetching quota" });
                }
                break;
            }
        }

        return res.status(404).json({ error: "Not Found", message: "Subscription Not found" })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
module.exports = {
    userSubscriptionQuota
}
