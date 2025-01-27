const sdk = require("node-appwrite");

const APPWRITE_CLOUD_URL = process.env.APPWRITE_CLOUD_URL;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_APP_KEY = process.env.APPWRITE_APP_KEY;
const TOKENISATION_COLLECTION_ID = process.env.TOKENISATION_COLLECTION_ID

const client = new sdk.Client()
    .setEndpoint(APPWRITE_CLOUD_URL)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_APP_KEY);

const databases = new sdk.Databases(client);

//  Constants
const DATABASE_ID = process.env.DATABASE_ID;
const BLOGS_COLLECTION_ID = process.env.BLOGS_COLLECTION_ID;
process.env.CONTENT_DELETION_COLLECTION_ID;

async function update_blog_content_specifics({ token, documentId, updateObject }) {
    console.log(`Updating blog content specifics for document ID: ${documentId} with token: ${token}`);
    console.log("Update object:", updateObject);
    try {
        const response = await verify_token({ token })
        if (!response) throw Error("Invalid Token")

        const documentData = await databases.getDocument(
            DATABASE_ID,
            BLOGS_COLLECTION_ID,
            documentId
        );

        const updatedData = {
            blog_markdown: documentData.blog_markdown,
            user_id: documentData.user_id, blog_image: documentData.blog_image, isRead: documentData.isRead, books: documentData.books.$id, ...updateObject
        }

        await databases.updateDocument(
            DATABASE_ID,
            BLOGS_COLLECTION_ID,
            documentId,
            updatedData
        );
        console.log("Blog content updated successfully.");
        return null
    } catch (error) {
        throw error
    }
}
async function verify_token({ token }) {
    console.log(`Verifying token: ${token}`);
    try {
        const { documents } = await databases.listDocuments(DATABASE_ID, TOKENISATION_COLLECTION_ID,
            [sdk.Query.equal("token", token)]
        )
        if (documents.length === 0) {
            console.log("Invalid token.");
            return false
        } else {
            console.log("Token verified successfully.");
            return documents
        }
    } catch (error) {
        throw error
    }
}

async function DataUpdate(req, res) {
    const token = req.body.token;
    const updateData = req.body.updateData;

    // Validate request body
    if (!token || !updateData) {
        return res.status(400).json({ error: "Missing required fields: 'token' or 'updateData'" });
    }

    if (!updateData.blogid || !updateData.updateObject) {
        return res.status(400).json({ error: "Missing 'blogid' or 'updateObject' in 'updateData'" });
    }

    try {
        // Validate token
        const isTokenValid = await verify_token({ token });
        if (!isTokenValid) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        // Perform update
        await update_blog_content_specifics({
            token,
            documentId: updateData.blogid,
            updateObject: updateData.updateObject,
        });

        // Send success response
        return res.status(200).json({
            message: `Blog updated successfully.`
        });

    } catch (err) {
        // Log and send error response
        console.error("Error during blog update:", err);
        return res.status(500).json({
            error: "An error occurred during data update",
            details: err.message
        });
    }
}

module.exports = { DataUpdate };