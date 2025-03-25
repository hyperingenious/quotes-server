const multer = require("multer");
const parse = require("./upload/parse");
const path = require("path");
const fs = require('fs');
const { getTokenCount } = require("../parser/text_to_token_len");

/**
 * Multer storage engine configuration for storing uploaded files.
 */
const storage = multer.diskStorage({
    destination: (_, __, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

/**
 * Multer instance with the configured storage engine.
 */
const upload = multer({ storage: storage });

async function getTokenPlan(req, res) {
    const mimetype = req.body.mimetype;
    const filepath = path.resolve(req.file.path);
    const text = await parse({ mimetype, filepath })

    const tokenCount = await getTokenCount(text)

    if (tokenCount < 50_000) {
        await fs.promises.unlink(filepath);
        return res.status(400).send("Your book should at-least be 100 page long");
    }

    const iteration = Math.floor(tokenCount / 50_000);
    const possiblePercentangeJump = 100 / iteration;
    res.status(200).json({
        possiblePercentangeJump, blogCoung: 6, tokenCount
    })
}

const tokenPlan = [upload.single('pdf'), getTokenPlan]

module.exports = tokenPlan

/*
curl -X POST http://localhost:3000/get-token-plan \
  -H "Content-Type: multipart/form-data" \
  -F "pdf=@/home/hyper/Downloads/_OceanofPDF.com_Superagency_Our_AI_Future_-_Reid_Hoffman.pdf" \
  -F "mimetype=application/pdf"

*/
