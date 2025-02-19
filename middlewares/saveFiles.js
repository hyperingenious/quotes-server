const multer = require("multer");

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
const saveFiles = multer({ storage: storage });
module.exports = saveFiles;
