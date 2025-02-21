const { get_free_content_count } = require("../appwrite/get/get_appwrite");

async function checkBlogCount(req, res, next) {
    try {
        const { subscription } = req
        const { blogCount, remainingQuota, } = req.body

        if (subscription === 'unpaid') {
            const [_freeBlogCount, freeBookCount] = await Promise.all([get_free_content_count({ type: 'blog', user_id: req.verifiedToken.sub }), get_free_content_count({ type: 'book', user_id: req.verifiedToken.sub })])
            if (freeBookCount >= 5) {
                res.status(403).json(({ error: "Forbidden", message: "You ran our of your free limit, get subscription" }))
                return;
            }
        }

        if (subscription === 'reader' && blogCount > remainingQuota + 6) {
            res.status(403).json({ error: "Forbidden", message: "Not enough credits left" })
            return;
        }

        next()
        return;
    } catch (error) {
        console.error(error)
         res.status(500).json({ error: "Internal Server error", message: "Something went wrong from our side" })
    }
}
module.exports = checkBlogCount