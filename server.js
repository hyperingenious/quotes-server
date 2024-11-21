require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const { upload_pdf_route } = require("./routes/upload");
const { startup } = require("./startup/startup");
const { generateContent } = require("./routes/generate_content");
const { deleteContent } = require("./routes/delete_content");
const {
  get_all_deletion_entries,
  delete_blog_by_id,
  delete_chunk_by_id,
  delete_file_by_id,
  delet_deletion_entry,
} = require("./appwrite/appwrite");
const { CONTENT_DELETION_GAP } = require("./config/config");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize application
startup();

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://purplenight.vercel.app",
  "https://hyperingenious.tech",
  "https://purplenight.hyperingenious.tech",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.use(express.json());

// Function to delete chunks and blogs
async function processDeletion(entry) {
  try {
    const chunk_ids = JSON.parse(entry.chunk_ids);
    const blog_ids = JSON.parse(entry.blog_ids);
    const file_id = entry.file_id;

    console.log(`Starting deletion process for file with ID: ${file_id}`);
    await delete_file_by_id(file_id);
    console.log(`File with ID: ${file_id} deleted successfully.`);

    await deleteChunks(chunk_ids, file_id);
    await deleteBlogs(blog_ids, file_id);
    await delet_deletion_entry(entry.$id);
    console.log(`Deletion process completed for file with ID: ${file_id}`);
  } catch (error) {
    console.error(
      `Error processing deletion for entry ID: ${entry.$id}`,
      error
    );
  }
}

// Function to delete chunks
async function deleteChunks(chunk_ids, file_id) {
  try {
    if (chunk_ids && chunk_ids.length > 0) {
      for (const chunk_id of chunk_ids) {
        console.log(
          `Deleting chunk with ID: ${chunk_id} for file ID: ${file_id}`
        );
        await delete_chunk_by_id(chunk_id);
        console.log(`Chunk with ID: ${chunk_id} deleted.`);
        // Uncomment the following line for a delay
        await new Promise((resolve) =>
          setTimeout(resolve, CONTENT_DELETION_GAP)
        );
      }
    } else {
      console.log(`No chunks to delete for file ID: ${file_id}`);
    }
  } catch (error) {
    console.error(`Error deleting chunks for file ID: ${file_id}`, error);
  }
}

// Function to delete blogs
async function deleteBlogs(blog_ids, file_id) {
  try {
    if (blog_ids && blog_ids.length > 0) {
      for (const blog_id of blog_ids) {
        console.log(
          `Deleting blog with ID: ${blog_id} for file ID: ${file_id}`
        );
        await delete_blog_by_id(blog_id);
        console.log(`Blog with ID: ${blog_id} deleted.`);
        // Uncomment the following line for a delay
        await new Promise((resolve) =>
          setTimeout(resolve, CONTENT_DELETION_GAP)
        );
      }
    } else {
      console.log(`No blogs to delete for file ID: ${file_id}`);
    }
  } catch (error) {
    console.error(`Error deleting blogs for file ID: ${file_id}`, error);
  }
}

// Runs from 12am to 6am
cron.schedule("0 0-6 * * *", async () => {
  try {
    const deletion_entries = await get_all_deletion_entries();

    if (deletion_entries.length < 1) {
      console.log("No deletion entries found.");
      return;
    }

    for (const entry of deletion_entries) {
      console.log(`Processing entry: ${JSON.stringify(entry)}`);
      await processDeletion(entry);
    }
  } catch (error) {
    console.error("Error in cron job execution:", error);
  }
});

// Route definitions
app.post("/upload", upload_pdf_route);
app.post("/generate-content", generateContent);
app.post("/delete-content", deleteContent);

// Basic route
app.get("/", (_, res) => {
  res.send("<h1>Hello World</h1>");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
