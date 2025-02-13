const { DATABASE_ID, databases, storage, BUCKET_ID, CHUNKS_COLLECTION_ID, APPWRITE_PROJECT_ID } = require("../appwrite");
const sdk = require("node-appwrite");
const crypto = require("crypto");
const { InputFile } = require("node-appwrite/file");

async function upload_file_with_url(url) {
    console.log(`Uploading file from URL: ${url}`);
    try {
        const result = await storage.createFile(
            BUCKET_ID,
            sdk.ID.unique(),
            InputFile.fromPath(url, `${crypto.randomUUID()}.png`)
        );
        console.log(`File uploaded successfully. File ID: ${result.$id}`);
        const file_url = `https://cloud.appwrite.io/v1/storage/buckets/${result.bucketId}/files/${result.$id}/view?project=${APPWRITE_PROJECT_ID}&project=${APPWRITE_PROJECT_ID}&mode=admin`;
        console.log(`File URL: ${file_url}`);
        return file_url;
    } catch (error) {
        throw error;
    }
}

async function upload_pdf_chunk(chunk_data) {
    console.log("Uploading PDF chunk of BOOKID:", chunk_data.books);
    try {
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
        throw error;
    }
}


async function upload_pdf(pdf_path) {
    console.log(`Uploading PDF from path: ${pdf_path}`);
    try {
        const result = await storage.createFile(BUCKET_ID,
            sdk.ID.unique(),
            InputFile.fromPath(pdf_path, `${sdk.ID.unique()}.pdf`)
        );
        console.log(`PDF uploaded successfully. File ID: ${result.$id}`);
        return result;
    } catch (error) {
        throw error;
    }
}


module.exports = {
    upload_pdf_chunk,
    upload_pdf,
    upload_file_with_url,
}