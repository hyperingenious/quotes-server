const multer = require("multer");
const { add_feedback_entry } = require("../appwrite/add/add_appwrite");
const { upload_file_with_url } = require("../appwrite/upload/upload_appwrite");
const { invalidateToken } = require("../helpers/helper");
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: (lkajdslkfj, ldskjf, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (_, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

async function feedbackJI(req, res) {
    try {
        const verifiedToken = await invalidateToken({ req, res });
        const feedback = req.body.feedback;
        const email = verifiedToken.email;
        const user_id = verifiedToken.sub;

        let image_link = null;
        if (req.file) {
            const filePath = path.join(__dirname, '../uploads', req.file.filename);
            image_link = await upload_file_with_url(filePath)
            fs.unlink(filePath)
        }

        await add_feedback_entry({ feedback, email, user_id, })
        res.status(200).json({ message: "Feedback sent successfully!" })
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ error: "Unknown", message: "Internal Server Errro" })
    }


}
const feedback = [upload.single('screenshot'), feedbackJI]
module.exports = feedback