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
  const subscriptionQuota = req.subscriptionQuota

  /**
  * Verifies the user's token using the invalidateToken helper function to ensure authentication.
  */

  const verifiedToken = await invalidateToken({ req, res });
  // const verifiedToken = {
  //   sub: 'user_2oFLUNePrbPyBH1zJL4gV4mn7Kp',
  //   email: 'skbmasale941@gmail.com'
  // }

  /**
   * Checks if a book ID is provided in the request. Returns a 400 error if not.
   */
  if (!book_id) {
    return res.status(400).json({ message: "Book ID is required" });
  }

  console.log(`Generating content for book with ID: ${book_id}`);

  let random_file_name; // Declare the file name variable outside of try-catch to ensure proper cleanup

  /**
   * Uses a try-catch block to handle potential errors during content generation.
   */
  try {
    /**
     * Retrieves all chunk IDs associated with the specified book ID from the Appwrite database.
     */
    const chunkIds = await get_all_chunk_ids_with_book_id(book_id);

    /**
     * Checks if any chunks were found for the given book ID. Returns a 404 error if no chunks are found.
     */
    if (chunkIds.length === 0) {
      console.log(`No chunks found for book with ID: ${book_id}`);
      return res.status(404).json({ message: "No chunks found for this book" });
    }

    /**
     * Creates a temporary file from the retrieved chunks using createFileFromRandomChunksGenerateContent.
     */
    const filePath = await createFileFromRandomChunksGenerateContent(chunkIds);

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

    console.log(`Content generated successfully for book with ID: ${book_id}`);
    return res.status(200).json({ message: "Content generated successfully" });
  } catch (error) {
    console.error(`Error generating content: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    // Cleanup: delete the created file if it exists
    if (random_file_name) {
      try {
        await fs.unlink(random_file_name);
        console.log(`Deleted temporary file: ${random_file_name}`);
      } catch (cleanupError) {
        console.error(`Error deleting file: ${cleanupError.message}`);
      }
    }
  }
}

/**
 * Exports the generateContent function to be used in other modules.
 */
module.exports = {
  generateContent,
};
