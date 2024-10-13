const fs = require('fs').promises;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  FileState,
  GoogleAICacheManager,
  GoogleAIFileManager,
} = require("@google/generative-ai/server");

const BLOG_QUERY =
  "From all the chunks given, generate a blog out of them such that it contains the exact lines, paragraphs,and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude without the need for any prior context, and it should also feel like a blog, not like you are reading an extract from a book. Organize them creatively.";

const QUOTE_QUERY =
  "From all the chunks given, generate a quote out of them such that it contains the exact lines, paragraphs,and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude without the need for any prior context.";

async function justFetchThem(genBlog, genQuote) {
  for (let i = 0; i < 6; i++) {
    await new Promise((resolve) => setTimeout(resolve, 7000));
    await genBlog();
  }
  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 7000));
    await genQuote();
  }
}

async function ai_blog_quote_generator(filePath, displayName) {
  console.log(`Starting AI blog and quote generation for file: ${filePath}`);
  const fileManager = new GoogleAIFileManager(
    process.env.GOOGLE_API_KEY 
  );
  
  console.log("Uploading file to Google AI");
  const fileResult = await fileManager.uploadFile(filePath, {
    displayName,
    mimeType: "text/plain",
  });

  const { name, uri } = fileResult.file;
  console.log(`File uploaded successfully. URI: ${uri}`);

  try {
    await fs.unlink(filePath);
    console.log(`Successfully deleted the file: ${filePath}`);
  } catch (unlinkError) {
    console.error(`Error deleting file ${filePath}:`, unlinkError);
  }

  let file = await fileManager.getFile(name);
  while (file.state === FileState.PROCESSING) {
    console.log("Waiting for file to be processed.");
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    file = await fileManager.getFile(name);
  }

  console.log(`File processing complete: ${uri}`);

  const cacheManager = new GoogleAICacheManager(
    process.env.GOOGLE_API_KEY 
  );
  const model = "models/gemini-1.5-flash-001";

  const systemInstruction =
    "You are going to be given a text file that contains random 1000-word chunks from books with their names. You have to digest all of them and return the response in markdown. Each time you must give a different response regardless of the query. Be creative.";

  let ttlSeconds = 600;
  const cache = await cacheManager.create({
    model,
    displayName,
    systemInstruction,
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              mimeType: fileResult.file.mimeType,
              fileUri: fileResult.file.uri,
            },
          },
        ],
      },
    ],
    ttlSeconds,
  });
  const genAI = new GoogleGenerativeAI(
    process.env.GOOGLE_API_KEY 
  );

  const genModel = genAI.getGenerativeModelFromCachedContent(cache);

  const blog_list = [];
  const quote_list = [];

  async function genBlog() {
    console.log("Generating blog content");
    const result = await genModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: BLOG_QUERY,
            },
          ],
        },
      ],
    });
    blog_list.push(result.response.text());
    console.log("Blog content generated successfully");
  }

  async function genQuote() {
    console.log("Generating quote content");
    const result = await genModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: QUOTE_QUERY,
            },
          ],
        },
      ],
    });
    quote_list.push(result.response.text());
    console.log("Quote content generated successfully");
  }

  await justFetchThem(genBlog, genQuote);
  console.log(`Generated ${blog_list.length} blogs and ${quote_list.length} quotes`);
  return [blog_list, quote_list];
}

module.exports = { ai_blog_quote_generator };