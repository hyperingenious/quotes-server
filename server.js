require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils')

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
const { clientAppwriteGET } = require("./routes/client-appwrite/get");
const { invalidateToken } = require("./helpers/helper");
const { get_all_user_subscription, get_all_user_initiated_transations, get_initiated_transaction_by_plink_id } = require("./appwrite/get/get_appwrite");
const { cancel_payment_link, create_payment_link } = require("./razorpay/razorpay");
const { add_initiate_transaction_entry, add_subscriptions_entry } = require("./appwrite/add/add_appwrite");

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
app.post("/generate-content", generateContent);
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

/* Initiate Transaction*/
app.get('/initiate_transaction', async (req, res) => {
  try {
    // const verifiedToken = await invalidateToken({ res, req });
    const verifiedToken = {
      sub: 'user_2oFLUNePrbPyBH1zJL4gV4mn7Kp',
      email: 'skbmasale941@gmail.com'
    }

    const subscription_type = req.query.subscription_type;
    const email = verifiedToken.email; // Get email from verifiedToken

    console.log("Initiate Transaction Request:");

    const { total, documents } = await get_all_user_subscription({ user_id: verifiedToken.sub });

    if (total > 0) {
      console.log("User has existing subscriptions");
      const hasActiveSubscription = documents.some(subscri => {
        const endDate = new Date(subscri.end_date);
        return endDate > new Date();
      });
      if (hasActiveSubscription) {
        console.log("User has an active subscription.");
        return res.status(400).json({ error: "Bad request", message: "You already have an active subscription" });
      }
    } else {
      console.log("User has no existing subscriptions.");
    }

    const { total: total_2, documents: documents_2 } = await get_all_user_initiated_transations({ user_id: verifiedToken.sub }); // Use verifiedToken.sub
    if (total_2 > 0) {
      console.log("User has existing initiated transactions");
      for (const doc of documents_2) { // Use for...of loop for better readability
        const expireDate = new Date(doc.expire_by);
        if (expireDate > new Date()) {
          console.log("Cancelling existing payment link with plink_id");
          await cancel_payment_link({ plink_id: doc.plink_id });
        }
      }
    } else {
      console.log("User has no existing initiated transactions.");
    }

    console.log("Creating payment link...");
    const payment_metadata = await create_payment_link({ email, subscription_type });
    console.log("Payment link created successfully");

    console.log("Adding initiate transaction entry...");
    await add_initiate_transaction_entry({
      amount: payment_metadata.amount,
      currency: payment_metadata.currency,
      expire_by: new Date(payment_metadata.expire_by),
      user_id: verifiedToken.sub,
      subscription_type, // Assuming subscription_id is not available here.  Add if available.
      plink_id: payment_metadata.id,
    });
    console.log("Initiate transaction entry added successfully.");

    console.log("Returning payment link details.");
    res.status(200).json({ currency: payment_metadata.currency, payment_link: payment_metadata.short_url, amount: payment_metadata.amount, expire_by: payment_metadata.expire_by });

    return;
  } catch (error) {
    console.error("Error in /initiate_transaction:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post('/razorpay-webhook-endpoint', async (req, res) => {
  try {
    const webhookBody = req.body;
    const webhookSignature = req.headers['x-razorpay-signature'];

    // Validate webhook signature.  The validateWebhookSignature function needs to be defined elsewhere.
    const isValid = validateWebhookSignature(JSON.stringify(webhookBody), webhookSignature, '9g2rT5C4FA9oKOwFn/CcKk5yMO/BOYBWOr52LIoappY0hCbK8RrQpF')

    if (!isValid || webhookBody.event !== 'payment_link.paid') {
      console.log("Invalid webhook signature or event type.");
      return res.status(400).json({ error: "Bad Request" }); // Return a proper response for invalid requests.
    }

    const paymentLinkEntity = webhookBody.payment_link.entity;
    const paymentEntity = webhookBody.payload.payment.entity;

    const document = await get_initiated_transaction_by_plink_id({ plink_id: paymentLinkEntity.id }); //Make this call async

    if (!document) {
      console.log("Initiated transaction not found for payment link ID:", paymentLinkEntity.id);
      return res.status(404).json({ error: "Not Found" }); // Return 404 if document not found.
    }

    const start_date = new Date(paymentEntity.created_at);
    const end_date = new Date(start_date);
    end_date.setDate(start_date.getDate() + 30);


    await add_subscriptions_entry({
      payment_id: paymentEntity.id,
      user_id: document.user_id,
      subscription_type: document.subscription_type,
      start_date,
      end_date,
      payment_method: paymentEntity.method,
      amount: paymentEntity.amount,
      currency: paymentEntity.currency
    });

    console.log("Subscription entry added successfully.");
    return;  // Return success response

  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
  }
});

// Basic route
app.get("/", (_, res) => {
  res.send("<h1>Hello World</h1>");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
