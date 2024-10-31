const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs").promises;
const simpleFs = require("fs");
const path = require("path");
const chunk = require("chunk-text");
const { parsePDF } = require("../parser/pdf_to_text");
const { random_chunk } = require("../parser/chunk_random");
const { ai_blog_generator } = require("../ai/ai_blog_generator");
const pdf = require("pdf-extraction");
const extractTitleAndAuthor = require("../parser/extractTitleAndAuthor");

const {
  upload_pdf,
  add_upload_book_entry,
  upload_pdf_chunk,
  add_blogs,
} = require("../appwrite/appwrite");
const { getTokenCount } = require("../parser/text_to_token_len");

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

  const filepath = path.resolve(req.file.path);
  let dataBuffer = simpleFs.readFileSync(filepath);

  const text = await parsePDF(filepath);
  const tokenCount = await getTokenCount(text);

  if (tokenCount < 50_000) {
    return res.status(400).send("Your Book is too small, try a bigger one");
  }

  let titleAndAuthor = {};

  pdf(dataBuffer).then(function (data) {
    titleAndAuthor = extractTitleAndAuthor(data);
  });

  try {
    const { $id: bookPDFId } = await upload_pdf(filepath);
    const pdf_link = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${bookPDFId}/view?project=${process.env.APPWRITE_PROJECT_ID}&mode=admin`;
    const book_entry_data = { ...titleAndAuthor, pdf_link };

    // Immediately send the response after uploading PDF and book entry creation
    res.send(`File uploaded successfully: ${req.file.filename}`);

    // Defer the remaining operations, allowing them to execute after response is sent
    setImmediate(async () => {
      try {
        const { $id: bookEntryId } = await add_upload_book_entry(
          book_entry_data
        );

        const chunked_text = chunk(text, 5000);

        for (const chunk of chunked_text) {
          const chunk_data = {
            chunk_text: chunk,
            books: bookEntryId,
          };
          await upload_pdf_chunk(chunk_data);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const random_chunks = random_chunk(chunked_text);
        let random_text = ``;

        for (let i = 0; i < random_chunks.length; i++) {
          const divider =
            "========================================================";
          random_text += `${divider} ${random_chunks[i]}`;
        }

        const fileName = `${crypto.randomUUID()}.txt`;
        const filePath = path.resolve(fileName);
        await fs.writeFile(fileName, random_text);
        console.log("File written successfully");

        const random_cache_model_name = `${crypto.randomUUID()}`;
        const blog_chunks = await ai_blog_generator(
          filePath,
          random_cache_model_name
        );

        await add_blogs(blog_chunks, bookEntryId);

        await fs.unlink(filepath);
        console.log(`Successfully deleted the file: ${filepath}`);
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
