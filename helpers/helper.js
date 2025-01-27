const { verifyToken } = require("@clerk/backend");

async function invalidateToken({ req, res }) {
    try {
        /**
         * Retrieves the authorization token from the request headers.
         */
        const authHeader = req.headers.authorization;

        /**
         * Checks if the authorization token is present.
         */
        if (!authHeader) {
            return res.status(401).json({ error: 'Token not found. User must sign in.' })
        }

        /**
            * Extracts the token from the authorization header.
            */
        const token = authHeader.replace('Bearer ', '')

        const verifiedToken = await verifyToken(token, {
            jwtKey: process.env.CLERK_JWT_KEY,
            authorizedParties: ['http://localhost:3001', 'http://localhost:3000', "https://purplenight.hyperingenious.tech"],
        });

        /**
            * Checks if the token is valid.
            */
        if (!verifiedToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        return verifiedToken;

    }
    catch (error) {
        console.error(error)
        throw error
    }

}


module.exports = {
    invalidateToken
}
/*

{
  app_metadata: {},
  aud: 'authenticated',
  azp: 'http://localhost:3001',
  email: 'skbmasale941@gmail.com',
  exp: 1737647424,
  iat: 1737647364,
  iss: 'https://assured-ape-25.clerk.accounts.dev',
  jti: '2be8796762f1babba841',
  nbf: 1737647359,
  role: 'authenticated',
  sub: 'user_2oFLUNePrbPyBH1zJL4gV4mn7Kp',
  user_metadata: {}
}

*/