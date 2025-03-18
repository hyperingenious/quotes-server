require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function blogToKeywordsPrompt({ blog_content }) {
  console.log("Generating keywords...");
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Revised instruction for more image-friendly output
    const prompt = `Using the below blog content make a string of keywords comma seprated keywords which can be given to a LLM to generate images, such that the image match the context of blog:
Blog Content: ${blog_content}`;


    const result = await model.generateContent(prompt);
    const keywords = result.response.text().split(', ')

    return keywords;
  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }
}

module.exports = {
  blogToKeywordsPrompt
}
