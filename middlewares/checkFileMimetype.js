const fs = require('fs')

async function checkFileMimetype(req, res, next) {
    try {
        const mimetype = req.body.mimetype;
        const subscription = req.subscription;

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