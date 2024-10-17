const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  FileState,
  GoogleAICacheManager,
  GoogleAIFileManager,
} = require("@google/generative-ai/server");

const BLOG_QUERY =
  "From all the chunks given, generate a blog out of them such that it contains the exact lines, paragraphs,and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude without the need for any prior context, and it should also feel like a blog, not like you are reading an extract from a book. Organize them creatively. The output should be in markdown format.";

const QUOTE_QUERY =
  "From all the chunks given, generate a quote out of them such that it contains the exact lines, paragraphs,and quotes. At the same time, you have to pick them in such a way that they can be understood in solitude without the need for any prior context. and SHould not exceed 420 characters";

async function uploadFile(filePath, displayName) {
  try {
    const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);
    console.log("Uploading file to Google AI");
    const fileResult = await fileManager.uploadFile(filePath, {
      displayName,
      mimeType: "text/plain",
    });
    const { uri} = fileResult.file;
    console.log(`File uploaded successfully. URI: ${uri}`);
    return fileResult;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

async function waitForFileProcessing(fileManager, name) {
  try {
    let file = await fileManager.getFile(name);
    while (file.state === FileState.PROCESSING) {
      console.log("Waiting for file to be processed.");
      await new Promise((resolve) => setTimeout(resolve, 2_000));
      file = await fileManager.getFile(name);
    }
    console.log(`File processing complete: ${file.uri}`);
    return file;
  } catch (error) {
    console.error("Error waiting for file processing:", error);
    throw error;
  }
}

async function createCache(fileResult, displayName) {
  try {
    const cacheManager = new GoogleAICacheManager(process.env.GOOGLE_API_KEY);
    const model = "models/gemini-1.5-flash-001";
    const systemInstruction =
      "You are going to be given a text file that contains random 1000-word chunks from books with their names. You have to digest all of them and return the response in markdown. Each time you must give a different response regardless of the query. Be creative.";
    const ttlSeconds = 600;
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
    return cache;
  } catch (error) {
    console.error("Error creating cache:", error);
    throw error;
  }
}

async function generateContent(genModel, query) {
  try {
    const result = await genModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: query,
            },
          ],
        },
      ],
    });
    return result.response.text();
  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
}

async function justFetchThem(genBlog, genQuote) {
  const blog_list = [];
  const quote_list = [];

  for (let i = 0; i < 6; i++) {
    await new Promise((resolve) => setTimeout(resolve, 7000));
    const blog = await genBlog();
    blog_list.push(blog);
  }
  for (let i = 0; i < 20; i++) {
    await new Promise((resolve) => setTimeout(resolve, 7000));
    const quote = await genQuote();
    quote_list.push(quote);
  }

  return [blog_list, quote_list];
}

async function ai_blog_quote_generator(filePath, displayName) {
  try {
    console.log(`Starting AI blog and quote generation for file: ${filePath}`);
    const fileResult = await uploadFile(filePath, displayName);
    const { name } = fileResult.file;

    const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);
    await waitForFileProcessing(fileManager, name);

    const cache = await createCache(fileResult, displayName);
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const genModel = genAI.getGenerativeModelFromCachedContent(cache);

    async function genBlog() {
      console.log("Generating blog content");
      const blog = await generateContent(genModel, BLOG_QUERY);
      console.log("Blog content generated successfully");
      return blog;
    }

    async function genQuote() {
      console.log("Generating quote content");
      const quote = await generateContent(genModel, QUOTE_QUERY);
      console.log("Quote content generated successfully");
      return quote;
    }

    const [blog_list, quote_list] = await justFetchThem(genBlog, genQuote);
    console.log(`Generated ${blog_list.length} blogs and ${quote_list.length} quotes`);
    return [blog_list, quote_list];
  } catch (error) {
    console.error("Error in AI blog and quote generation:", error);
    throw error;
  }
}

module.exports = { ai_blog_quote_generator };
