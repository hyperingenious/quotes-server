const { random_chunk } = require("./chunk_random");
const crypto = require("crypto");
const fs = require("fs").promises;
const path = require("path");
const { get_chunk_by_id } = require("../appwrite/get/get_appwrite");

async function createFileFromRandomChunksGenerateContent(chunkIds) {
  const random_20_percent_chunkids = random_chunk(chunkIds);
  let random_20_percent_chunk_text = ``;
  const divider = "========================================================";

  for (const chunkId of random_20_percent_chunkids) {
    try {
      const chunk = await get_chunk_by_id(chunkId);
      random_20_percent_chunk_text += `${divider}\n${chunk.chunk_text}\n`;
    } catch (error) {
      console.error(
        `Error retrieving chunk with ID ${chunkId}: ${error.message}`
      );
    }
  }

  const fileName = `${crypto.randomUUID()}.txt`;
  const filePath = path.resolve(fileName);
  await fs.writeFile(fileName, random_20_percent_chunk_text);

  return filePath;
}

async function createFileFromRandomChunks(chunked_text) {
  const random_chunks = random_chunk(chunked_text);
  let random_text = ``;

  for (let i = 0; i < random_chunks.length; i++) {
    const divider = "========================================================";
    random_text += `${divider} ${random_chunks[i]}`;
  }

  const fileName = `${crypto.randomUUID()}.txt`;
  const filePath = path.resolve(fileName);
  await fs.writeFile(fileName, random_text);

  return filePath;
}

module.exports = {
  createFileFromRandomChunksGenerateContent,
  createFileFromRandomChunks,
};
