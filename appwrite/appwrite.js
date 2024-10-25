const sdk = require("node-appwrite");
const crypto = require("crypto");
const { InputFile } = require("node-appwrite/file");

const APPWRITE_CLOUD_URL = process.env.APPWRITE_CLOUD_URL;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_APP_KEY = process.env.APPWRITE_APP_KEY;

const client = new sdk.Client()
  .setEndpoint(APPWRITE_CLOUD_URL)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_APP_KEY);

const storage = new sdk.Storage(client);
const databases = new sdk.Databases(client);

//  Constants
const DATABASE_ID = process.env.DATABASE_ID;
const BOOKS_COLLECTION_ID = process.env.BOOKS_COLLECTION_ID;
const CHUNKS_COLLECTION_ID = process.env.CHUNKS_COLLECTION_ID;
const BLOGS_COLLECTION_ID = process.env.BLOGS_COLLECTION_ID;
const QUOTE_COLLECTION_ID = process.env.QUOTE_COLLECTION_ID;
const BUCKET_ID = process.env.BUCKET_ID;

async function get_all_chunk_ids_with_book_id(book_id) {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CHUNKS_COLLECTION_ID,
      [sdk.Query.equal("books", book_id), sdk.Query.limit(300)]
    );
    return response.documents.map((doc) => doc.$id);
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}

async function get_chunk_by_id(chunk_id) {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      CHUNKS_COLLECTION_ID,
      chunk_id
    );
    return response;
  } catch (error) {
    console.error(error.messsage);
    throw error;
  }
}

async function upload_pdf(pdf_path) {
  try {
    console.log(`Uploading PDF from path: ${pdf_path}`);
    const result = await storage.createFile(
      BUCKET_ID,
      sdk.ID.unique(),
      InputFile.fromPath(pdf_path, `${crypto.randomUUID()}.pdf`)
    );
    console.log(`PDF uploaded successfully. File ID: ${result.$id}`);
    return result;
  } catch (error) {
    console.error("Error uploading PDF:", error);
    throw error;
  }
}

async function add_upload_book_entry(data_obj) {
  try {
    console.log("Adding book entry to database");
    const response = await databases.createDocument(
      DATABASE_ID,
      BOOKS_COLLECTION_ID,
      sdk.ID.unique(),
      data_obj
    );
    console.log(`Book entry added successfully. Document ID: ${response.$id}`);
    return response;
  } catch (error) {
    console.error("Error adding book entry:", error);
    throw error;
  }
}

async function upload_pdf_chunk(chunk_data) {
  try {
    console.log("Uploading PDF chunk");
    const response = await databases.createDocument(
      DATABASE_ID,
      CHUNKS_COLLECTION_ID,
      sdk.ID.unique(),
      chunk_data
    );
    console.log(
      `PDF chunk uploaded successfully. Document ID: ${response.$id}`
    );
  } catch (error) {
    console.error("Error uploading PDF chunk:", error);
    throw error;
  }
}

async function add_blogs_and_quotes(books_and_quote_array, book_id) {
  try {
    const [blogs, quotes] = books_and_quote_array;
    console.log(
      `Adding ${blogs.length} blogs and ${quotes.length} quotes for book ID: ${book_id}`
    );

    for (let i = 0; i < blogs.length; i++) {
      const blogResponse = await databases.createDocument(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        sdk.ID.unique(),
        {
          blog_markdown: blogs[i],
          books: book_id,
        }
      );
      console.log(
        `Blog ${i + 1}/${blogs.length} added. Document ID: ${blogResponse.$id}`
      );
    }

    for (let i = 0; i < quotes.length; i++) {
      const quoteResponse = await databases.createDocument(
        DATABASE_ID,
        QUOTE_COLLECTION_ID,
        sdk.ID.unique(),
        { quote_text: quotes[i], books: book_id }
      );
      console.log(
        `Quote ${i + 1}/${quotes.length} added. Document ID: ${
          quoteResponse.$id
        }`
      );
    }

    console.log("All blogs and quotes added successfully");
  } catch (error) {
    console.error("Error adding blogs and quotes:", error);
    throw error;
  }
}

module.exports = {
  get_all_chunk_ids_with_book_id,
  get_chunk_by_id,
  upload_pdf,
  add_upload_book_entry,
  upload_pdf_chunk,
  add_blogs_and_quotes,
};
