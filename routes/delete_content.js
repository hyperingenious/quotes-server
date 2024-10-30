const {
  delete_chunk_by_id,
  get_book_document_by_id,
  get_all_blog_ids_match_book_id,
  delete_file_by_id,
  delete_book_entry_by_id,
  delete_blog_by_id,
  get_all_chunk_ids_with_book_id,
} = require("../appwrite/appwrite");

function extractFileId(url) {
  const match = url.match(/files\/([^/]+)/);
  return match ? match[1] : null;
}

async function deleteContent(req, res) {
  const id = req.body.id;
  console.log(`Received request to delete content with ID: ${id}`);

  try {
    console.log("Fetching document and associated IDs...");
    const { pdf_link } = await get_book_document_by_id(id);
    console.log(`Fetched document with PDF link: ${pdf_link}`);

    const file_id = extractFileId(pdf_link);
    console.log(`Extracted file ID: ${file_id}`);

    const chunk_ids = await get_all_chunk_ids_with_book_id(id);
    console.log(`Fetched ${chunk_ids?.length} chunk IDs to delete.`);

    const blog_ids = await get_all_blog_ids_match_book_id(id);
    console.log(`Fetched ${blog_ids?.length} blog IDs to delete.`);

    console.log(`Deleting file with ? ${file_id}`);
    await delete_file_by_id(file_id);
    console.log("File deleted successfully.");

    console.log(`Deleting file with ? ${file_id}`);
    await delete_file_by_id(file_id);
    console.log("File deleted successfully.");

    console.log(`Deleting main book entry with ID: ${id}`);
    await delete_book_entry_by_id(id);
    console.log("Main book entry deleted successfully.");

    console.log("Initial deletions complete, sending response.");
    res.status(200).json({
      message: "Initial tasks complete, background deletions initiated",
    });

    // Step 4: Background deletion of chunks and blogs with delay
    console.log("Starting background deletion of chunks and blogs...");

    if (chunk_ids) {
      for (const chunk_id of chunk_ids) {
        console.log(`Deleting chunk with ID: ${chunk_id}`);
        await delete_chunk_by_id(chunk_id);
        console.log(`Chunk with ID: ${chunk_id} deleted.`);
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Delay
      }
    }

    if (blog_ids) {
      for (const blog_id of blog_ids) {
        console.log(`Deleting blog with ID: ${blog_id}`);
        await delete_blog_by_id(blog_id);
        console.log(`Blog with ID: ${blog_id} deleted.`);
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Delay
      }
    }

    console.log("Background deletion of chunks and blogs completed.");
  } catch (error) {
    console.error("Error in deletion process:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = {
  deleteContent,
};
