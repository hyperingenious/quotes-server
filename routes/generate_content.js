async function generateContent(req, res) {
  const bookId = req.query.id;
  if (!bookId) {
    return res.status(400).json({ message: "Book ID is required" });
  }

  console.log(`Generating content for book with ID: ${bookId}`);

  try {
    const chunkIds = await get_all_chunk_ids_with_book_id(bookId);

    if (chunkIds.length === 0) {
      console.log(`No chunks found for book with ID: ${bookId}`);
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

    const random_file_name = `${crypto.randomUUID()}.txt`;
    await fs.writeFile(random_file_name, random_20_percent_chunk_text);

    const random_cache_model_name = `${crypto.randomUUID()}`;
    const blog_and_quote_chunks = await ai_blog_quote_generator(
      random_file_name,
      random_cache_model_name
    );

    await add_blogs_and_quotes(blog_and_quote_chunks, bookId);

    // Clean up the file
    await fs.unlink(random_file_name);
    console.log(`Content generated successfully for book with ID: ${bookId}`);

    return res.status(200).json({ message: "Content generated successfully" });
  } catch (error) {
    console.error(`Error generating content: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  generateContent,
};
