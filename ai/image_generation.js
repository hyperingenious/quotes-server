require("dotenv").config();
const fs = require("fs");
const https = require("https");
const { upload_file_with_url } = require("../appwrite/appwrite");
const { compress_image } = require("../parser/compress_image");

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
    const image_path = await generateImage({ prompt });
    console.log("Image generated successfully:", image_path);

    await compress_image();
    console.log("Image compression finished");
    const default_img_url = `${__dirname.replace(
      "ai",
      ""
    )}parser/parseroutput.png`;

    const hosted_url = await upload_file_with_url(default_img_url);
    console.log("Image uploaded(appwrite):", hosted_url);

    fs.unlinkSync(default_img_url);
    console.log("File deleted successfully");

    return hosted_url;
  } catch (error) {
    console.error("Error in getPromptGeneratedImageUrl:", error);
    throw error;
  }
}
module.exports = { generateImage, getPromptGeneratedImageUrl };
