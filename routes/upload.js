const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs").promises; 
const path = require("path");
const chunk = require("chunk-text");
const { parsePDF } = require("../parser/pdf_to_text");
const { random_chunk } = require("../parser/chunk_random");
const { ai_blog_quote_generator } = require("../ai/ai_blog_quote_generator");

const {
  upload_pdf,
  add_upload_book_entry,
  upload_pdf_chunk,
  add_blogs_and_quotes,
} = require("../appwrite/appwrite");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
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
  //  https://cloud.appwrite.io/v1/storage/buckets/{bucket_id}/files/{file_id}/view?project={project_id}&mode=admin"

  try {
    const { $id: bookPDFId } = await upload_pdf(filepath);

    try {
      await fs.unlink(filepath);
      console.log(`Successfully deleted the file: ${filepath}`);
    } catch (unlinkError) {
      console.error(`Error deleting file ${filepath}:`, unlinkError);
    }

    // const book_name = await extractBookTitle(filepath);
    const book_name = ''

    const pdf_link = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${bookPDFId}/view?project=${process.env.APPWRITE_PROJECT_ID}&mode=admin`;

    const book_entry_data = { book_name, pdf_link};

    const { $id: bookEntryId } = await add_upload_book_entry(book_entry_data);

    const text = await parsePDF(filepath);
    const chunked_text = chunk(text, 5000);

    const chunk_promises = chunked_text.map(chunk=>{
      const chunk_data = {
      chunk_text: chunk,
      books: bookEntryId
    }
    return upload_pdf_chunk(chunk_data);
    })

    await Promise.all(chunk_promises);

    const random_chunks = random_chunk(chunked_text);
    let random_text = "";

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

    const blog_and_quote_chunks = await ai_blog_quote_generator(
      filePath,
      random_cache_model_name
    );

    await add_blogs_and_quotes(blog_and_quote_chunks, bookEntryId);
  } catch (err) {
    return res.status(404).json({ error: err.message });
  }
  res.send(`File uploaded successfully: ${req.file.filename}`);
}

const upload_pdf_route= [
  upload.single('pdf'),
  handleUpload
]

module.exports = {
  upload_pdf_route,
};