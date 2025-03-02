require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function blogToPromptGeneration({ blog_content }) {
  console.log("Generating prompt...");
  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Revised instruction for more image-friendly output
    const prompt = `Extract key visual elements from this blog and generate a concise, highly descriptive prompt (under 10 words) suitable for AI image generation. 
Ensure the generated prompt: 
1. Strictly avoids violence, explicit content, weapons, distressing themes, and unsafe words.
2. Uses neutral, artistic, or natural descriptors** to prevent misinterpretation.
3. Frames all subjects positively to avoid conflict, fear, or negative sentiment.
4. Maintains clarity while avoiding vague or abstract wording that could be flagged.
5. Ensures compliance with AI safety guidelines while preserving creativity.

Blog Content: ${blog_content}`;


    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }
}

module.exports = {
  blogToPromptGeneration,
};
