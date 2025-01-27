/**
 * Imports necessary functions for retrieving book documents, blog IDs, and chunk IDs from the Appwrite database.
 */
const {
  get_book_document_by_id,
  get_all_blog_ids_match_book_id,
  get_all_chunk_ids_with_book_id,
} = require("../appwrite/get/get_appwrite");

/**
 * Imports the function for deleting a book entry from the Appwrite database.
 */
const {
  delete_book_entry_by_id,
} = require("../appwrite/delete/delete_appwrite");

/**
 * Imports the function for adding a deletion entry to the Appwrite database.
 */
const {
  add_deletion_entry,
} = require("../appwrite/add/add_appwrite");

/**
 * Imports the function for invalidating and verifying user tokens.
 */
const { invalidateToken } = require("../helpers/helper");

/**
 * Extracts the file ID from a given URL.
 * @param {string} url - The URL containing the file ID.
 * @returns {string|null} The extracted file ID, or null if not found.
 */
function extractFileId(url) {
  const match = url.match(/files\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Asynchronous function to handle content deletion requests.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
async function deleteContent(req, res) {
  try {
    /**
     * Verifies the user's token using the invalidateToken helper function.
     */
    const verifiedToken = await invalidateToken({ req, res });
    console.log("Fetching document and associated IDs...");

    /**
     * Retriving teh bookId
     */
    const bookId = req.body.bookId;
    if (!bookId) {
      res.status(400).json({ error: "Bad Request", message: "bookId not found" })
    }

    /**
     * Retrieves the book document using the user's ID.
     */
    const { pdf_link } = await get_book_document_by_id({ user_id: verifiedToken.sub, bookId });
    console.log(`Fetched document with PDF link: ${pdf_link}`);

    /**
     * Extracts the file ID from the PDF link.
     */
    const file_id = extractFileId(pdf_link);
    console.log(`Extracted file ID: ${file_id}`);

    /**
     * Retrieves all chunk IDs associated with the user's book.
     */
    const chunk_ids = await get_all_chunk_ids_with_book_id(bookId);
    console.log(`Fetched ${chunk_ids?.length} chunk IDs to delete.`);

    /**
     * Retrieves all blog IDs associated with the user's book.
     */
    const blog_ids = await get_all_blog_ids_match_book_id(bookId);
    console.log(`Fetched ${blog_ids?.length} blog IDs to delete.`);

    console.log(`Deleting main book entry with ID: ${verifiedToken.sub}`);
    /**
     * Deletes the main book entry from the database.
     */
    await delete_book_entry_by_id({ bookId });
    console.log("Main book entry deleted successfully.");

    console.log("Deletion entry initiated");
    /**
     * Adds an entry to the deletion log, recording the IDs of the deleted files, chunks, and blogs.
     */
    await add_deletion_entry({
      file_id,
      chunk_id_array: chunk_ids,
      blog_id_array: blog_ids,
    });

    console.log("Initial deletions complete, sending response.");
    /**
     * Sends a success response to the client, indicating that the initial deletion tasks are complete.
     */
    res.status(200).json({
      message: "Initial tasks complete, background deletions initiated",
    });
  } catch (error) {
    console.error("Error in deletion process:", error);
    /**
     * Handles errors that occur during the deletion process. Sends a 500 error response if the response hasn't already been sent.
     */
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}

/**
 * Exports the deleteContent function.
 */
module.exports = {
  deleteContent,
};
