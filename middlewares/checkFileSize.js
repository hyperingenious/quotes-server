const fs = require('fs')
async function checkFileSize(req, res, next) {
    try {
        const { subscription } = req;
        const fileSize = req.file.size;
        const filepath = req.file.path;

        //Check file size based on subscription
        const maxSize = subscription === 'unpaid' ? 1050000 : (subscription === 'reader' ? 21000000 : 0); //Default to 0 for unsupported plans.

        if (maxSize > 0 && fileSize > maxSize) {
            await fs.unlink(filepath);
            return res.status(400).json({ error: "Bad Request", message: `File exceeded ${maxSize / 1000000}Mb try smaller` });
        }
        next();
        return;
    } catch (error) {
        console.error("Error in checkFileSize middleware:", error);
        return res.status(500).json({ error: "Internal Server Error", message: "Something went wrong while checking file size." });
    }
}
module.exports = checkFileSize;
