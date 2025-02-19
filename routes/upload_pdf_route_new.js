const fs = require("fs").promises;
const crypto = require("crypto");
const chunk = require("chunk-text");
const path = require("path");
const { createFileFromRandomChunks } = require("../parser/createFileFromRandomChunks");
const { ai_blog_generator } = require("../ai/ai_blog_generator");
const { upload_pdf } = require("../appwrite/upload/upload_appwrite");

async function uploadPDFRouteNew(req, res) {
    try {
        const mimetype = req.body.mimetype;
        const filepath = path.resolve(req.file.path)
        const text = await parse({ mimetype, filepath })
        const blogCount = req.blogCount;

        const perContextPortion = 100 / (blogCount / 6);
        const times = blogCount / 6
        const chunks = chunk(text, 10000);
        const texts = [];
        const cacheInterval = chunks.length * perContextPortion / 100;

        const { authorName: author, bookTitle: book_name, imageUrl: book_image } = req.body;
        const { $id: bookPDFId } = await upload_pdf(filepath);
        const pdf_link = `https://cloud.appwrite.io/v1/storage/buckets/${process.env.BUCKET_ID}/files/${bookPDFId}/view?project=${process.env.APPWRITE_PROJECT_ID}&mode=admin`;
        const bookEntryData = { user_id: req.verifiedToken.sub, author, book_image, book_name, pdf_link };

        const { $id: bookEntryId } = await add_upload_book_entry(bookEntryData);
        res.status(200).json({ message: `File uploaded successfully: ${req.file.filename}` });

        for (let i = 0; i < times; ++i) {
            const startingIndex = i * cacheInterval;
            const chunksSlice = chunks.slice(startingIndex, startingIndex + cacheInterval);
            const tempChunkStore = []
            chunksSlice.forEach(chunk => tempChunkStore.push(chunk))
            texts.push(tempChunkStore);
        }

        const textFilePaths = [];
        for (let y = 0; y < texts.length; ++y) {
            const destination = await createFileFromRandomChunks(text[y]);
            textFilePaths.push(destination)
        }

        const aiGenerationPromises = []
        for (let bablesh = 0; bablesh < textFilePaths; ++bablesh) {
            const randomCacheModelName = `${crypto.randomUUID()}`;
            aiGenerationPromises.push(ai_blog_generator({ subscriptionQuota: req.subscriptionQuota, filePath: textFilePaths[bablesh], displayName: randomCacheModelName, bookEntryId, user_id: req.verifiedToken.sub }))
        }

        await Promise.all(aiGenerationPromises)

        for (let kkr = 0; kkr < textFilePaths.length; ++kkr) {
            await fs.unlink(textFilePaths[kkr]);
        }

        console.log("Content generated successfully!")
    } catch (error) {
        console.error(error)
        throw error;
    }
}

module.exports = uploadPDFRouteNew; 