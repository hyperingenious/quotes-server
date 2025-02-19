const { DATABASE_ID, CHUNKS_COLLECTION_ID, databases, CONTENT_DELETION_COLLECTION_ID, BOOKS_COLLECTION_ID, BLOGS_COLLECTION_ID, SUBSCRIPTIONS_COLLECTION_ID, INITIATED_TRANSACTIONS_COLLECTION_ID, FREE_CONTENT_GENERATION_ENTRIES } = require("../appwrite");
const sdk = require("node-appwrite");
const { verify_token } = require("../verify/verify_appwrite");

async function get_free_content_count({ type, user_id }) {
    try {
        const { total } = await databases.listDocuments(
            DATABASE_ID,
            FREE_CONTENT_GENERATION_ENTRIES,
            [sdk.Query.select(['$id']), sdk.Query.equal('user_id', user_id), sdk.Query.equal('type', type), sdk.Query.limit(298938)]
        );
        return total;
    } catch (error) {
        throw error;
    }
}

async function get_chunk_by_id(chunk_id) {
    console.log(`Getting chunk by ID: ${chunk_id}`);
    try {
        const response = await databases.getDocument(
            DATABASE_ID,
            CHUNKS_COLLECTION_ID,
            chunk_id
        );
        console.log(`Chunk retrieved successfully:`, response.$id);
        return response;
    } catch (error) {
        throw error;
    }
}

async function get_all_chunk_ids_with_book_id(book_id) {
    console.log(`Getting all chunk IDs with book ID: ${book_id}`);
    try {
        const { total, documents } = await databases.listDocuments(
            DATABASE_ID,
            CHUNKS_COLLECTION_ID,
            [sdk.Query.equal("books", book_id), sdk.Query.select(["$id"]), sdk.Query.limit(300)]
        );

        console.log(`Found ${total} chunks.`);

        if (total == 0) return []

        const chunkIds = documents.map((doc) => doc.$id);

        console.log(`Chunk IDs: ${chunkIds}`);

        return chunkIds;
    } catch (error) {
        throw error;
    }
}


async function get_book_document_by_id({ bookId, user_id }) {
    console.log(`Getting book document by ID: ${bookId}`);
    try {
        const doc = await databases.getDocument(
            DATABASE_ID,
            BOOKS_COLLECTION_ID,
            bookId
        );
        console.log("Book document retrieved successfully:", doc);
        return doc;
    } catch (error) {
        throw error;
    }
}


async function get_all_books({ token }) {
    console.log(`Getting all books for token: ${token}`);
    try {
        const { isTokenValid, related_data: [related_data] } = await verify_token({ token })

        if (!isTokenValid) {
            throw Error({ message: "Invalid Token" })
        }
        const { documents } = await databases.listDocuments(DATABASE_ID, BOOKS_COLLECTION_ID, [sdk.Query.equal("user_id", [related_data.user_id]),])

        console.log("Books retrieved successfully:");
        return documents
    } catch (error) {
        throw error
    }
}

async function get_all_deletion_entries() {
    console.log("Getting all deletion entries");
    try {
        const { documents } = await databases.listDocuments(
            DATABASE_ID,
            CONTENT_DELETION_COLLECTION_ID,
            [sdk.Query.limit(1000000)]
        );
        console.log("Deletion entries retrieved successfully:", documents);
        return documents;
    } catch (error) {
        throw error;
    }
}

async function get_all_blog_ids_match_book_id(bookId) {
    console.log(`Getting all blog IDs matching book ID: ${bookId}`);
    try {
        const { total, documents } = await databases.listDocuments(
            DATABASE_ID,
            BLOGS_COLLECTION_ID,
            [sdk.Query.equal("books", [bookId]), sdk.Query.limit(300)]
        );

        console.log(`Found ${total} blogs.`);

        if (total == 0) return [];
        const blogIds = documents.map((ddata) => ddata.$id);
        console.log(`Blog IDs: ${blogIds}`);
        return blogIds;
    } catch (error) {
        throw error;
    }
}

async function get_all_user_subscription({ user_id }) {
    try {
        const { total, documents } = await databases.listDocuments(
            DATABASE_ID, SUBSCRIPTIONS_COLLECTION_ID,
            [sdk.Query.equal('user_id', user_id)]
        )
        return { total, documents }
    } catch (error) {
        console.error(error); throw new Error(error)
    }
}

async function get_all_user_initiated_transations({ user_id }) {
    try {
        const { total, documents } = await databases.listDocuments(
            DATABASE_ID, INITIATED_TRANSACTIONS_COLLECTION_ID,
            [sdk.Query.equal('user_id', user_id)]
        )
        return { total, documents }
    } catch (error) {
        console.error(error); throw new Error(error)
    }
}

/* documentID === plink_id in initiated_transactions collection */
async function get_initiated_transaction_by_plink_id(plink_id) {
    try {
        console.log(plink_id)
        const document = await databases.getDocument(
            DATABASE_ID, INITIATED_TRANSACTIONS_COLLECTION_ID,
            plink_id
        );
        return document;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message === 'document not found') {
            return null; // Return null if document not found
        }
        console.error("Error in get_initiated_transaction_by_plink_id:", error);
        throw new Error(`Failed to get initiated transaction: ${error.message}`); //More informative error message
    }
}
module.exports = {
    get_all_chunk_ids_with_book_id,
    get_chunk_by_id,
    get_book_document_by_id,
    get_all_blog_ids_match_book_id,
    get_all_deletion_entries,
    get_all_books,
    get_all_user_subscription,
    get_initiated_transaction_by_plink_id,
    get_all_user_initiated_transations,
get_free_content_count
}