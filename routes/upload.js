const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
const chunk = require("chunk-text");
const { ai_blog_generator } = require("../ai/ai_blog_generator");

/**
 * Imports functions for uploading files to Appwrite.
 */
const {
  upload_pdf,
  upload_pdf_chunk,
} = require("../appwrite/upload/upload_appwrite");

/**
 * Imports function for adding book entries to the database.
 */
const {
  add_upload_book_entry,
} = require("../appwrite/add/add_appwrite");

/**
 * Imports functions for token counting and file creation.
 */
const { getTokenCount } = require("../parser/text_to_token_len");
const {
  createFileFromRandomChunks,
} = require("../parser/createFileFromRandomChunks");
const { invalidateToken } = require("../helpers/helper");
const parse = require("./upload/parse");

/**
 * Multer storage engine configuration for storing uploaded files.
 */
const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

/**
 * Multer instance with the configured storage engine.
 */
const upload = multer({ storage: storage });

/**
 * Asynchronous function to handle file uploads, processing, and AI generation.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 */
async function handleUpload(req, res) {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const filepath = path.resolve(req.file.path);
    const fileSize = req.file.size;
    const mimetype = req.body.mimetype;
    const subscriptionType = req.subscription_type;

    //Check file size based on subscription
    const maxSize = subscriptionType === 'reader' ? 1050000 : (subscriptionType === 'avid_reader' ? 21000000 : 0); //Default to 0 for unsupported plans.
    if (maxSize > 0 && fileSize > maxSize) {
      await fs.unlink(filepath);
      return res.status(400).json({ error: "Bad Request", message: `File exceeded ${maxSize / 1000000}Mb try smaller` });
    }

    //Check plan for allowed mimetypes
    if (mimetype !== 'application/pdf' && !['reader', 'avid_reader'].includes(subscriptionType)) {
      await fs.unlink(filepath);
      return res.status(403).json({ error: 'Forbidden', message: "File type not allowed in your plan" });
    }

    const verifiedToken = await invalidateToken({ req, res });
    const { authorName: author, bookTitle: book_name, imageUrl: book_image } = req.body;

    const text = await parse({ mimetype, filepath });
    const tokenCount = await getTokenCount(text);


    if (tokenCount < 50000) {
      await fs.unlink(filepath);
      return res.status(400).send("Your Book is too small, try a bigger one");
    }

    const { $id: bookPDFId } = await upload_pdf(filepath);
    const pdf_link = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${bookPDFId}/view?project=${process.env.APPWRITE_PROJECT_ID}&mode=admin`;
    const bookEntryData = { user_id: verifiedToken.sub, author, book_image, book_name, pdf_link };

    const { $id: bookEntryId } = await add_upload_book_entry(bookEntryData);
    res.status(200).json({ message: `File uploaded successfully: ${req.file.filename}` });

    const chunkedText = chunk(text, 10000);
    const filePath = await createFileFromRandomChunks(chunkedText);

    const randomCacheModelName = `${crypto.randomUUID()}`;
    await ai_blog_generator({ subscriptionQuota: req.subscriptionQuota, filePath, displayName: randomCacheModelName, bookEntryId, user_id: verifiedToken.sub });

    await fs.unlink(filepath); //Remove original file.
    await fs.unlink(filePath); //Remove temporary file.

    for (const chunk of chunkedText) {
      const chunkData = { chunk_text: chunk, books: bookEntryId };
      await upload_pdf_chunk(chunkData);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    console.log("All the chunks successfully has been uploaded");
  } catch (error) {
    console.error("Error in handleUpload:", error); //Added more robust error handling.
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Defines the upload route using multer.single to handle single file uploads.
 */
const upload_pdf_route = [upload.single("pdf"), handleUpload];

/**
 * Exports the upload route.
 */
module.exports = {
  upload_pdf_route,
};