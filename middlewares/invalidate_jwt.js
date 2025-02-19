const { invalidateToken } = require("../helpers/helper");

async function invalidateJwt(req, res, next) {
    try {
        const verifiedToken = await invalidateToken({ req, res })
        req.verifiedToken = verifiedToken;
        next()
    } catch (error) {
        res.status(401).json({ error: "Unauthorized", message: 'Cannot authenticate you'})
    }
}

module.exports = invalidateJwt
