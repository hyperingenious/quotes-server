const { invalidateToken } = require("../helpers/helper");

async function invalidateJwt(req, res, next) {
    try {
        // const verifiedToken = await invalidateToken({ req, res })
        const verifiedToken = {
            app_metadata: {},
            aud: 'authenticated',
            azp: 'https://purplenight.hyperingenious.tech',
            email: 'skbmasale941@gmail.com',
            exp: 1738339522,
            iat: 1738339462,
            iss: 'https://assured-ape-25.clerk.accounts.dev',
            jti: '09765b21198ba09b3a56',
            nbf: 1738339457,
            role: 'authenticated',
            sub: 'user_2oFLUNePrbPyBH1zJL4gV4mn7Kp',
            user_metadata: {}
        }

        req.verifiedToken = verifiedToken;
        next()
    } catch (error) {
        res.status(401).json({ error: "Unauthorized", message: 'Cannot authenticate you' })
    }
}

module.exports = invalidateJwt
