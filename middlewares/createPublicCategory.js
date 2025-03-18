const { Query, ID } = require("node-appwrite");
const { databases, DATABASE_ID, CATEGORY_COLLECTION_ID } = require("../appwrite/appwrite");

async function createPublicCategory(req, res, next) {
    const verifiedToken = req.verifiedToken;
    try {
        const { total } = await databases.listDocuments(
            DATABASE_ID,
            CATEGORY_COLLECTION_ID,
            [Query.equal('user_id', verifiedToken.sub), Query.equal('category', 'public')]
        )

        if (total === 0) {
            await databases.createDocument(
                DATABASE_ID,
                CATEGORY_COLLECTION_ID, ID.unique(),
                {
                    user_id: verifiedToken.sub,
                    category: 'public'
                }
            )
        }

        next()
    } catch (error) {
        console.error(error);
        res.status(500).json({ error, message: "Internal Server error" })
    }
}

module.exports = createPublicCategory; 
