const {
  get_all_chunk_ids_with_book_id,
  get_chunk_by_id,
  add_blogs,
} = require("../appwrite/appwrite");
const { ai_blog_generator } = require("../ai/ai_blog_generator");
const { random_chunk } = require("../parser/chunk_random");
const crypto = require("crypto");
const fs = require("fs").promises;

async function generateContent(req, res) {
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

    const random_20_percent_chunkids = random_chunk(chunkIds);
    let random_20_percent_chunk_text = ``;
    const divider = "========================================================";

    for (const chunkId of random_20_percent_chunkids) {
      try {
        const chunk = await get_chunk_by_id(chunkId);
        random_20_percent_chunk_text += `${divider}\n${chunk.chunk_text}\n`;
      } catch (error) {
        console.error(
          `Error retrieving chunk with ID ${chunkId}: ${error.message}`
        );
      }
    }

    random_file_name = `${crypto.randomUUID()}.txt`; // Assign the file name
    await fs.writeFile(random_file_name, random_20_percent_chunk_text);

    const random_cache_model_name = `${crypto.randomUUID()}`;
    const blog_and_quote_chunks = await ai_blog_generator(
      random_file_name,
      random_cache_model_name
    );

    await add_blogs(blog_and_quote_chunks, book_id, user_id);

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
