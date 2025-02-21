const fs = require('fs')

async function checkFileMimetype(req, res, next) {
    try {
        const { mimetype } = req.body;
        const {subscription }= req;

        if (mimetype !== 'application/pdf' && !['reader'].includes(subscription)) {
            fs.unlink(filepath);
            return res.status(403).json({ error: 'Forbidden', message: "File type not allowed in your plan" });
        }

        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Internal Server Error", message: "Something gone wrong on our side" })
    }
}

module.exports = checkFileMimetype;
/*
curl -X POST http://localhost:3000/new-upload \
  -H "Content-Type: multipart/form-data" \
  -F "pdf=@/home/hyper/Downloads/_OceanofPDF.com_Superagency_Our_AI_Future_-_Reid_Hoffman.epub" \
  -F "blogCount=12" \
  -F "mimetype=application/epub+zip" \
  -F "authorName=John Doe" \
  -F "bookTitle=Sample Book" \
  -F "imageUrl=https://example.com/image.jpg"
 */