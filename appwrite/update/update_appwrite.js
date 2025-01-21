const { verify_token } = require("../verify/verify_appwrite");

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

        const updatedData = { ...documentData, books: documentData.books, ...updateObject }
        console.log(updatedData)

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

module.exports = {
    update_blog_content_specifics,
}
