require("dotenv").config();
const fs = require("fs");
const https = require("https");
const { upload_file_with_url } = require("../appwrite/appwrite");

async function generateImage({ prompt }) {
  const account_id = process.env.CLOUDFARE_ACCOUT_ID;
  const token = process.env.CLOUDFARE_API_TOKEN;

  const url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;
  const apiToken = token;

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = [];
        res.on("data", (chunk) => {
          data.push(chunk);
        });
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP error! status: ${res.statusCode}`));
            return;
          }
          const buffer = Buffer.concat(data);
          const output = { buffer };
          const fullPath = __dirname + "/" + "output.png";
          fs.writeFileSync(fullPath, output.buffer);
          resolve({ path: fullPath });
        });
      }
    );

    req.on("error", (error) => {
      reject(error);
    });

    req.write(JSON.stringify({ prompt }));
    req.end();
  });
}

async function getPromptGeneratedImageUrl({ prompt }) {
  try {
    console.log("Generating image...");
    const image_path = await generateImage({ prompt });
    console.log("Image generated successfully:", image_path);

    console.log("Uploading image to Appwrite...");
    const hosted_url = await upload_file_with_url(image_path.path);
    console.log("Image uploaded successfully:", hosted_url);

    return hosted_url;
  } catch (error) {
    console.error("Error in getPromptGeneratedImageUrl:", error);
    throw error;
  }
}
module.exports = { generateImage, getPromptGeneratedImageUrl };
