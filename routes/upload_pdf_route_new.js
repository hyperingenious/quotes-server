const fs = require("fs").promises;
const crypto = require("crypto");
const chunk = require("chunk-text");
const path = require("path");
const { createFileFromRandomChunks } = require("../parser/createFileFromRandomChunks");
const { ai_blog_generator } = require("../ai/ai_blog_generator");
const { upload_pdf } = require("../appwrite/upload/upload_appwrite");
const parse = require("./upload/parse");
const { add_upload_book_entry } = require("../appwrite/add/add_appwrite");
const { databases, DATABASE_ID, FREE_CONTENT_GENERATION_ENTRIES } = require("../appwrite/appwrite");

async function uploadPDFRouteNew(req, res) {
    try {
        const { subscription, blogCount, mimetype, authorName: author, bookTitle: book_name, imageUrl: book_image } = req.body;
        const { verifiedToken } = req
        const filepath = path.resolve(req.file.path)
        const text = await parse({ mimetype, filepath })

        const perContextPortion = 100 / (blogCount / 6);
        const times = blogCount / 6;
        const chunks = chunk(text, 10000);
        const texts = [];
        const cacheInterval = chunks.length * perContextPortion / 100;


        const { $id: bookPDFId } = await upload_pdf(filepath);
        const pdf_link = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${bookPDFId}/view?project=${process.env.APPWRITE_PROJECT_ID}&mode=admin`;
        const bookEntryData = { user_id: req.verifiedToken.sub, author, book_image, book_name, pdf_link };

        const { $id: bookEntryId } = await add_upload_book_entry(bookEntryData);
        res.status(200).json({ message: `File uploaded successfully: ${req.file.filename}` });

        for (let i = 0; i < times; ++i) {
            const startingIndex = i * cacheInterval;
            const chunksSlice = chunks.slice(startingIndex, startingIndex + cacheInterval);
            const tempChunkStore = [];
            chunksSlice.forEach(chunk => tempChunkStore.push(chunk));
            texts.push(tempChunkStore);
        }

        const textFilePaths = [];
        for (let y = 0; y < texts.length; ++y) {
            const destination = await createFileFromRandomChunks(texts[y]);
            textFilePaths.push(destination)
        }

        for (let bablesh = 0; bablesh < textFilePaths.length; ++bablesh) {
            const randomCacheModelName = `${crypto.randomUUID()}`;
            await ai_blog_generator({ subscriptionQuota: req.subscriptionQuota, filePath: textFilePaths[bablesh], displayName: randomCacheModelName, bookEntryId, user_id: req.verifiedToken.sub })
        }

        for (let kkr = 0; kkr < textFilePaths.length; ++kkr) {
            await fs.unlink(textFilePaths[kkr]);
        }
        console.log("Content generated successfully!");


        if (subscription === 'unpaid') {
            for (let whatever = 0; whatever < blogCount; ++whatever) {
                await databases.createDocument(
                    DATABASE_ID, FREE_CONTENT_GENERATION_ENTRIES, {
                    type: 'blog',
                    user_id: verifiedToken.sub
                }
                )
            }

            await databases.createDocument(
                Dataid, FREE_CONTENT_GENERATION_ENTRIES, {
                type: 'book',
                user_id: verifiedToken.sub
            })
        }

    } catch (error) {
        console.error(error)
        throw error;
    }
}

module.exports = uploadPDFRouteNew; 
