// import { GoogleAuth } from "google-auth-library";
// import axios from "axios";

// const PROJECT_ID = "lostphoneapp-d88b6";
// // Notification payload
// const message = {
//   message: {
//     token: LATEST_DEVICE_TOKEN,
//     android: {
//       priority: "high",
//       // TTL 0 means deliver immediately
//       ttl: "0s",
//     },
//     data: {
//       command: "capture_photo",
//     },
//   },
// };

// async function sendMessage() {
//   try {
//     // Authenticate using service account
//     const auth = new GoogleAuth({
//       keyFile: "./service-account.json",
//       scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
//     });

//     const client = await auth.getClient();
//     const accessToken = await client.getAccessToken();

//     // Send the FCM message
//     const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
//     const res = await axios.post(url, message, {
//       headers: {
//         Authorization: `Bearer ${accessToken.token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     console.log("Message sent successfully:", res.data);
//   } catch (err) {
//     console.error(
//       "Error sending message:",
//       err.response ? JSON.stringify(err.response.data) : JSON.stringify(err),
//     );
//   }
// }

// sendMessage();

// import express from "express";
// import { GoogleAuth } from "google-auth-library";
// import axios from "axios";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Set EJS as view engine
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// // Path to your downloaded service account JSON
// // const SERVICE_ACCOUNT_FILE = "./service-account.json";
// // Read service account JSON from environment variable
// const SERVICE_ACCOUNT_FILE = JSON.parse(
//   process.env.FIREBASE_SERVICE_ACCOUNT_JSON
// );

// // Your Firebase project ID
// const PROJECT_ID = "lostphoneapp-d88b6";

// // Target device FCM token
// const DEVICE_TOKEN = process.env.DEVICE_FCM_TOKEN;

// // Core FCM sending function
// async function sendFCMMessage(deviceToken, dataPayload) {
//   const auth = new GoogleAuth({
//     keyFile: SERVICE_ACCOUNT_FILE,
//     scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
//   });

//   const client = await auth.getClient();
//   const accessToken = await client.getAccessToken();

//   const message = {
//     message: {
//       token: deviceToken,
//       android: {
//         priority: "high",
//       },
//       data: dataPayload,
//     },
//   };

//   const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

//   const res = await axios.post(url, message, {
//     headers: {
//       Authorization: `Bearer ${accessToken.token}`,
//       "Content-Type": "application/json",
//     },
//   });

//   return res.data;
// }

// // Health check route
// app.get("/health", (req, res) => {
//   res.json({ status: "ok", timestamp: new Date().toISOString() });
// });

// // Home page with form
// app.get("/", (req, res) => {
//   res.render("index", { response: null });
// });

// // Form submission route
// app.post("/send", async (req, res) => {
//   const { command } = req.body;

//   try {
//     // Authenticate using service account
//     const auth = new GoogleAuth({
//       keyFile: SERVICE_ACCOUNT_FILE,
//       scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
//     });

//     const client = await auth.getClient();
//     const accessToken = await client.getAccessToken();
//     const message = {
//       message: {
//         token: DEVICE_TOKEN,
//         android: { priority: "high" },
//         data: {
//           // command: "capture_photo", // 👈 This is what your Android listens for
//           command,
//         },
//       },
//     };

//     // Send the FCM message
//     const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
//     const response = await axios.post(url, message, {
//       headers: {
//         Authorization: `Bearer ${accessToken.token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     console.log("Message sent successfully:", response.data);
//     res.render("index", {
//       response: { success: true, result: response.data },
//     });
//   } catch (err) {
//     console.error(
//       "Error sending message:",
//       err.response ? err.response.data : err
//     );
//     res.render("index", {
//       response: { error: err.response?.data || err.message },
//     });
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Running at http://localhost:${PORT}`));

import express from "express";
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import serviceAccount from "./service-account.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// const serviceAccount = require("./service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

let latestDeviceToken = "";

// Home page
app.get("/", (req, res) => {
  res.render("index", { response: null });
});

// Register token
app.post("/register-token", (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(400).send("No token");

  latestDeviceToken = token;

  console.log("Token saved:", latestDeviceToken);

  res.send("Token stored");
});

// Trigger capture
app.post("/trigger-capture", async (req, res) => {
  if (!latestDeviceToken) {
    return res.render("index", {
      response: { error: "No phone registered yet" },
    });
  }

  try {
    const message = {
      token: latestDeviceToken,
      android: { priority: "high" },
      data: { command: "capture_photo" },
    };

    const result = await admin.messaging().send(message);

    res.render("index", {
      response: {
        success: true,
        result,
      },
    });
  } catch (error) {
    res.render("index", {
      response: { error },
    });
  }
});

app.listen(8080, () => {
  console.log("Server running on port 8080");
});
