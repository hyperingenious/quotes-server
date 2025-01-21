const { get_all_chunk_ids_with_book_id } = require("../appwrite/get/get_appwrite");
const { ai_blog_generator } = require("../ai/ai_blog_generator");
const crypto = require("crypto");
const {
  createFileFromRandomChunksGenerateContent,
} = require("../parser/createFileFromRandomChunks");
const fs = require("fs").promises;

async function generateContent(req, res) {
  console.log(req.query);
  const { id: book_id, user_id } = req.query;

  if (!book_id) {
    return res.status(400).json({ message: "Book ID is required" });
  }

  console.log(`Generating content for book with ID: ${book_id}`);

  let random_file_name; // Declare the file name variable outside of try-catch
  try {
    const chunkIds = await get_all_chunk_ids_with_book_id(book_id);

    if (chunkIds.length === 0) {
      console.log(`No chunks found for book with ID: ${book_id}`);
      return res.status(404).json({ message: "No chunks found for this book" });
    }

    const filePath = await createFileFromRandomChunksGenerateContent(chunkIds);

    const random_cache_model_name = `${crypto.randomUUID()}`;
    await ai_blog_generator({
      filePath,
      displayName: random_cache_model_name,
      bookEntryId: book_id,
      user_id,
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

module.exports = {
  generateContent,
};
