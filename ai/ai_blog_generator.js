const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  FileState,
  GoogleAICacheManager,
  GoogleAIFileManager,
} = require("@google/generative-ai/server");

const {
  BLOG_GENERATION_TIMER,
  BLOG_QUERY,
  SYSTEM_INSTRUCTIONS,
} = require("../config/config");

const { getPromptGeneratedImageUrl } = require("./image_generation");
const { blogToPromptGeneration } = require("./blog_to_prompt");
const { add_blog } = require("../appwrite/add/add_appwrite");
const { databases, DATABASE_ID, SUBSCRIPTION_QUOTA_COLLECTION_ID } = require("../appwrite/appwrite");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Upload a file to Google AI
async function uploadFile(filePath, displayName) {
  const fileManager = new GoogleAIFileManager(GOOGLE_API_KEY);
  try {
    console.log("Uploading file to Google AI...");
    const fileResult = await fileManager.uploadFile(filePath, {
      displayName,
      mimeType: "text/plain",
    });
    console.log(`File uploaded. URI: ${fileResult.file.uri}`);
    return fileResult;
  } catch (error) {
    console.error("File upload error:", error);
    throw error;
  }
}

// Wait for file processing to complete
async function waitForFileProcessing(fileManager, name) {
  try {
    let file = await fileManager.getFile(name);
    while (file.state === FileState.PROCESSING) {
      console.log("Processing file...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(name);
    }
    console.log("File processed:", file.uri);
    return file;
  } catch (error) {
    console.error("Error during file processing:", error);
    throw error;
  }
}

// Create cache for content generation
async function createCache(fileResult, displayName) {
  const cacheManager = new GoogleAICacheManager(GOOGLE_API_KEY);
  const model = "models/gemini-1.5-flash-001";
  const systemInstruction = SYSTEM_INSTRUCTIONS;

  try {
    return await cacheManager.create({
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
      ttlSeconds: 600,
    });
  } catch (error) {
    console.error("Cache creation error:", error);
    throw error;
  }
}

// Generate content based on a query
async function generateContent(genModel, query) {
  try {
    const result = await genModel.generateContent({
      contents: [{ role: "user", parts: [{ text: query }] }],
    });
    return result.response.text();
  } catch (error) {
    console.error("Content generation error:", error);
    throw error;
  }
}

// Fetch multiple blog posts
async function fetchBlogs({ subscriptionQuota, genBlog, bookEntryId, user_id, count = 6 }) {
  for (let i = 0; i < count; i++) {
    await new Promise((resolve) => setTimeout(resolve, BLOG_GENERATION_TIMER));
    const blog = await genBlog();
    const blog_prompt = await blogToPromptGeneration({ blog_content: blog });
    const blogImageUrl = await getPromptGeneratedImageUrl({
      prompt: blog_prompt,
    });
    console.log(blogImageUrl);
    await add_blog({
      blog, book_id: bookEntryId, user_id,
      blog_image: blogImageUrl,
    });

    /**
     * Updating the subscription quota exactly after uploading each blog
     */
    console.log(`Subscription Quota updated by: ${i + 1} `)
    await databases.updateDocument(DATABASE_ID, SUBSCRIPTION_QUOTA_COLLECTION_ID, subscriptionQuota.$id, {
      blogs_generated: subscriptionQuota.blogs_generated + (i + 1)
    })

    console.log(`Generated/Uploaded ${i + 1} blog successfully`);
  }
}

// Main AI blog generator function
async function ai_blog_generator({ subscriptionQuota, filePath, displayName, bookEntryId, user_id,
}) {
  console.log(`Starting blog generation for file: ${filePath}`);
  const fileResult = await uploadFile(filePath, displayName);
  const { name } = fileResult.file;

  const fileManager = new GoogleAIFileManager(GOOGLE_API_KEY);
  await waitForFileProcessing(fileManager, name);

  const cache = await createCache(fileResult, displayName);
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  const genModel = genAI.getGenerativeModelFromCachedContent(cache);

  const genBlog = async () => {
    console.log("Generating blog content...");
    return await generateContent(genModel, BLOG_QUERY);
  };

  await fetchBlogs({ subscriptionQuota, genBlog, bookEntryId, user_id });
  console.log(`Uploaded all the blogs successfully blogs`);
}

module.exports = { ai_blog_generator };