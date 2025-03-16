const fs = require("fs").promises;
const crypto = require("crypto");
const chunk = require("chunk-text");
const path = require("path");
const { createFileFromRandomChunks } = require("../parser/createFileFromRandomChunks");
const { ai_blog_generator } = require("../ai/ai_blog_generator");
const { upload_pdf } = require("../appwrite/upload/upload_appwrite");
const parse = require("./upload/parse");
const { add_upload_book_entry } = require("../appwrite/add/add_appwrite");
const { databases, DATABASE_ID, FREE_CONTENT_GENERATION_ENTRIES, CATEGORY_COLLECTION_ID } = require("../appwrite/appwrite");
const { ID, Query } = require("node-appwrite");

async function uploadPDFRouteNew(req, res) {
    try {
        const { category, blogCount, mimetype, authorName: author, bookTitle: book_name, imageUrl: book_image } = req.body;
        const { verifiedToken, subscription } = req;

        const filepath = path.resolve(req.file.path);
        let text;
        try {
            text = await parse({ mimetype, filepath });
        } catch (parseError) {
            console.error("Error parsing PDF file:", parseError);
            return res.status(500).json({ message: "Failed to parse PDF file" });
        }

        const perContextPortion = 100 / (blogCount / 6);
        const times = blogCount / 6;
        const chunks = chunk(text, 10000);
        const texts = [];
        const cacheInterval = chunks.length * perContextPortion / 100;

        let bookPDFId;
        try {
            const uploadResult = await upload_pdf(filepath);
            bookPDFId = uploadResult.$id;
        } catch (uploadError) {
            console.error("Error uploading PDF to Appwrite:", uploadError);
            return res.status(500).json({ message: "Failed to upload PDF to storage" });
        }

        const pdf_link = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${bookPDFId}/view?project=${process.env.APPWRITE_PROJECT_ID}&mode=admin`;

        const { total, documents: [categoryDocument] } = await databases.listDocuments(
            DATABASE_ID, CATEGORY_COLLECTION_ID, [Query.select(['$id']), Query.equal('user_id', verifiedToken.sub), Query.equal('category_name', category || 'public')]
        )

        if (total < 1 || total > 1) {
            console.error("There is no entry or more than one categories with same name");
            return res.status(500).json({ message: "There is no entry or more than one categories with same name" })
        }

        const bookEntryData = { user_id: verifiedToken.sub, author, book_image, book_name, pdf_link, category: categoryDocument.$id };
        let bookEntryId;
        try {
            const bookEntry = await add_upload_book_entry(bookEntryData);
            bookEntryId = bookEntry.$id;
        } catch (bookEntryError) {
            console.error("Error adding book entry to database:", bookEntryError);
            return res.status(500).json({ message: "Failed to save book entry in database" });
        }

        res.status(200).json({ message: `File uploaded successfully: ${req.file.filename}` });

        for (let i = 0; i < times; ++i) {
            const startingIndex = i * cacheInterval;
            const chunksSlice = chunks.slice(startingIndex, startingIndex + cacheInterval);
            const tempChunkStore = [];
            chunksSlice.forEach(chunk => tempChunkStore.push(chunk));
            texts.push(tempChunkStore);
        }

        const textFilePaths = [];
        try {
            for (let y = 0; y < texts.length; ++y) {
                const destination = await createFileFromRandomChunks(texts[y]);
                textFilePaths.push(destination);
            }
        } catch (chunkFileError) {
            console.error("Error creating chunk files:", chunkFileError);
            return res.status(500).json({ message: "Failed to generate chunk files for content" });
        }

        try {
            for (let g = 0; g < textFilePaths.length; ++g) {
                const randomCacheModelName = `${crypto.randomUUID()}`;
                await ai_blog_generator({
                    subscriptionQuota: req.subscriptionQuota,
                    filePath: textFilePaths[g],
                    displayName: randomCacheModelName,
                    bookEntryId,
                    user_id: verifiedToken.sub,
                    subscription
                });
            }
        } catch (blogGenerationError) {
            console.error("Error during blog generation process:", blogGenerationError);
            return res.status(500).json({ message: "Failed to generate blogs from content" });
        } finally {
            for (let kkr = 0; kkr < textFilePaths.length; ++kkr) {
                try {
                    await fs.unlink(textFilePaths[kkr]);
                } catch (unlinkError) {
                    console.warn(`Failed to delete temporary file ${textFilePaths[kkr]}:`, unlinkError);
                }
            }
        }

        console.log("Content generated successfully!");

        if (subscription === 'unpaid') {
            try {
                for (let whatever = 0; whatever < blogCount; ++whatever) {
                    await databases.createDocument(
                        DATABASE_ID, FREE_CONTENT_GENERATION_ENTRIES, ID.unique(), {
                        type: 'blog',
                        user_id: verifiedToken.sub
                    });
                }

                await databases.createDocument(
                    DATABASE_ID, FREE_CONTENT_GENERATION_ENTRIES, ID.unique(), {
                    type: 'book',
                    user_id: verifiedToken.sub
                });
            } catch (quotaUpdateError) {
                console.error("Error updating free content generation quota:", quotaUpdateError);
                return res.status(500).json({ message: "Failed to update free content generation quota" });
            }
        }

    } catch (error) {
        console.error("Unexpected error in uploadPDFRouteNew:", error);
        res.status(500).json({ message: "Unexpected error occurred during upload process" });
    }
}

module.exports = uploadPDFRouteNew;
