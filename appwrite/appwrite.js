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
const CONTENT_DELETION_COLLECTION_ID =
  process.env.CONTENT_DELETION_COLLECTION_ID;
const BUCKET_ID = process.env.BUCKET_ID;

async function upload_file_with_url(url) {
  try {
    const result = await storage.createFile(
      BUCKET_ID,
      sdk.ID.unique(),
      InputFile.fromPath(url, `${crypto.randomUUID}.png`)
    );

    const file_url = `https://cloud.appwrite.io/v1/storage/buckets/${result.bucketId}/files/${result.$id}/view?project=${APPWRITE_PROJECT_ID}&project=${APPWRITE_PROJECT_ID}&mode=admin`;

    return file_url;
  } catch (error) {
    console.error("Error creating file:", error);
    throw error;
  }
}

async function get_all_chunk_ids_with_book_id(book_id) {
  try {
    const { total, documents } = await databases.listDocuments(
      DATABASE_ID,
      CHUNKS_COLLECTION_ID,
      [sdk.Query.equal("books", book_id), sdk.Query.limit(300)]
    );

    if (total == 0) return;

    return documents.map((doc) => doc.$id);
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

async function delete_chunk_by_id(el) {
  try {
    await databases.deleteDocument(DATABASE_ID, CHUNKS_COLLECTION_ID, el);
  } catch (e) {
    throw e;
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

async function add_blogs(blogs_array, book_id, user_id) {
  try {
    for (let i = 0; i < blogs_array.length; i++) {
      const blogResponse = await databases.createDocument(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        sdk.ID.unique(),
        {
          blog_markdown: blogs_array[i],
          books: book_id,
          user_id,
        }
      );
      console.log(
        `Blog ${i + 1}/${blogs_array.length} added. Document ID: ${
          blogResponse.$id
        }`
      );
    }
    console.log("All blogs added successfully");
  } catch (error) {
    console.error("Error adding blogs :", error);
    throw error;
  }
}

async function add_blog({ blog, book_id, user_id, blog_image }) {
  try {
    await databases.createDocument(
      DATABASE_ID,
      BLOGS_COLLECTION_ID,
      sdk.ID.unique(),
      {
        blog_markdown: blog,
        books: book_id,
        blog_image,
        user_id,
      }
    );
  } catch (error) {
    console.error("Error adding blog", error);
    throw error;
  }
}

async function delete_blog_by_id(el) {
  try {
    await databases.deleteDocument(DATABASE_ID, BLOGS_COLLECTION_ID, el);
    return null;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function get_all_blog_ids_match_book_id(id) {
  try {
    const { total, documents } = await databases.listDocuments(
      DATABASE_ID,
      BLOGS_COLLECTION_ID,
      [sdk.Query.equal("books", id), sdk.Query.limit(300)]
    );

    if (total == 0) return;

    return documents.map((ddata) => ddata.$id);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function delete_book_entry_by_id(el) {
  try {
    await databases.deleteDocument(DATABASE_ID, BOOKS_COLLECTION_ID, el);
    return null;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function delete_file_by_id(el) {
  try {
    await storage.deleteFile(BUCKET_ID, el);
    return null;
  } catch (error) {
    console.error(error);
  }
}

async function get_book_document_by_id(el) {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      BOOKS_COLLECTION_ID,
      el
    );
    return doc;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function add_deletion_entry({ file_id, chunk_id_array, blog_id_array }) {
  const chunk_ids = JSON.stringify(chunk_id_array);
  const blog_ids = JSON.stringify(blog_id_array);

  try {
    const res = await databases.createDocument(
      DATABASE_ID,
      CONTENT_DELETION_COLLECTION_ID,
      sdk.ID.unique(),
      {
        chunk_ids,
        blog_ids,
        file_id,
      }
    );
    return res;
  } catch (error) {
    console.error("Error adding book entry:", error);
    throw error;
  }
}

async function get_all_deletion_entries() {
  try {
    const { documents } = await databases.listDocuments(
      DATABASE_ID,
      CONTENT_DELETION_COLLECTION_ID,
      [sdk.Query.limit(1000000)]
    );
    return documents;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
}

async function delet_deletion_entry(id) {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      CONTENT_DELETION_COLLECTION_ID,
      id
    );
    return null;
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  get_all_chunk_ids_with_book_id,
  get_chunk_by_id,
  get_book_document_by_id,
  get_all_blog_ids_match_book_id,
  get_all_deletion_entries,

  upload_pdf_chunk,
  upload_pdf,
  upload_file_with_url,

  add_upload_book_entry,
  add_blogs,
  add_blog,
  add_deletion_entry,

  delete_chunk_by_id,
  delete_blog_by_id,
  delete_book_entry_by_id,
  delete_file_by_id,
  delet_deletion_entry,
};
