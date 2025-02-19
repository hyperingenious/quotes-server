async function invalidateSubscription(req, res) {
    try {
        const { documents } = await databases.listDocuments(DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID, [sdk.Query.equal('user_id', req.verifiedToken.sub)]);

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
                        req.remainingQuota = subscriptionQuota.allocated_blog_quota - subscriptionQuota.blogs_generated
                        req.subscriptionQuota = subscriptionQuota;
                        req.subscription_type = documents[i].subscription_type
                        req.subscription = 'reader'
                        next()
                        return;
                    }
                    /**
                     * If generated blogs exceeded allocated quota.
                     */
                    if (subscriptionQuota.allocated_blog_quota < subscriptionQuota.blogs_generated) {
                        req.subscription = 'unpaid';
                        next()
                        return;
                    }
                } catch (quotaError) {
                    console.error("Error fetching subscription quota:", quotaError);
                    return res.status(500).json({ error: "Internal Server Error fetching quota" });
                }
                break;
            }
        }
        req.subscription = 'unpaid'
        next(); return;
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }

}

module.exports = invalidateSubscription