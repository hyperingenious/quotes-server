require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { upload_pdf_route } = require("./routes/upload");
const { startup } = require("./startup/startup");
const { generateContent } = require("./routes/generate_content");
const { deleteContent } = require("./routes/delete_content");

const { default: axios } = require("axios");
const { verifyToken } = require("./routes/cli/verify_token");
const { dataDeletion } = require("./routes/cli/data_deletion");
const { DataUpdate } = require("./routes/cli/update_blogs");
const { get_content } = require("./routes/cli/get_content");
const { cronjob } = require("./cron/cronjob");
const { clientAppwritePOST } = require("./routes/client-appwrite/post");
const { clientAppwriteGET, publicClientAppwriteGET } = require("./routes/client-appwrite/get");
const { initiateTransaction } = require("./routes/razorpay/intiate_transaction");
const { razorpayWebhookEndpoint } = require("./routes/razorpay/webhook-endpoint");

const { getSubscription } = require("./routes/get_subscription");
const { userSubscriptionQuota } = require("./middlewares/user_subscription_quota");

const app = express();
const PORT = process.env.PORT || 3000;
const SELF_HOSTED_URL = "https://quotes-server-z2fk.onrender.com/";

// Ping the app every 10 minutes (10 * 60 * 1000 ms)
setInterval(() => {
  axios
    .get(SELF_HOSTED_URL)
    .then(() => console.log(`Self-pinged ${SELF_HOSTED_URL} successfully`))
    .catch((error) => console.error("Self-ping failed:", error.message));
}, 10 * 60 * 1000); // Adjust interval as needed

// Initialize application
startup();

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
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

// Runs from 12am to 6am
cronjob("*/10 0-5 * * *")

// Route definitions
app.post("/upload", upload_pdf_route);
app.post("/generate-content", userSubscriptionQuota, generateContent);
app.post("/delete-content", deleteContent);

// CLI
app.post("/cli/verify-token", verifyToken);
app.post("/cli/delete", dataDeletion);
app.post("/cli/update-blogs", DataUpdate);
app.post("/cli/generate-content", generateContent)
app.post("/cli/get-content", get_content)

/* Appwrite Client POST & GET */
app.post("/client-appwrite-post", clientAppwritePOST)
app.get("/client-appwrite-get", clientAppwriteGET)
app.get("/public-client-appwrite-get", publicClientAppwriteGET)

/* Initiate Transaction*/
app.get('/initiate-transaction', initiateTransaction);
app.post('/razorpay-webhook-endpoint', razorpayWebhookEndpoint);

app.get('/get-subscription', getSubscription);

// Basic route
app.get("/", (_, res) => {
  res.send("<h1>Hello World</h1>");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
