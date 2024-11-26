require("dotenv").config();
const fs = require("fs");
const fetch = require("node-fetch");
const { upload_file_with_url } = require("../appwrite/appwrite");

async function generateImage({ prompt }) {
  const account_id = process.env.CLOUDFARE_ACCOUT_ID;
  const token = process.env.CLOUDFARE_API_TOKEN;

  const url = `https://api.cloudflare.com/client/v4/accounts/${account_id}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;
  const apiToken = token;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer(); // Read binary data

    const output = { buffer: Buffer.from(buffer) };
    const fullPath = __dirname + "/" + "output.png";
    fs.writeFileSync(fullPath, output.buffer);

    return { path: fullPath };
  } catch (error) {
    console.error("Error generating image:", error.message);
  }
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
