const sdk = require("node-appwrite");

const APPWRITE_CLOUD_URL = process.env.APPWRITE_CLOUD_URL;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_APP_KEY = process.env.APPWRITE_APP_KEY;
const TOKENISATION_COLLECTION_ID = process.env.TOKENISATION_COLLECTION_ID

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
const PUBLICLY_SHARED_BLOGS_COLLECTION_ID = process.env.PUBLICLY_SHARED_BLOGS_COLLECTION_ID

const CONTENT_DELETION_COLLECTION_ID = process.env.CONTENT_DELETION_COLLECTION_ID;
const BUCKET_ID = process.env.BUCKET_ID;

module.exports = {
  APPWRITE_CLOUD_URL,
  APPWRITE_PROJECT_ID,
  APPWRITE_APP_KEY,

  TOKENISATION_COLLECTION_ID,
  PUBLICLY_SHARED_BLOGS_COLLECTION_ID,
  storage,
  databases,

  DATABASE_ID,
  BOOKS_COLLECTION_ID,

  CHUNKS_COLLECTION_ID,
  BLOGS_COLLECTION_ID,
  CONTENT_DELETION_COLLECTION_ID,
  BUCKET_ID
}

