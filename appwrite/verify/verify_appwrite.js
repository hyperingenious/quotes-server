const { DATABASE_ID, TOKENISATION_COLLECTION_ID, databases } = require("../appwrite");
const sdk = require("node-appwrite");

async function verify_token({ token }) {
    console.log(`Verifying token: ${token}`);
    try {
        const { documents } = await databases.listDocuments(DATABASE_ID, TOKENISATION_COLLECTION_ID,
            [sdk.Query.equal("token", token)]
        )
        if (documents.length === 0) {
            console.log("Invalid token.");
            return { isTokenValid: false, related_data: null }
        } else {
            console.log("Token verified successfully.");
            return { isTokenValid: true, related_data: documents }
        }
    } catch (error) {
        throw error
    }
}

module.exports = {
    verify_token
}