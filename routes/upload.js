const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs").promises;
const simpleFs = require("fs");
const path = require("path");
const chunk = require("chunk-text");
const { parsePDF } = require("../parser/pdf_to_text");
const { ai_blog_generator } = require("../ai/ai_blog_generator");

const {
  upload_pdf,
  add_upload_book_entry,
  upload_pdf_chunk,
} = require("../appwrite/appwrite");
const { getTokenCount } = require("../parser/text_to_token_len");
const {
  createFileFromRandomChunks,
} = require("../parser/createFileFromRandomChunks");

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

async function handleUpload(req, res) {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  const {
    authorName: author,
    bookTitle: book_name,
    imageUrl: book_image,
    user_id,
  } = req.body; // Extract additional fields

  const filepath = path.resolve(req.file.path);
  simpleFs.readFileSync(filepath);

  const text = await parsePDF(filepath);
  const tokenCount = await getTokenCount(text);

  console.log(tokenCount);

  if (tokenCount < 50_000) {
    await fs.unlink(filepath);
    return res.status(400).send("Your Book is too small, try a bigger one");
  }

  try {
    const { $id: bookPDFId } = await upload_pdf(filepath);
    const pdf_link = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${bookPDFId}/view?project=${process.env.APPWRITE_PROJECT_ID}&mode=admin`;
    const book_entry_data = {
      user_id,
      author,
      book_image,
      book_name,
      pdf_link,
    };

    // Immediately send the response after uploading PDF and book entry creation
    res.status(200).send(`File uploaded successfully: ${req.file.filename}`);

    // Defer the remaining operations, allowing them to execute after response is sent
    setImmediate(async () => {
      try {
        /**
         * Adding boodk entry in the DB
         */
        const { $id: bookEntryId } = await add_upload_book_entry(
          book_entry_data
        );

        /**
         * Chunking the text
         */
        const chunked_text = chunk(text, 10000);
        const filePath = await createFileFromRandomChunks(chunked_text);
        console.log("File written successfully");

        /**
         * Content generation started
         */
        const random_cache_model_name = `${crypto.randomUUID()}`;
        await ai_blog_generator({
          filePath,
          displayName: random_cache_model_name,
          bookEntryId,
          user_id,
        });

        await fs.unlink(filepath);
        console.log(`Successfully deleted the file: ${filepath}`);

        /**
         * Uploading of the chunks starts
         */
        for (const chunk of chunked_text) {
          const chunk_data = {
            chunk_text: chunk,
            books: bookEntryId,
          };
          await upload_pdf_chunk(chunk_data);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        console.log("All the chunks successfully has been uploaded");
      } catch (error) {
        console.error("Error in deferred execution:", error);
      }
    });
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
}

const upload_pdf_route = [upload.single("pdf"), handleUpload];

module.exports = {
  upload_pdf_route,
};
