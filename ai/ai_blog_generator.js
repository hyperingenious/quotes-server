// Import necessary modules from Google Generative AI SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  FileState,
  GoogleAICacheManager,
  GoogleAIFileManager,
} = require("@google/generative-ai/server");
const {
  QUOTE_GENERATION_TIMER,
  BLOG_GENERATION_TIMER,
  BLOG_QUERY,
  QUOTE_QUERY,
} = require("../config/config");

// Upload a file to Google AI and return the result
async function uploadFile(filePath, displayName) {
  try {
    const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);
    console.log("Uploading file to Google AI");

    // Upload the file with specified display name and MIME type
    const fileResult = await fileManager.uploadFile(filePath, {
      displayName,
      mimeType: "text/plain",
    });

    const { uri } = fileResult.file;
    console.log(`File uploaded successfully. URI: ${uri}`);
    return fileResult;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error; // Rethrow error for handling further up the call stack
  }
}

// Wait for the file to be processed and return the file details
async function waitForFileProcessing(fileManager, name) {
  try {
    let file = await fileManager.getFile(name); // Get the initial file state
    // Loop until the file is no longer processing
    while (file.state === FileState.PROCESSING) {
      console.log("Waiting for file to be processed.");
      await new Promise((resolve) => setTimeout(resolve, 2_000)); // Wait for 2 seconds
      file = await fileManager.getFile(name); // Check the file state again
    }
    console.log(`File processing complete: ${file.uri}`);
    return file; // Return the processed file
  } catch (error) {
    console.error("Error waiting for file processing:", error);
    throw error; // Rethrow error for further handling
  }
}

// Create a cache for generated content using the uploaded file
async function createCache(fileResult, displayName) {
  try {
    const cacheManager = new GoogleAICacheManager(process.env.GOOGLE_API_KEY);
    const model = "models/gemini-1.5-flash-001"; // Specify the model to use
    const systemInstruction =
      "You are going to be given a text file that contains random 1000-word chunks from books with their names. You have to digest all of them and return the response in markdown. Each time you must give a different response regardless of the query. Be creative.";
    const ttlSeconds = 600; // Time-to-live for cache in seconds

    // Create cache with specified parameters
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
    return cache; // Return the created cache
  } catch (error) {
    console.error("Error creating cache:", error);
    throw error; // Rethrow error for further handling
  }
}

// Generate content based on a query using the generative model
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
    return result.response.text(); // Return the generated text response
  } catch (error) {
    console.error("Error generating content:", error);
    throw error; // Rethrow error for further handling
  }
}

// Fetch a list of blogs and quotes based on defined timers
async function justFetchThem(genBlog) {
  try {
    const blog_list = []; // Array to store generated blogs

    // Generate 6 blogs
    for (let i = 0; i < 6; i++) {
      await new Promise((resolve) =>
        setTimeout(resolve, BLOG_GENERATION_TIMER)
      ); // Wait before next request
      const blog = await genBlog(); // Generate blog content
      blog_list.push(blog); // Add generated blog to the list
    }

    return [blog_list]; // Return both lists
  } catch (error) {
    throw error;
  }
}

// Main function to generate blogs and quotes based on an uploaded file
async function ai_blog_generator(filePath, displayName) {
  try {
    console.log(`Starting AI blog and quote generation for file: ${filePath}`);
    const fileResult = await uploadFile(filePath, displayName); // Upload file
    const { name } = fileResult.file;

    const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY);
    await waitForFileProcessing(fileManager, name); // Wait for file to be processed

    const cache = await createCache(fileResult, displayName); // Create cache from uploaded file
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const genModel = genAI.getGenerativeModelFromCachedContent(cache); // Get generative model from cache

    // Function to generate blog content
    async function genBlog() {
      try {
        console.log("Generating blog content");
        const blog = await generateContent(genModel, BLOG_QUERY); // Generate blog content
        console.log("Blog content generated successfully");
        return blog; // Return the generated blog
      } catch (error) {
        throw error;
      }
    }

    // Fetch both blogs and quotes
    const [blog_list] = await justFetchThem(genBlog);
    console.log(`Generated ${blog_list.length} blogs`);
    return [blog_list]; // Return both lists
  } catch (error) {
    console.error("Error in AI blog generation:", error);
    throw error; // Rethrow error for further handling
  }
}

// Export the main function for use in other modules
module.exports = { ai_blog_generator };
