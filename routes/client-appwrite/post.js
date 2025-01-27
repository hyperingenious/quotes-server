require("dotenv").config();
const sdk = require("node-appwrite");
const { databases, DATABASE_ID, BLOGS_COLLECTION_ID, PUBLICLY_SHARED_BLOGS_COLLECTION_ID, TOKENISATION_COLLECTION_ID } = require("../../appwrite/appwrite");
const { invalidateToken } = require("../../helpers/helper");

async function clientAppwritePOST(req, res) {
    try {
        /**
       * Verifies the user's token using the invalidateToken helper function to ensure authentication.
       */
        const verifiedToken = await invalidateToken({ req, res });

        const { slug } = req.body;

        switch (slug) {
            case 'POST_SHARE_BLOG_PUBLICLY': {
                const { user_name, blog_markdown, author_name, book_name, book_image, user_avatar, document_id, blog_image } = req.body

                if (!user_name || !blog_markdown || !author_name || !book_name || !book_image || !user_avatar || !document_id || !blog_image) {
                    res.status(400).json({ error: "Bad Request", message: "Any of these fields are missing: user_name, blog_markdown, author_name, book_name, book_image, user_avatar, document_id, blog_image" })
                }

                const response = await databases.createDocument(DATABASE_ID, PUBLICLY_SHARED_BLOGS_COLLECTION_ID, document_id, { user_id: verifiedToken.sub, user_name, blog_markdown, author_name, book_image, book_name, user_avatar, blog_image })

                res.status(200).json({ $id: response.$id })
                break;
            }
            case 'POST_CREATE_TOKEN_ENTRY': {
                const { token_name, access } = req.body;
                if (!token_name || !access) {
                    res.status(400).json({ error: "Bad Request", message: "Any of these fields are missing: token_name or access" })
                }

                const jsonString = JSON.stringify(access);
                const token = crypto.randomUUID();

                const response = await databases.createDocument(DATABASE_ID, TOKENISATION_COLLECTION_ID, sdk.ID.unique(), {
                    user_id: verifiedToken.sub, access: jsonString, token, token_name
                })

                const accessJSON = JSON.parse(response.access)
                const accessArray = Object.entries(accessJSON).flatMap(([category, actions]) => Object.entries(actions).map(([key, value]) => ({ category, access_type: key, value })))

                res.status(200).json({ ...response, access: accessArray })
                break;
            }
            case 'POST_DELETE_TOKEN': {
                const { document_id } = req.body;

                if (!document_id) {
                    res.status(400).json({ error: "Bad Request", message: "document_id is missing in the body" })
                }

                const result = await databases.deleteDocument(
                    DATABASE_ID, TOKENISATION_COLLECTION_ID, document_id
                )

                res.status(200).json(result)
                break;
            }
            case 'POST_MARK_BLOG_READ': {
                const { id } = req.body;
                if (!id) {
                    res.status(400).json({ error: "Bad Request", message: "document_id is missing in the body" })
                }
                await databases.updateDocument(DATABASE_ID, BLOGS_COLLECTION_ID, id, {
                    isRead: true
                })
                res.status(200).json({ res: null })
                break;
            }
            default: {
                res.status(404).json({ error: "Not Found", message: "Route not found" })
            }
        }
        return;
    }
    catch (error) {
        console.error("Error during request:", error);
        res.status(500).json({ error: "Internal Server Error", message: "An unexpected error occurred." });
    }
}

module.exports = { clientAppwritePOST }