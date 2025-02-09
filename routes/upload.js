/**
 * Imports necessary modules for file upload, processing, and AI generation.
 */
const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs").promises;
const simpleFs = require("fs");
const path = require("path");
const chunk = require("chunk-text");
const { parsePDF } = require("../parser/pdf_to_text");
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
const { userSubscriptionQuota } = require("../middlewares/user_subscription_quota");

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
    /**
     * Checks if a file was uploaded.
     */
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    /**
     * This section checks the file size against the user's subscription type.
     * Different subscription types have different upload limits.
     * 
     * - `reader`: Files larger than 10MB (1050000 bytes) are rejected.  This limit is enforced to prevent users on the basic plan from uploading excessively large files, which could impact system resources or processing times.
     * - `avid_reader`: Files larger than 20MB (21000000 bytes) are rejected. This higher limit caters to users with a more premium subscription, allowing them to upload larger files.
     * 
     * If the file size exceeds the limit for the user's subscription, a 400 Bad Request response is returned with an appropriate error message, instructing the user to try a smaller file.  The error message is designed to be user-friendly and informative.
     */
    const subscription_type = req.subscription_type;
    const fileSize = req.file.size
    if (subscription_type == 'reader') {
      if (fileSize > 1050000) {
        return res.status(400).json({ error: "Bad Request", message: "File exceeded 10Mb try smaller" })
      }
    }
    if (subscription_type == 'avid_reader') {
      if (fileSize > 21000000) {
        return res.status(400).json({ error: "Bad Request", message: "File exceeded 20Mb try smaller" })
      }
    }

    /**
      * Verifies the token using the invalidateToken helper function.
      */
    const verifiedToken = await invalidateToken({ req, res })

    /**
     * Extracts book details from the request body.
     */
    const {
      authorName: author,
      bookTitle: book_name,
      imageUrl: book_image,
    } = req.body; // Extract additional fields
    const subscriptionQuota = req.subscriptionQuota

    /**
     * Resolves the file path.
     */
    const filepath = path.resolve(req.file.path);
    /**
     * Synchronously reads the file to ensure it exists.
     */
    simpleFs.readFileSync(filepath);

    /**
     * Parses the PDF file to extract text content.
     */
    const text = await parsePDF(filepath);
    /**
     * Gets the token count of the extracted text.
     */
    const tokenCount = await getTokenCount(text);

    /**
     * Logs the token count to the console.
     */
    console.log(tokenCount);

    /**
     * Checks if the token count is sufficient.
     */
    if (tokenCount < 50_000) {
      /**
       * Deletes the file if the token count is insufficient.
       */
      await fs.unlink(filepath);
      return res.status(400).send("Your Book is too small, try a bigger one");
    }

    /**
     * Uploads the PDF file to Appwrite and gets the file ID.
     */
    const { $id: bookPDFId } = await upload_pdf(filepath);
    /**
     * Constructs the PDF link using the file ID.
     */
    const pdf_link = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${bookPDFId}/view?project=${process.env.APPWRITE_PROJECT_ID}&mode=admin`;

    /**
     * Prepares the data for adding a book entry to the database.
     */
    const book_entry_data = {
      user_id: verifiedToken.sub, author, book_image, book_name, pdf_link,
    };

    /**
     * Sends the response immediately after uploading the PDF.
     */
    res.status(200).send(`File uploaded successfully: ${req.file.filename}`);

    /**
     * Defer the remaining operations, allowing them to execute after response is sent
     */
    setImmediate(async () => {
      try {
        /**
         * Adds a book entry to the database.
         */
        const { $id: bookEntryId } = await add_upload_book_entry(
          book_entry_data
        );

        /**
         * Chunks the text into smaller pieces.
         */
        const chunked_text = chunk(text, 10000);
        /**
         * Creates a file from the chunked text.
         */
        const filePath = await createFileFromRandomChunks(chunked_text);
        console.log("File written successfully");

        /**
         * Generates AI content using the chunked text.
         */
        const random_cache_model_name = `${crypto.randomUUID()}`;
        await ai_blog_generator({
          subscriptionQuota,
          filePath,
          displayName: random_cache_model_name,
          bookEntryId,
          user_id: verifiedToken.sub, // Use verified user ID
        });

        /**
         * Deletes the temporary file.
         */
        await fs.unlink(filepath);
        console.log(`Successfully deleted the file: ${filepath}`);

        /**
         * Uploads the chunked text to Appwrite.
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
