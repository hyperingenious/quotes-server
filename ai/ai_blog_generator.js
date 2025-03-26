const {
  FileState,
  GoogleAIFileManager,
} = require("@google/generative-ai/server");

const {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
}
  = require("@google/genai")

const {
  BLOG_GENERATION_TIMER,
  BLOG_QUERY,
  SYSTEM_INSTRUCTIONS,
  BLOG_QUERY_NO_REPEAT,
} = require("../config/config");

const { add_blog } = require("../appwrite/add/add_appwrite");
const { databases, DATABASE_ID, SUBSCRIPTION_QUOTA_COLLECTION_ID } = require("../appwrite/appwrite");
const { get_a_image_link } = require("../helpers/brute");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });
let generatedBlogTitles = [];


async function fetchBlogs({ subscriptionQuota, genBlog, bookEntryId, user_id, count = 6, subscription }) {
  try {
    for (let i = 0; i < count; i++) {
      await new Promise((resolve) => setTimeout(resolve, BLOG_GENERATION_TIMER));
      let blog;

      try {
        blog = await genBlog();
      } catch (error) {
        console.error(`Failed to generate blog ${i + 1}:`, error.message || error);
        blog = "[Placeholder blog due to temporary error - AI service unavailable]";
      }

      const blogImageUrl = get_a_image_link();

      await add_blog({
        blog,
        book_id: bookEntryId,
        user_id,
        blog_image: blogImageUrl,
      });

      if (subscription !== "unpaid") {
        console.log(`Subscription Quota updated by: ${i + 1}`);
        await databases.updateDocument(DATABASE_ID, SUBSCRIPTION_QUOTA_COLLECTION_ID, subscriptionQuota.$id, {
          blogs_generated: subscriptionQuota.blogs_generated + (i + 1),
        });
        console.log(`Generated/Uploaded ${i + 1} blog successfully`);
      }
    }
  } catch (error) {
    console.error("fetchBlogs encountered an unexpected error:", error.message || error);
    throw error; // Still throw if something else breaks, like Appwrite failing
  }
}

async function ai_blog_generator({ subscriptionQuota, filePath, bookEntryId, user_id, subscription }) {
  try {
    const doc = await ai.files.upload({
      file: filePath,
      config: { mimeType: "text/plain" },
    });
    console.log("Uploaded file name:", doc.name);

    const modelName = "gemini-1.5-flash-002";
    const systemInstruction = SYSTEM_INSTRUCTIONS;
    const query = BLOG_QUERY;
    const noRepeatBlogQuery = BLOG_QUERY_NO_REPEAT;


    const cache = await ai.caches.create({
      model: modelName,
      config: {
        contents: createUserContent(createPartFromUri(doc.uri, doc.mimeType)),
        systemInstruction,
      },
    });

    console.log("Cache created:", cache);

    const genBlog = async () => {
      const modifedQueryToPreventBlogRepetetion = generatedBlogTitles.length === 0 ? query : `${noRepeatBlogQuery}${generatedBlogTitles.join('|')}`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: modifedQueryToPreventBlogRepetetion,
        config: { cachedContent: cache.name },
      });

      const blog = response.text;
      generatedBlogTitles.push(blog.substring(0, 70))
      return blog;
    }

    await fetchBlogs({ genBlog, user_id, bookEntryId, subscription, subscriptionQuota })

    await ai.caches.delete({ name: cache.name });
    console.log('Cache deleted successfully!!')

  } catch (error) {
    console.error("ai_blog_generator failed:", error.message || error);
    throw error;
  }
}

module.exports = { ai_blog_generator };
