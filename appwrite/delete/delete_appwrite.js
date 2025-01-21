const { DATABASE_ID, TOKENISATION_COLLECTION_ID, databases, CONTENT_DELETION_COLLECTION_ID } = require("../appwrite");
const sdk = require("node-appwrite");
const { get_all_chunk_ids_with_book_id, get_all_blog_ids_match_book_id } = require("../get/get_appwrite");
const { add_deletion_entry } = require("../add/add_appwrite");
const { verify_token } = require("../verify/verify_appwrite");
const { list_all_book_ids_with_user_id } = require("../list/list_appwrite");


async function delete_chunk_by_id(el) {
    console.log(`Deleting chunk by ID: ${el}`);
    try {
        await databases.deleteDocument(DATABASE_ID, CHUNKS_COLLECTION_ID, el);
        console.log(`Chunk deleted successfully.`);
    } catch (e) {
        throw e;
    }
}
async function delete_blog_by_id(el) {
    console.log(`Deleting blog by ID: ${el}`);
    try {
        await databases.deleteDocument(DATABASE_ID, BLOGS_COLLECTION_ID, el);
        console.log("Blog deleted successfully.");
        return null;
    } catch (e) {
        throw e;
    }
}


async function delete_book_entry_by_id(el) {
    console.log(`Deleting book entry by ID: ${el}`);
    try {
        await databases.deleteDocument(DATABASE_ID, BOOKS_COLLECTION_ID, el);
        console.log("Book entry deleted successfully.");
        return null;
    } catch (error) {
        throw error;
    }
}

async function delete_file_by_id(el) {
    console.log(`Deleting file by ID: ${el}`);
    try {
        await storage.deleteFile(BUCKET_ID, el);
        console.log("File deleted successfully.");
        return null;
    } catch (error) {
        console.error("Error deleting file:", error);
    }
}

async function delet_deletion_entry(id) {
    console.log(`Deleting deletion entry by ID: ${id}`);
    try {
        await databases.deleteDocument(
            DATABASE_ID,
            CONTENT_DELETION_COLLECTION_ID,
            id
        );
        console.log("Deletion entry deleted successfully.");
        return null;
    } catch (error) {
        console.error("Error deleting deletion entry:", error);
    }
}
async function make_all_deletion_entries({ documentId, file_id, }) {
    console.log(`Making all deletion entries for document ID: ${documentId}, file ID: ${file_id}`);
    try {
        const chunk_id_array = await get_all_chunk_ids_with_book_id(documentId)
        const blog_id_array = await get_all_blog_ids_match_book_id(documentId)

        await add_deletion_entry({ file_id, chunk_id_array, blog_id_array })
        console.log("Deletion entries made successfully.");
        return null
    } catch (error) {
        throw error
    }
}

async function delete_book_entry_by_id_and_token({ token, documentId }) {
    console.log(`Deleting book entry by ID: ${documentId} with token: ${token}`);
    try {
        const response = await verify_token({ token })
        if (!response) throw Error("Invalid Token")

        const { pdf_link: file_id } = await databases.getDocument(DATABASE_ID, BOOKS_COLLECTION_ID, documentId,)

        await make_all_deletion_entries({ documentId, file_id })

        await databases.deleteDocument(DATABASE_ID, BOOKS_COLLECTION_ID, documentId);

        console.log("Book entry deleted successfully.");

        return null;

    } catch (error) {
        throw error;
    }
}

async function delete_blog_entry_by_id_and_token({ token, documentId }) {
    console.log(`Deleting blog entry by ID: ${documentId} with token: ${token}`);
    try {
        const response = await verify_token({ token })
        if (!response) throw Error("Invalid Token")
        await databases.deleteDocument(DATABASE_ID, BLOGS_COLLECTION_ID, documentId);
        console.log("Blog entry deleted successfully.");
        return null;
    } catch (error) {
        throw error;
    }
}


async function delete_everything({ token }) {
    console.log(`Deleting everything for token: ${token}`);
    try {
        const response = await verify_token({ token })
        if (!response) throw Error("Invalid Token")
        const documents = await list_all_book_ids_with_user_id(response[0].user_id)

        if (documents && documents.length !== 0) {
            console.log(`Deleting ${documents.length} books.`);
            for (const doc of documents) {
                await delete_book_entry_by_id_and_token({ token, documentId: doc })
            }
            console.log("All entries deleted successfully.");
        } else {
            console.log("No books found to delete.");
        }
    } catch (error) {
        throw error
    }
}


module.exports = {
    delete_chunk_by_id,
    delete_blog_by_id,
    delete_book_entry_by_id,
    delete_file_by_id,
    delet_deletion_entry,
    delete_blog_entry_by_id_and_token,
    delete_everything,
    delete_book_entry_by_id_and_token,
    make_all_deletion_entries
}