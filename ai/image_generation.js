require("dotenv").config();
const fs = require("fs");
const https = require("https");
const { upload_file_with_url } = require("../appwrite/upload/upload_appwrite");

async function generateImage({ prompt }) {
    const account_id = process.env.CLOUDFARE_ACCOUT_ID;
    const token = process.env.CLOUDFARE_API_TOKEN;

    if (!account_id || !token) {
        throw new Error("Missing Cloudflare credentials. Please set CLOUDFARE_ACCOUT_ID and CLOUDFARE_API_TOKEN in environment variables.");
    }

    const safePrompt = `Generate a safe image with prompt: ${prompt}`;
    console.log(safePrompt);

    const url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;

    return new Promise((resolve, reject) => {
        try {
            const req = https.request(
                url,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
                (res) => {
                    let data = [];

                    res.on("data", (chunk) => data.push(chunk));
                    res.on("end", () => {
                        if (res.statusCode >= 400) {
                            const responseBody = Buffer.concat(data).toString();
                            console.error(`Cloudflare API error - Status: ${res.statusCode}, Response: ${responseBody}`);
                            return reject(new Error(`Image generation failed with status code ${res.statusCode}.`));
                        }

                        try {
                            const buffer = Buffer.concat(data);
                            const fullPath = __dirname + "/" + "output.png";
                            fs.writeFileSync(fullPath, buffer);
                            resolve({ path: fullPath });
                        } catch (fileError) {
                            console.error("File write error in generateImage:", fileError);
                            return reject(new Error(`Failed to write image file: ${fileError.message}`));
                        }
                    });
                }
            );

            req.on("error", (error) => {
                console.error("HTTPS request error in generateImage:", error);
                reject(new Error(`Request error: ${error.message}`));
            });

            req.write(JSON.stringify({ prompt: safePrompt }));
            req.end();
        } catch (err) {
            console.error("Unexpected exception in generateImage:", err);
            reject(new Error(`Unexpected error in generateImage: ${err.message}`));
        }
    });
}

async function getPromptGeneratedImageUrl({ prompt }) {
    const image_path = __dirname + '/output.png';

    try {
        await generateImage({ prompt });
        console.log("Image generated successfully:", image_path);

        const hosted_url = await upload_file_with_url(image_path);
        console.log("Image uploaded to Appwrite:", hosted_url);

        try {
            fs.unlinkSync(image_path);
            console.log("Temporary image file deleted successfully");
        } catch (unlinkError) {
            console.error("Failed to delete temporary file:", unlinkError);
            throw new Error(`Temporary file cleanup failed: ${unlinkError.message}`);
        }

        return hosted_url;
    } catch (error) {
        console.error("Error in getPromptGeneratedImageUrl:", error);
        throw new Error(`getPromptGeneratedImageUrl failed: ${error.message}`);
    }
}

module.exports = { generateImage, getPromptGeneratedImageUrl };
