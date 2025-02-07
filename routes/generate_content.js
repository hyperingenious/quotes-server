/**
 * Imports necessary modules for retrieving chunk IDs, generating AI content, and file system operations.
 */
const { get_all_chunk_ids_with_book_id } = require("../appwrite/get/get_appwrite");
const { ai_blog_generator } = require("../ai/ai_blog_generator");
const crypto = require("crypto");
const {
  createFileFromRandomChunksGenerateContent,
} = require("../parser/createFileFromRandomChunks");
const { invalidateToken } = require("../helpers/helper");
const fs = require("fs").promises;

/**
 * Asynchronous function to generate content for a given book ID.
 * @param {object} req - The request object containing the book ID in the query parameters.
 * @param {object} res - The response object used to send the API response.
 */
async function generateContent(req, res) {
  console.log(req.query);
  const { id: book_id } = req.query;
  const subscriptionQuota = req.subscriptionQuota;

  /**
   * Verifies the user's token using the invalidateToken helper function to ensure authentication.
   */
  const verifiedToken = await invalidateToken({ req, res });

  /**
   * Checks if a book ID is provided in the request. Returns a 400 error if not.
   */
  if (!book_id) {
    return res.status(400).json({ message: "Book ID is required" });
  }

  console.log(`📥 Received request to generate content for book ID: ${book_id}`);

  /**
   * Responds immediately to prevent Heroku's 30s timeout (H12 error).
   */
  res.status(202).json({ message: "Processing started. Check back later." });

  /**
   * Runs processing in the background without blocking the request.
   */
  (async () => {
    let filePath;
    try {
      /**
       * Retrieves all chunk IDs associated with the specified book ID from the Appwrite database.
       */
      const chunkIds = await get_all_chunk_ids_with_book_id(book_id);

      /**
       * Checks if any chunks were found for the given book ID. If none, logs a message and exits.
       */
      if (chunkIds.length === 0) {
        console.log(`No chunks found for book ID: ${book_id}`);
        return;
      }

      /**
       * Creates a temporary file from the retrieved chunks.
       */
      filePath = await createFileFromRandomChunksGenerateContent(chunkIds);

      /**
       * Generates AI content using the ai_blog_generator function with a unique file name.
       */
      const random_cache_model_name = `${crypto.randomUUID()}`;
      await ai_blog_generator({
        subscriptionQuota,
        filePath,
        displayName: random_cache_model_name,
        bookEntryId: book_id,
        user_id: verifiedToken.sub,
      });

      console.log(`✅ Content generated successfully for book ID: ${book_id}`);
    } catch (error) {
      console.error(`❌ Error processing book ID ${book_id}:`, error);
    } finally {
      // Cleanup: delete the created file if it exists
      if (filePath) {
        try {
          await fs.unlink(filePath);
          console.log(`🗑️ Deleted temporary file: ${filePath}`);
        } catch (cleanupError) {
          console.error(`⚠️ Error deleting file: ${cleanupError.message}`);
        }
      }
    }
  })();
}

/**
 * Exports the generateContent function to be used in other modules.
 */
module.exports = {
  generateContent,
};