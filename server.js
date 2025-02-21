require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { default: axios } = require("axios");

const { startup } = require("./startup/startup");
const { cronjob } = require("./cron/cronjob");


const { upload_pdf_route } = require("./routes/upload");
const { generateContent } = require("./routes/generate_content");
const { deleteContent } = require("./routes/delete_content");
const feedback = require("./routes/feedback");
const { getSubscription } = require("./routes/get_subscription");
const tokenPlan = require("./routes/get_token_plan");


const { userSubscriptionQuota } = require("./middlewares/user_subscription_quota");
const invalidateJwt = require("./middlewares/invalidate_jwt");
const saveFiles = require('./middlewares/saveFiles')

const { verifyToken } = require("./routes/cli/verify_token");
const { dataDeletion } = require("./routes/cli/data_deletion");
const { DataUpdate } = require("./routes/cli/update_blogs");
const { get_content } = require("./routes/cli/get_content");

const { clientAppwritePOST } = require("./routes/client-appwrite/post");
const { clientAppwriteGET, publicClientAppwriteGET } = require("./routes/client-appwrite/get");

const { initiateTransaction } = require("./routes/razorpay/intiate_transaction");
const { razorpayWebhookEndpoint } = require("./routes/razorpay/webhook-endpoint");
const { invalidateToken } = require("./helpers/helper");
const checkBlogCount = require("./middlewares/checkBlogCount");
const invalidateSubscription = require("./middlewares/invalidateSubscription");
const checkFileSize = require("./middlewares/checkFileSize");
const checkFileMimetype = require("./middlewares/checkFileMimetype");
const uploadPDFRouteNew = require("./routes/upload_pdf_route_new");

const app = express();
const PORT = process.env.PORT || 3000;
const SELF_HOSTED_URL = process.env.SELF_HOSTED_URL;

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
app.use(
  cors({
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json());

// Runs from 12am to 6am
cronjob("*/10 0-5 * * *")

// Route definitions
app.post("/upload", invalidateToken, userSubscriptionQuota, upload_pdf_route);
app.post('/new-upload', invalidateJwt, invalidateSubscription, checkBlogCount, checkFileSize, saveFiles, checkFileMimetype, uploadPDFRouteNew)
app.post("/generate-content", userSubscriptionQuota, generateContent);
app.post("/delete-content", deleteContent);
app.post("/feedback", feedback);

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
app.post('/initiate-transaction', initiateTransaction);
app.post('/razorpay-webhook-endpoint', razorpayWebhookEndpoint);

app.get('/get-subscription', getSubscription);
app.post('/get-token-plan', invalidateJwt, tokenPlan)

// Basic route
app.get("/", (_, res) => {
  res.send("<h1>Hello World</h1>");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
