import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Octokit } from "@octokit/rest";
import nodemailer from "nodemailer";
import multer from "multer";
import Stripe from "stripe";
import { GoogleGenAI } from "@google/genai";
import { products as localProducts } from "./EDIT_PRODUCT_DATA_HERE.ts";

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Initialize Firebase Admin
let db: admin.firestore.Firestore;

try {
  const rootPath = path.join(process.cwd(), 'firebase-applet-config.json');
  const distPath = path.join(process.cwd(), 'dist', 'firebase-applet-config.json');
  const configPath = fs.existsSync(rootPath) ? rootPath : fs.existsSync(distPath) ? distPath : null;

  let config: any = null;
  if (configPath) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  if (!admin.apps.length) {
    if (config) {
      admin.initializeApp({
        projectId: config.projectId
      });
      console.log(`Firebase Admin initialized for project: ${config.projectId}`);
    } else {
      admin.initializeApp();
      console.log("Firebase Admin initialized with default environment (no config file found)");
    }
  }

  const dbId = config?.firestoreDatabaseId;
  if (dbId && dbId !== '(default)') {
    db = getFirestore(admin.app(), dbId);
    console.log(`Targeting named database: ${dbId}`);
  } else {
    db = getFirestore(admin.app());
    console.log("Targeting default database");
  }
} catch (err) {
  console.error("CRITICAL: Firebase Admin failed to initialize:", err);
  throw err;
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Helper to sync Stripe products
async function syncStripeProducts(throwOnMissing: boolean = false) {
  if (!stripe) {
    if (throwOnMissing) {
      throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.");
    }
    console.warn("Stripe is not configured (STRIPE_SECRET_KEY is missing). Skipping Stripe product synchronization.");
    return;
  }
  try {
    const [products, paymentLinks] = await Promise.all([
      stripe.products.list({ active: true, expand: ['data.default_price'] }),
      stripe.paymentLinks.list({ active: true, expand: ['data.line_items'] })
    ]);

    const productsRef = db.collection('products');

    for (const sp of products.data) {
      const price = (sp.default_price as Stripe.Price)?.unit_amount ? (sp.default_price as Stripe.Price).unit_amount! / 100 : 0;
      
      const link = paymentLinks.data.find(pl => 
        pl.line_items?.data.some(li => li.price?.product === sp.id)
      );

      const snapshot = await productsRef.where('stripe_product_id', '==', sp.id).get();
      
      const productData = {
        name: sp.name,
        description: sp.description || '',
        price: price,
        stripe_product_id: sp.id,
        is_visible: true,
        category: 'STRIPE_SYNC',
        images: sp.images && sp.images.length > 0 ? sp.images.map(url => ({ url, type: 'image' })) : [],
        stripe_payment_link: link?.url || '',
        stripe_buy_button_id: link?.id || '',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        await productsRef.doc(docId).update(productData);
      } else {
        await productsRef.add({
          ...productData,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error: any) {
    if (throwOnMissing) {
      throw error;
    }
    // Silent catch on background sync
  }
}

// Deriving path info robustly across ESM and CommonJS
const getFilename = () => {
  try {
    if (typeof __filename !== 'undefined') return __filename;
  } catch (e) {}
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return fileURLToPath(import.meta.url);
    }
  } catch (e) {}
  return '';
};

const getDirname = () => {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
  } catch (e) {}
  const filename = getFilename();
  if (filename) return path.dirname(filename);
  return process.cwd();
};

const _filename = getFilename();
const _dirname = getDirname();

const ADMIN_PASSWORD = "Judy00736121!";

// GitHub OAuth Config
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Email Config
const SMTP_HOST = process.env.SMTP_HOST?.trim();
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER?.trim();
const SMTP_PASS = process.env.SMTP_PASS?.trim();
const SMTP_FROM = process.env.SMTP_FROM?.trim() || SMTP_USER || "";
const ADMIN_EMAIL = "judylee2000s@gmail.com";
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL?.trim();

// Validation: Ensure host is not a placeholder and looks like a real hostname
const isValidHost = SMTP_HOST && 
                   SMTP_HOST.length > 1 && 
                   !SMTP_HOST.includes('MY_') && 
                   (SMTP_HOST.includes('.') || SMTP_HOST === 'localhost');

const transporter = (isValidHost && SMTP_USER && SMTP_PASS) ? nodemailer.createTransport({
  ...(SMTP_HOST?.includes('gmail.com') ? { service: 'gmail' } : {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
  }),
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
}) : null;

async function sendOrderEmails(orderId: string, orderData: any) {
  const { customer_name, customer_email, customer_address, customer_phone, total_amount, items, payment_method } = orderData;
  
  const itemsHtml = items.map((item: any) => `
    <li>${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>
  `).join("");

  const emailBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
      <h1 style="border-bottom: 2px solid #000; padding-bottom: 10px;">Order Confirmation #${orderId}</h1>
      <p>Thank you for your order, <strong>${customer_name}</strong>!</p>
      <p><strong>Total Amount:</strong> $${total_amount.toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${payment_method}</p>
      <div style="background: #f9f9f9; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Shipping Details:</h3>
        <p style="margin-bottom: 0;">${customer_address}</p>
        <p style="margin-top: 5px;">Phone: ${customer_phone}</p>
      </div>
      <h3>Items:</h3>
      <ul>${itemsHtml}</ul>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">We are processing your order and will notify you once it has been dispatched.</p>
    </div>
  `;

  const adminBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #000; padding: 20px;">
      <h1 style="background: #000; color: #fff; padding: 10px; margin: -20px -20px 20px -20px;">NEW ORDER RECEIVED #${orderId}</h1>
      <p><strong>Customer:</strong> ${customer_name} (<a href="mailto:${customer_email}">${customer_email}</a>)</p>
      <p><strong>Total:</strong> $${total_amount.toFixed(2)}</p>
      <p><strong>Payment:</strong> ${payment_method}</p>
      <div style="background: #eee; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Shipping Address:</h3>
        <p style="margin-bottom: 0;">${customer_address}</p>
        <p style="margin-top: 5px;">Phone: ${customer_phone}</p>
      </div>
      <h3>Items Ordered:</h3>
      <ul>${itemsHtml}</ul>
      <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
      <p><a href="${process.env.APP_URL || 'http://localhost:3000'}/admin" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold;">OPEN ADMIN DASHBOARD</a></p>
    </div>
  `;

  try {
    if (transporter && SMTP_FROM) {
      // Send to Customer
      await transporter.sendMail({
        from: `"Composure Store" <${SMTP_FROM}>`,
        to: customer_email,
        subject: `Order Confirmation #${orderId} - Composure`,
        html: emailBody,
      });

      // Send to Admin
      await transporter.sendMail({
        from: `"Composure Store" <${SMTP_FROM}>`,
        to: ADMIN_EMAIL,
        subject: `NEW ORDER #${orderId} from ${customer_name}`,
        html: adminBody,
      });
      console.log(`Emails sent for order #${orderId} to ${customer_email} and ${ADMIN_EMAIL}`);
    } else {
      console.warn("SMTP credentials not configured. Skipping real email sending.");
      console.log("--- MOCK EMAIL TO CUSTOMER ---");
      console.log(emailBody);
      console.log("--- MOCK EMAIL TO ADMIN ---");
      console.log(adminBody);
    }
  } catch (error) {
    console.error("Failed to send emails:", error);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Customer Service Agent Chat Endpoint (Powered by Gemini)
  app.post("/api/customer-service/chat", async (req: express.Request, res: express.Response) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message string is required" });
      }

      const ai = getGenAI();
      let replyText = "";

      if (ai) {
        const systemInstruction = `You are D3COMPOSURE's official 24/7 Customer Service AI Concierge.
D3COMPOSURE is a minimalist, high-end luxury streetwear brand and design studio.
Knowledge Base & Store Specs:
- Garments: Heavyweight oversized hoodies, t-shirts, track pants, and custom physical artifacts.
- Fabric & Quality: 100% Portuguese organic heavy cotton (400+ GSM), brushed fleece lining, reinforced ribbing.
- Production & Shipping: Made to order in Portugal. Worldwide insured tracked shipping takes approx 2 weeks.
- Returns: 14-day hassle-free return policy for unworn items with tags.
- Order Tracking: Customers can track live status anytime via the Order Tracking section in the site menu.
- Store Support: Ready to assist with sizing guides, order inquiries, material care, and custom orders.

Provide warm, elegant, clear, and direct customer assistance. Keep responses concise (2-4 sentences max) unless detailed information is explicitly requested.`;

        const contents: any[] = [];
        if (Array.isArray(history) && history.length > 0) {
          history.forEach((h: { sender: string; text: string }) => {
            contents.push({
              role: h.sender === 'user' ? 'user' : 'model',
              parts: [{ text: h.text }]
            });
          });
        }
        contents.push({ role: 'user', parts: [{ text: message }] });

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });

        replyText = response.text || "Thank you for reaching out to D3COMPOSURE Customer Care. How else can I assist you with your order today?";
      } else {
        const lower = message.toLowerCase();
        if (lower.includes('ship') || lower.includes('deliver') || lower.includes('time') || lower.includes('arrival')) {
          replyText = "All D3COMPOSURE garments are handcrafted to order in Portugal. Delivery typically takes up to 2 weeks with worldwide insured tracking.";
        } else if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
          replyText = "We offer a 14-day return window from receipt of your order. Garments must be in original unworn condition with tags intact.";
        } else if (lower.includes('size') || lower.includes('fit') || lower.includes('measurement')) {
          replyText = "Our garments feature an architectural oversized drape. We recommend your true size for our signature relaxed fit, or sizing down for a closer fit.";
        } else if (lower.includes('material') || lower.includes('cotton') || lower.includes('fabric')) {
          replyText = "Each artifact is crafted from 100% Portuguese organic heavy cotton with a custom brushed fleece interior for structure and longevity.";
        } else if (lower.includes('track') || lower.includes('order')) {
          replyText = "You can track your order live anytime by entering your Order ID in the Order Tracking tool in the site header menu.";
        } else {
          replyText = "Welcome to D3COMPOSURE Customer Concierge. I am available 24/7 to answer questions about orders, shipping, sizing, and materials. How may I assist you today?";
        }
      }

      return res.json({ text: replyText });
    } catch (err: any) {
      console.error("Customer service endpoint error:", err);
      return res.status(500).json({ 
        error: "Failed to process request",
        text: "Our concierge server experienced a momentary hiccup. Please try again or ask any question about your order!" 
      });
    }
  });

  // Authentication Middleware
  const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const adminPassword = req.headers['x-admin-password'];

    // Allow if admin password is provided (for local admin session)
    if (adminPassword === ADMIN_PASSWORD) {
      return next();
    }

    // Allow if valid Firebase ID token is provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (decodedToken.admin || decodedToken.email === "judylee2000s@gmail.com") {
          return next();
        }
      } catch (error) {
        console.error("Token verification failed:", error);
      }
    }

    res.status(401).json({ error: "Unauthorized access" });
  };

  // Automatically sync with EDIT_PRODUCT_DATA_HERE.ts on startup
  async function syncWithLocalFile() {
    console.log("Starting synchronization with EDIT_PRODUCT_DATA_HERE.ts...");
    try {
      const productsRef = db.collection('products');
      const snapshot = await productsRef.get();
      const productNamesInFile = localProducts.map(p => p.name);

      // 1. Remove products that are NOT in the file
      let removedCount = 0;
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!productNamesInFile.includes(data.name)) {
          await productsRef.doc(doc.id).delete();
          removedCount++;
        }
      }
      if (removedCount > 0) console.log(`Removed ${removedCount} outdated products.`);

      // 2. Add or Update products from the file
      let syncCount = 0;
      for (const p of localProducts) {
        try {
          const existing = await productsRef.where('name', '==', p.name).get();
          if (existing.empty) {
            await productsRef.add({
              ...p,
              created_at: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            const docId = existing.docs[0].id;
            await productsRef.doc(docId).set({
              ...p,
              updated_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          }
          syncCount++;
        } catch (itemErr) {
          console.error(`Failed to sync product "${p.name}":`, itemErr);
          // Continue with next product
        }
      }
      console.log(`Synchronization complete! ${syncCount} products are now live.`);

      // Clean up unwanted announcements from database
      try {
        const announcementsRef = db.collection('announcements');
        const snap = await announcementsRef.get();
        let deletedAnnCount = 0;
        for (const doc of snap.docs) {
          const text = (doc.data().text || '').toUpperCase();
          if (text.includes("ARCHIVAL ARTIFACT 16") || text.includes("ARCHIVAL ARTIFACT 13") || text.includes("LIMITED EDITION INDUCTION")) {
            await announcementsRef.doc(doc.id).delete();
            deletedAnnCount++;
          }
        }
        if (deletedAnnCount > 0) {
          console.log(`Successfully deleted ${deletedAnnCount} matching announcements from database.`);
        }
      } catch (annError) {
        console.warn("Could not delete matching announcements from database (using fallback filters instead):", annError);
      }
    } catch (err: any) {
      if (err.message?.includes('PERMISSION_DENIED') || err.code === 7) {
        console.warn("Auto-synchronization skipped: Firebase Admin SDK lacks sufficient permissions for project 'gen-lang-client-0727251231'. Using offline/local product fallback from EDIT_PRODUCT_DATA_HERE.ts.");
      } else {
        console.warn("Auto-synchronization failed:", err.message || err);
      }
      // We don't throw here to avoid crashing the server on startup
      // if there's a temporary permission or network issue.
    }
  }

  // Initial Sync
  syncWithLocalFile();

  app.post("/api/admin/sync-file", authMiddleware, async (req, res) => {
    try {
      await syncWithLocalFile();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ensure static asset directories exist
  const publicDir = path.join(process.cwd(), "public");
  const uploadsDir = path.join(publicDir, "uploads");
  const assetsDir = path.join(publicDir, "assets");
  const imagesDir = path.join(assetsDir, "images");

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

  // Configure Multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });

  // Serve static files with permissive fallback
  app.use("/uploads", express.static(uploadsDir));
  app.use("/assets/images", express.static(imagesDir));
  app.use("/assets", express.static(assetsDir));
  app.use(express.static(publicDir));

  // Direct image route fallback for URL-encoded and alternate paths
  app.get(["/assets/images/:filename", "/uploads/:filename", "/:filename"], (req, res, next) => {
    const filename = req.params.filename;
    if (!filename || !filename.match(/\.(png|jpg|jpeg|webp|gif|svg|mp4|webm)$/i)) {
      return next();
    }
    const sanitized = filename.replace(/ /g, '_').replace(/:/g, '_');
    const candidates = [
      path.join(imagesDir, filename),
      path.join(imagesDir, sanitized),
      path.join(uploadsDir, filename),
      path.join(uploadsDir, sanitized),
      path.join(publicDir, filename),
      path.join(publicDir, sanitized),
      path.join(imagesDir, "IMG_4800_1_3.png"),
      path.join(imagesDir, "black_hoodie_tracksuit.jpg")
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }
    next();
  });


  app.post("/api/auth/token", async (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      try {
        const customToken = await admin.auth().createCustomToken("admin-user", { admin: true });
        res.json({ token: customToken });
      } catch (error: any) {
        const isIamError = error.code === 'auth/insufficient-permission' || error.message.includes('IAM Service Account Credentials API');
        
        if (!isIamError) {
          console.error("Failed to create custom token:", error);
        } else {
          console.warn("IAM Service Account Credentials API is disabled. Falling back to local admin session.");
        }

        // If IAM API is disabled, we can't create custom tokens.
        // We'll return a success flag and the frontend will have to handle local admin state.
        if (isIamError) {
          res.json({ 
            success: true, 
            message: "IAM_API_DISABLED", 
            note: "Please use Google Login for full Firebase Auth integration, or continue with local admin session." 
          });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
      }
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  // Public Submission Endpoint
  app.post("/api/submissions", async (req, res) => {
    try {
      const { data } = req.body;
      
      // Force specific fields for security
      const submissionData = {
        ...data,
        is_visible: false,
        is_user_submitted: true,
        status: 'pending',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('products').add(submissionData);
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("SUBMISSION_ERROR:", error);
      res.status(500).json({ error: "SUBMISSION_FAILED" });
    }
  });

  app.post("/api/admin/db/:collection", authMiddleware, async (req, res) => {
    const { collection } = req.params;
    const { id, data } = req.body;
    try {
      if (id) {
        await db.collection(collection).doc(id).set({
          ...data,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        res.json({ success: true, id });
      } else {
        const docRef = await db.collection(collection).add({
          ...data,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ success: true, id: docRef.id });
      }
    } catch (error: any) {
      console.error(`DB error for ${collection}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/db/:collection/:id", authMiddleware, async (req, res) => {
    const { collection, id } = req.params;
    try {
      await db.collection(collection).doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      console.error(`Delete error for ${collection}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/logs/clear", authMiddleware, async (req, res) => {
    try {
      const snapshot = await db.collection('logs').get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/logs", async (req, res) => {
    const { action, message, level, user } = req.body;
    try {
      await db.collection('logs').add({
        action,
        message,
        level,
        user,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/upload", upload.any(), (req, res) => {
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });
    
    const results = files.map(file => ({
      url: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('video/') ? 'video' : 'image'
    }));
    
    res.json(results);
  });

  app.post("/api/admin/sync-stripe", authMiddleware, async (req, res) => {
    try {
      await syncStripeProducts(true);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      stripeConfigured: !!stripe,
      smtpConfigured: !!transporter
    });
  });

  // Image Proxy to reliably fetch and convert external image URLs for Vercel hosting
  app.get("/api/image-proxy", async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).json({ error: "Missing url parameter" });

    try {
      const targetUrl = convertGoogleDriveUrl(rawUrl);
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        return res.redirect(targetUrl);
      }

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` });
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to proxy image" });
    }
  });

  app.get("/api/admin/stripe-data", authMiddleware, async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    try {
      const [products, paymentLinks] = await Promise.all([
        stripe.products.list({ active: true, expand: ['data.default_price'] }),
        stripe.paymentLinks.list({ active: true, expand: ['data.line_items'] })
      ]);

      // Map products to their first active payment link
      const productMap = products.data.map(p => {
        const link = paymentLinks.data.find(pl => 
          pl.line_items?.data.some(li => li.price?.product === p.id)
        );
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          images: p.images,
          price: (p.default_price as Stripe.Price)?.unit_amount ? (p.default_price as Stripe.Price).unit_amount! / 100 : 0,
          payment_link: link?.url || '',
          buy_button_id: link?.id || '' // Using link ID as a proxy for buy button if needed
        };
      });

      res.json(productMap);
    } catch (error: any) {
      console.error("Stripe data fetch failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    
    const { items, customer_email, customer_name, customer_phone, customer_address, discount_code } = req.body;
    
    try {
      const line_items = items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.images && item.images.length > 0 ? [item.images[0].url] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        customer_email,
        return_url: `${process.env.APP_URL || 'http://localhost:3000'}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          discount_code: discount_code || '',
          items: JSON.stringify(items.map((i: any) => ({ id: i.id, quantity: i.quantity, price: i.price, name: i.name })))
        }
      });

      res.json({ id: session.id, clientSecret: session.client_secret });
    } catch (error: any) {
      console.error("Stripe session creation failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/session-status', async (req, res) => {
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
    try {
      const session = await stripe.checkout.sessions.retrieve(req.query.session_id as string);

      if (session.status === 'complete' && session.payment_status === 'paid') {
        const ordersRef = db.collection('orders');
        const existing = await ordersRef.where('stripe_session_id', '==', session.id).get();
        
        if (existing.empty) {
          const metadata = session.metadata!;
          const items = JSON.parse(metadata.items);
          
          const orderData = {
            customer_name: metadata.customer_name,
            customer_email: session.customer_details?.email || metadata.customer_email,
            customer_phone: metadata.customer_phone,
            customer_address: metadata.customer_address,
            payment_method: 'Stripe',
            total_amount: session.amount_total! / 100,
            discount_code: metadata.discount_code || '',
            status: 'paid',
            stripe_session_id: session.id,
            items: items,
            created_at: admin.firestore.FieldValue.serverTimestamp()
          };

          const docRef = await ordersRef.add(orderData);
          await sendOrderEmails(docRef.id, orderData);
          
          return res.json({ status: session.status, payment_status: session.payment_status, orderId: docRef.id });
        }
        
        return res.json({ status: session.status, payment_status: session.payment_status, orderId: existing.docs[0].id });
      }

      res.json({ status: session.status, payment_status: session.payment_status });
    } catch (error: any) {
      console.error("Session status retrieval failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders/confirm-stripe", async (req, res) => {
    const { session_id } = req.body;
    if (!stripe) return res.status(500).json({ error: "Stripe not configured" });

    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      // Check if order already exists for this session
      const ordersRef = db.collection('orders');
      const existing = await ordersRef.where('stripe_session_id', '==', session_id).get();
      if (!existing.empty) {
        return res.json({ success: true, orderId: existing.docs[0].id });
      }

      const metadata = session.metadata as any;
      const items = JSON.parse(metadata.items);
      const total_amount = session.amount_total ? session.amount_total / 100 : 0;

      const orderData = {
        customer_name: metadata.customer_name,
        customer_email: session.customer_email,
        customer_phone: metadata.customer_phone,
        customer_address: metadata.customer_address,
        payment_method: 'Stripe',
        total_amount: total_amount,
        discount_code: metadata.discount_code || '',
        stripe_session_id: session_id,
        status: 'paid',
        items: items,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await ordersRef.add(orderData);
      
      sendOrderEmails(docRef.id, orderData).catch(err => console.error("Email failed:", err));

      res.json({ success: true, orderId: docRef.id });
    } catch (error: any) {
      console.error("Stripe confirmation failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      customer_address, 
      payment_method,
      items, 
      total_amount,
      discount_code 
    } = req.body;
    
    try {
      const orderData = {
        customer_name,
        customer_email,
        customer_phone,
        customer_address,
        payment_method,
        total_amount,
        discount_code: discount_code || '',
        status: 'pending',
        items: items,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('orders').add(orderData);
      
      // Send Confirmation Emails
      sendOrderEmails(docRef.id, orderData).catch(err => {
        console.error("Failed to send order emails:", err);
      });
      
      res.json({ success: true, orderId: docRef.id });
    } catch (error) {
      console.error("Order creation failed:", error);
      res.status(500).json({ error: "Failed to process order" });
    }
  });

  app.post("/api/admin/logs", async (req, res) => {
    try {
      const { action, message, level, user } = req.body;
      const docRef = await db.collection('logs').add({
        action,
        message,
        level,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        user: user || 'SYSTEM'
      });
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("Logging failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transmissions", async (req, res) => {
    try {
      const docRef = await db.collection('transmissions').add({
        ...req.body,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        status: 'unread'
      });
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error("Transmission failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/newsletter/subscribe", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    try {
      const newsletterRef = db.collection('newsletter');
      const existing = await newsletterRef.where('email', '==', email).get();
      if (!existing.empty) {
        return res.json({ success: true, message: "Already subscribed" });
      }
      await newsletterRef.add({ email, created_at: admin.firestore.FieldValue.serverTimestamp() });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Subscription failed" });
    }
  });

  app.get("/api/admin/diagnostics", async (req, res) => {
    const diagnostics: any = {
      smtp: {
        configured: !!transporter,
        host: SMTP_HOST || "NOT SET",
        port: SMTP_PORT,
        user: SMTP_USER ? `${SMTP_USER.slice(0, 3)}***${SMTP_USER.slice(-4)}` : "NOT SET",
        from: SMTP_FROM || "NOT SET",
        adminEmail: ADMIN_EMAIL || "NOT SET",
        isValidHost,
      },
      discord: {
        configured: !!DISCORD_WEBHOOK_URL,
        webhook: DISCORD_WEBHOOK_URL ? "CONFIGURED" : "NOT SET"
      }
    };

    if (transporter) {
      try {
        await transporter.verify();
        diagnostics.smtp.status = "CONNECTED";
      } catch (err: any) {
        diagnostics.smtp.status = "ERROR";
        diagnostics.smtp.error = err.message;
        
        // Provide helpful hints for common errors
        if (err.message.includes('535') || err.message.includes('Invalid login')) {
          diagnostics.smtp.hint = "Authentication failed. If using Gmail, ensure you are using an 'App Password' (not your regular password) and that 2FA is enabled.";
        } else if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
          diagnostics.smtp.hint = "Connection timed out or refused. Check your SMTP host and port (usually 587 for STARTTLS or 465 for SSL).";
        }
      }
    } else {
      diagnostics.smtp.status = "NOT_CONFIGURED";
    }

    res.json(diagnostics);
  });

  app.post("/api/admin/test-email", async (req, res) => {
    if (!transporter) return res.status(400).json({ error: "SMTP not configured" });

    try {
      await transporter.sendMail({
        from: `"D3 COMPOSURE Test" <${SMTP_FROM}>`,
        to: ADMIN_EMAIL,
        subject: "D3 COMPOSURE: SYSTEM TEST",
        html: `
          <div style="font-family: sans-serif; border: 1px solid #000; padding: 20px;">
            <h1 style="background: #000; color: #fff; padding: 10px;">TEST TRANSMISSION</h1>
            <p>This is a test of the D3 COMPOSURE system.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
            <p>If you received this, your SMTP configuration is functional.</p>
          </div>
        `
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error("Test email failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Public upload route for user submissions
  app.post("/api/user/upload", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    res.json({
      url: `/uploads/${req.file.filename}`,
      type: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
    });
  });


  app.post("/api/admin/import-external", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      let downloadUrl = url;
      
      // Handle Google Drive links
      if (url.includes('drive.google.com')) {
        const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
        const fileId = match ? match[1] : null;
        if (fileId) {
          downloadUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
      }

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      
      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const extension = contentType.split('/')[1] || 'jpg';
      const filename = `imported-${Date.now()}.${extension}`;
      const filePath = path.join(uploadsDir, filename);
      
      fs.writeFileSync(filePath, buffer);
      
      const type = contentType.startsWith('video/') ? 'video' : 'image';
      res.json({ url: `/uploads/${filename}`, type });
    } catch (err: any) {
      console.error("External import failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    try {
      const snapshot = await db.collection('orders').orderBy('created_at', 'desc').get();
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, tracking_number } = req.body;
      await db.collection('orders').doc(id).update({
        status,
        tracking_number,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/products", async (req, res) => {
    try {
      const snapshot = await db.collection('products').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    try {
      const productData = {
        ...req.body,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('products').add(productData);
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('products').doc(id).update({
        ...req.body,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('products').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/transmissions", async (req, res) => {
    try {
      const snapshot = await db.collection('transmissions').orderBy('created_at', 'desc').get();
      const transmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(transmissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/logs", async (req, res) => {
    try {
      const snapshot = await db.collection('logs').orderBy('created_at', 'desc').limit(100).get();
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/announcements", async (req, res) => {
    try {
      const snapshot = await db.collection('announcements').orderBy('created_at', 'desc').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/announcements", async (req, res) => {
    try {
      const docRef = await db.collection('announcements').add({
        ...req.body,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('announcements').doc(id).update(req.body);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('announcements').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/discounts", async (req, res) => {
    try {
      const snapshot = await db.collection('discounts').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/discounts", async (req, res) => {
    try {
      const docRef = await db.collection('discounts').add(req.body);
      res.json({ success: true, id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/admin/discounts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('discounts').doc(id).delete();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ============================================================================
  // D3 CATALOG CMS (AIRTABLE BASE SCHEMAS, RULES & PROGRAMMATIC ENDPOINTS)
  // ============================================================================

  // In-memory / Firestore fallback CMS storage instance for D3 Catalog
  const cmsProductsMap = new Map<string, any>();
  const cmsCategoriesMap = new Map<string, any>();
  const cmsAdjustmentsMap = new Map<string, any>();
  let cmsAutonumber = 7;

  // Initialize seed categories
  const seedCategories = [
    {
      id: 'cat_artifacts',
      'Category Name': 'ARTIFACTS',
      Description: 'High-fidelity technical clothing artifacts engineered in Portugal.',
      'Featured Category': true,
      'SEO Title': 'D3COMPOSURE | Technical Artifacts',
      'SEO Description': 'Explore minimalist technical streetwear artifacts crafted with 400+ GSM Portuguese organic cotton.',
      Products: ['prod_01', 'prod_02', 'prod_03', 'prod_04', 'prod_05']
    },
    {
      id: 'cat_garments',
      'Category Name': 'GARMENTS',
      Description: 'Essential graphic apparel and core wardrobe items.',
      'Parent Category': ['cat_artifacts'],
      'Featured Category': false,
      'SEO Title': 'D3COMPOSURE | Core Garments',
      'SEO Description': 'Core minimalist graphic garments and signature dropped-shoulder tees.',
      Products: ['prod_02', 'prod_04']
    },
    {
      id: 'cat_knits',
      'Category Name': 'CATALOG KNITS',
      Description: 'Technical performance knits and thermal crewnecks.',
      'Featured Category': true,
      'SEO Title': 'D3COMPOSURE | Technical Knits',
      'SEO Description': 'High performance thermal crewnecks and knitwear.',
      Products: ['prod_06']
    }
  ];

  seedCategories.forEach(cat => cmsCategoriesMap.set(cat.id, cat));

  // Initialize seed products
  const seedProducts = [
    {
      id: 'prod_01',
      'Product Name': 'D3 01 Heavyweight Hoodie',
      Description: 'A high-fidelity heavyweight hoodie artifact crafted for the D3COMPOSURE void.',
      'Short Description': 'Experimental technical silhouette hoodie.',
      Price: 350,
      Cost: 120,
      'Margin (%)': 0.6571,
      SKU: 'D3-HOOD-01',
      Supplier: 'Atelier Porto Ltd',
      Status: 'Active',
      Category: ['cat_artifacts'],
      Tags: ['New', 'Popular'],
      Images: [
        { url: '/uploads/IMG 4800 1:3.png', type: 'image' },
        { url: '/uploads/IMG 3215 3:3.png', type: 'image' }
      ],
      'On-Hand Quantity': 45,
      'Reorder Threshold': 10,
      Visibility: true,
      'Publish Status': 'Published',
      Featured: true,
      'SEO Title': 'D3 01 Heavyweight Hoodie | D3COMPOSURE',
      'SEO Description': 'Heavyweight Portuguese organic cotton hoodie.',
      'URL Slug': 'd3-01-heavyweight-hoodie',
      'Last Updated Date': '2026-08-01',
      'Inventory Adjustments': ['adj_1001']
    },
    {
      id: 'prod_02',
      'Product Name': 'D3 02 Graphic Garment',
      Description: 'Essential graphic garment tailored with dropped shoulders.',
      'Short Description': 'Signature dropped-shoulder graphic tee artifact.',
      Price: 350,
      Cost: 110,
      'Margin (%)': 0.6857,
      SKU: 'D3-TEE-02',
      Supplier: 'Atelier Porto Ltd',
      Status: 'Active',
      Category: ['cat_garments'],
      Tags: ['Popular'],
      Images: [{ url: '/uploads/d3_02_model_front.jpg' }, { url: '/uploads/d3_02_garment.jpg' }],
      'On-Hand Quantity': 28,
      'Reorder Threshold': 15,
      Visibility: true,
      'Publish Status': 'Published',
      Featured: true,
      'SEO Title': 'D3 02 Graphic Garment | D3COMPOSURE',
      'SEO Description': 'Architectural drop-shoulder graphic garment.',
      'URL Slug': 'd3-02-graphic-garment',
      'Last Updated Date': '2026-08-02',
      'Inventory Adjustments': ['adj_1002']
    },
    {
      id: 'prod_03',
      'Product Name': 'D3 03 Archival Unisex Piece',
      Description: 'Archival unisex piece engineered for modern structure.',
      'Short Description': 'Structured archival unisex garment.',
      Price: 350,
      Cost: 130,
      'Margin (%)': 0.6286,
      SKU: 'D3-UNI-03',
      Supplier: 'Atelier Porto Ltd',
      Status: 'Active',
      Category: ['cat_artifacts'],
      Tags: ['Eco-Friendly'],
      Images: [],
      'On-Hand Quantity': 8,
      'Reorder Threshold': 10,
      Visibility: true,
      'Publish Status': 'Published',
      Featured: false,
      'SEO Title': 'D3 03 Archival Unisex Piece | D3COMPOSURE',
      'SEO Description': 'Made-to-order archival unisex artifact.',
      'URL Slug': 'd3-03-archival-unisex-piece',
      'Last Updated Date': '2026-08-03',
      'Inventory Adjustments': ['adj_1003']
    },
    {
      id: 'prod_04',
      'Product Name': 'D3 04 Signature Cotton Tee',
      Description: 'Signature cotton tee featuring minimal typographic detail.',
      'Short Description': 'Refined minimal typographic cotton tee.',
      Price: 350,
      Cost: 95,
      'Margin (%)': 0.7286,
      SKU: 'D3-TEE-04',
      Supplier: 'Lisbon Textiles',
      Status: 'Active',
      Category: ['cat_garments'],
      Tags: ['Sale'],
      Images: [],
      'On-Hand Quantity': 62,
      'Reorder Threshold': 20,
      Visibility: true,
      'Publish Status': 'Published',
      Featured: false,
      'SEO Title': 'D3 04 Signature Cotton Tee | D3COMPOSURE',
      'SEO Description': 'Minimal typographic graphic tee.',
      'URL Slug': 'd3-04-signature-cotton-tee',
      'Last Updated Date': '2026-08-04',
      'Inventory Adjustments': ['adj_1004']
    },
    {
      id: 'prod_05',
      'Product Name': 'D3 05 Experimental Void Sweatshirt',
      Description: 'A high-fidelity artifact crafted for the D3COMPOSURE void.',
      'Short Description': 'Experimental blue sweatshirt artifact.',
      Price: 350,
      Cost: 125,
      'Margin (%)': 0.6429,
      SKU: 'D3-SWEAT-05',
      Supplier: 'Atelier Porto Ltd',
      Status: 'Active',
      Category: ['cat_artifacts'],
      Tags: ['New'],
      Images: [{ url: '/src/assets/images/d3_01_blue_sweatshirt_1783500383980.jpg' }],
      'On-Hand Quantity': 18,
      'Reorder Threshold': 12,
      Visibility: true,
      'Publish Status': 'Published',
      Featured: true,
      'SEO Title': 'D3 05 Experimental Void Sweatshirt | D3COMPOSURE',
      'SEO Description': 'High-fidelity blue sweatshirt.',
      'URL Slug': 'd3-05-experimental-void-sweatshirt',
      'Last Updated Date': '2026-08-04',
      'Inventory Adjustments': ['adj_1005']
    },
    {
      id: 'prod_06',
      'Product Name': 'D3 06 Technical Knit Crewneck',
      Description: 'The ultimate technical knit designed for high performance.',
      'Short Description': 'High performance thermal crewneck knit.',
      Price: 350,
      Cost: 140,
      'Margin (%)': 0.6000,
      SKU: 'D3-KNIT-06',
      Supplier: 'Coimbra Mills',
      Status: 'Active',
      Category: ['cat_knits'],
      Tags: ['Popular'],
      Images: [{ url: '/src/assets/images/d3_12_blue_crewneck_1783844647220.jpg' }],
      'On-Hand Quantity': 5,
      'Reorder Threshold': 10,
      Visibility: true,
      'Publish Status': 'Published',
      Featured: true,
      'SEO Title': 'D3 06 Technical Knit Crewneck | D3COMPOSURE',
      'SEO Description': 'Thermal knit crewneck.',
      'URL Slug': 'd3-06-technical-knit-crewneck',
      'Last Updated Date': '2026-08-05',
      'Inventory Adjustments': ['adj_1006']
    }
  ];

  seedProducts.forEach(prod => cmsProductsMap.set(prod.id, prod));

  // Initialize seed adjustments
  const seedAdjustments = [
    {
      id: 'adj_1001',
      'Adjustment ID': 'ADJ-00001',
      Product: ['prod_01'],
      Date: '2026-08-01',
      'Quantity Change': 50,
      Reason: 'New Shipment',
      Notes: 'Initial production run arrival.',
      'Adjusted By': 'Judy Lee (Inventory Lead)'
    },
    {
      id: 'adj_1002',
      'Adjustment ID': 'ADJ-00002',
      Product: ['prod_02'],
      Date: '2026-08-02',
      'Quantity Change': 30,
      Reason: 'Restock',
      Notes: 'Restocked for autumn catalog rollout.',
      'Adjusted By': 'Judy Lee (Inventory Lead)'
    },
    {
      id: 'adj_1003',
      'Adjustment ID': 'ADJ-00003',
      Product: ['prod_03'],
      Date: '2026-08-03',
      'Quantity Change': -2,
      Reason: 'Damage',
      Notes: 'Damaged in transit during quality control inspection.',
      'Adjusted By': 'Alex Rivera (QC Specialist)'
    },
    {
      id: 'adj_1004',
      'Adjustment ID': 'ADJ-00004',
      Product: ['prod_04'],
      Date: '2026-08-04',
      'Quantity Change': 65,
      Reason: 'New Shipment',
      Notes: 'Bulk batch received from Lisbon Textiles.',
      'Adjusted By': 'Judy Lee (Inventory Lead)'
    },
    {
      id: 'adj_1005',
      'Adjustment ID': 'ADJ-00005',
      Product: ['prod_05'],
      Date: '2026-08-04',
      'Quantity Change': 20,
      Reason: 'Restock',
      Notes: 'Replenished sample rack inventory.',
      'Adjusted By': 'Judy Lee (Inventory Lead)'
    },
    {
      id: 'adj_1006',
      'Adjustment ID': 'ADJ-00006',
      Product: ['prod_06'],
      Date: '2026-08-05',
      'Quantity Change': -5,
      Reason: 'Sales Correction',
      Notes: 'Reconciled physical count against digital sales.',
      'Adjusted By': 'Alex Rivera (QC Specialist)'
    }
  ];

  seedAdjustments.forEach(adj => cmsAdjustmentsMap.set(adj.id, adj));

  // Helper to parse Google Drive and external media URLs to direct viewable links
  function convertGoogleDriveUrl(url: string): string {
    if (!url) return url;
    const trimmed = url.trim();

    // Google Drive
    const driveRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = trimmed.match(driveRegex);
    if (match && match[1]) {
      const fileId = match[1].split('?')[0];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
    }
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      const fileId = idMatch[1].split('&')[0];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
    }

    // Dropbox
    if (trimmed.includes('dropbox.com')) {
      if (trimmed.includes('dl.dropboxusercontent.com')) return trimmed;
      if (trimmed.includes('?dl=0')) return trimmed.replace('?dl=0', '?raw=1');
      if (trimmed.includes('?dl=1')) return trimmed.replace('?dl=1', '?raw=1');
      return trimmed.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    }

    // GitHub
    if (trimmed.includes('github.com') && trimmed.includes('/blob/')) {
      return trimmed.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
    }

    return trimmed;
  }

  // Helper: Fetch live records from Airtable if credentials are set
  let isAirtableAuthDisabled = false;
  let lastAirtableAuthCheckTime = 0;

  async function fetchLiveAirtableProducts() {
    const apiKey = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN?.trim() || process.env.AIRTABLE_API_KEY?.trim();
    const baseId = process.env.AIRTABLE_BASE_ID?.trim() || 'appU8lAjcTDz63elZ';
    const tableName = process.env.AIRTABLE_TABLE_NAME?.trim() || 'Products';

    if (!apiKey || !baseId) return null;

    // Reset auth disabled flag after 5 minutes in case key is updated
    if (isAirtableAuthDisabled && Date.now() - lastAirtableAuthCheckTime > 300000) {
      isAirtableAuthDisabled = false;
    }

    if (isAirtableAuthDisabled) {
      return null;
    }

    try {
      let allRecords: Array<{ id: string; fields: any }> = [];
      let offset: string | undefined = undefined;

      do {
        const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
        if (offset) url.searchParams.set('offset', offset);

        const resp = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!resp.ok) {
          const errText = await resp.text();
          if (resp.status === 401) {
            isAirtableAuthDisabled = true;
            lastAirtableAuthCheckTime = Date.now();
            console.info("Airtable API key requires authentication (401). Falling back to local/Firestore product catalog.");
          } else {
            console.warn(`Airtable API HTTP Error ${resp.status}: ${errText}`);
          }
          if (allRecords.length > 0) break;
          return null;
        }

        const data = await resp.json() as { records: Array<{ id: string; fields: any }>; offset?: string };
        if (data.records && Array.isArray(data.records)) {
          allRecords.push(...data.records);
        }
        offset = data.offset;
      } while (offset);

      if (allRecords.length === 0) return [];

      return allRecords.map(rec => {
        const f = rec.fields || {};
        const name = f['Product Name'] || f['Name'] || f['Title'] || '';
        const price = Number(f['Price']) || 350;
        const cost = Number(f['Cost']) || 0;
        const margin = f['Margin (%)'] !== undefined ? Number(f['Margin (%)']) : (price > 0 ? (price - cost) / price : 0);
        
        // Parse Images with broad field fallback and type normalization
        const rawImages = f['Images'] || f['Image'] || f['Photos'] || f['Photo'] || f['Media'] || f['Picture'] || f['Pictures'] || f['Cover'] || f['Cover Image'] || f['Attachment'] || f['Attachments'] || f['Image URL'] || f['URL'] || [];
        
        let imagesList: any[] = [];
        if (Array.isArray(rawImages)) {
          imagesList = rawImages;
        } else if (typeof rawImages === 'string' && rawImages.trim()) {
          imagesList = rawImages.includes(',') ? rawImages.split(',').map(s => s.trim()) : [rawImages.trim()];
        } else if (rawImages && typeof rawImages === 'object') {
          imagesList = [rawImages];
        }

        const formattedImages = imagesList.map((img: any) => {
          if (typeof img === 'string' && img) {
            let u = convertGoogleDriveUrl(img);
            if (!u.startsWith('http://') && !u.startsWith('https://') && !u.startsWith('/')) {
              u = '/' + u;
            }
            return { url: u, type: 'image' };
          }
          if (typeof img === 'object' && img !== null) {
            let url = img.url || img.thumbnails?.full?.url || img.thumbnails?.large?.url || img.thumbnails?.small?.url || '';
            if (url) {
              url = convertGoogleDriveUrl(url);
              if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
                url = '/' + url;
              }
              let type = 'image';
              if (img.type && typeof img.type === 'string') {
                if (img.type.startsWith('video') || img.type === 'video') type = 'video';
                else if (img.type.includes('model') || img.type === 'model3d') type = 'model3d';
              }
              return { url, type };
            }
          }
          return null;
        }).filter((img: any): img is { url: string; type: string } => Boolean(img && img.url));

        const rawCat = f['Category'] || f['Categories'] || f['Category Name'] || 'cat_artifacts';
        const category = Array.isArray(rawCat) ? rawCat : [String(rawCat)];
        const rawTags = f['Tags'] || f['Tag'] || [];
        const tags = Array.isArray(rawTags) ? rawTags : [String(rawTags)];

        const slug = f['URL Slug'] || f['Slug'] || (name ? name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-') : rec.id);

        const description = f['Description'] || f['Product Description'] || f['Details'] || f['Long Description'] || f['Body'] || f['Notes'] || f['Overview'] || f['Short Description'] || f['Subtitle'] || '';
        const shortDescription = f['Short Description'] || f['Subtitle'] || f['Summary'] || f['Tagline'] || f['Short_Description'] || f['Description'] || '';

        return {
          id: rec.id,
          'Product Name': name,
          name: name,
          Description: description,
          description: description,
          'Short Description': shortDescription,
          short_description: shortDescription,
          Price: price,
          price: price,
          Cost: cost,
          'Margin (%)': Math.round(margin * 10000) / 10000,
          SKU: f['SKU'] || f['Code'] || rec.id,
          sku: f['SKU'] || f['Code'] || rec.id,
          Supplier: f['Supplier'] || 'Airtable Base',
          Status: f['Status'] || 'Active',
          Category: category,
          CategoryName: category[0] || 'ARTIFACTS',
          category: category[0] || 'ARTIFACTS',
          Tags: tags,
          tags: tags,
          Images: formattedImages.length > 0 ? formattedImages : [{ url: '/uploads/hero_banner.jpg', type: 'image' }],
          images: formattedImages.length > 0 ? formattedImages : [{ url: '/uploads/hero_banner.jpg', type: 'image' }],
          'On-Hand Quantity': f['On-Hand Quantity'] !== undefined ? Number(f['On-Hand Quantity']) : (f['Quantity'] !== undefined ? Number(f['Quantity']) : 50),
          'Reorder Threshold': f['Reorder Threshold'] !== undefined ? Number(f['Reorder Threshold']) : 10,
          Visibility: f['Visibility'] !== undefined ? Boolean(f['Visibility']) : true,
          is_visible: f['Visibility'] !== undefined ? Boolean(f['Visibility']) : true,
          in_stock: (f['On-Hand Quantity'] !== undefined ? Number(f['On-Hand Quantity']) : 50) > 0,
          'Publish Status': f['Publish Status'] || 'Published',
          Featured: Boolean(f['Featured']),
          featured: Boolean(f['Featured']),
          'SEO Title': f['SEO Title'] || name || '',
          'SEO Description': f['SEO Description'] || f['Short Description'] || '',
          'URL Slug': slug,
          'Last Updated Date': f['Last Updated Date'] || new Date().toISOString().split('T')[0],
          'Inventory Adjustments': f['Inventory Adjustments'] || []
        };
      });
    } catch (err) {
      console.error("Failed to query Airtable API:", err);
      return null;
    }
  }

  // Helper: Create product in Airtable
  async function createAirtableProduct(productData: any) {
    const apiKey = process.env.AIRTABLE_API_KEY?.trim();
    const baseId = process.env.AIRTABLE_BASE_ID?.trim();
    if (!apiKey || !baseId || isAirtableAuthDisabled) return null;

    try {
      const fields: any = {
        'Product Name': productData['Product Name'] || productData.name,
        'Description': productData.Description || productData.description || '',
        'Short Description': productData['Short Description'] || '',
        'Price': Number(productData.Price || productData.price || 0),
        'Cost': Number(productData.Cost || productData.cost || 0),
        'SKU': productData.SKU || productData.sku || '',
        'Status': productData.Status || 'Active',
        'Visibility': productData.Visibility !== undefined ? Boolean(productData.Visibility) : true,
        'Publish Status': productData['Publish Status'] || 'Published',
        'Featured': Boolean(productData.Featured || productData.featured),
        'URL Slug': productData['URL Slug'] || ''
      };

      const resp = await fetch(`https://api.airtable.com/v0/${baseId}/Products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      if (!resp.ok) {
        if (resp.status === 401) {
          isAirtableAuthDisabled = true;
          lastAirtableAuthCheckTime = Date.now();
        } else {
          console.warn(`Airtable Create HTTP Error ${resp.status}: ${await resp.text()}`);
        }
        return null;
      }

      return await resp.json();
    } catch (err) {
      console.error("Failed to create record in Airtable:", err);
      return null;
    }
  }

  // 1. READS: Query Products (Storefront rule: Status=Active, Visibility=true, Publish Status=Published)
  app.get("/api/cms/products", async (req, res) => {
    let prods = await fetchLiveAirtableProducts();
    const source = prods ? 'Airtable Live Base' : 'D3 Catalog CMS (In-Memory/Local Storage)';

    if (!prods) {
      prods = Array.from(cmsProductsMap.values());
    }

    const { status, visibility, publish_status, featured, slug, sku, category, storefront } = req.query;

    if (storefront === 'true') {
      // Rule 1: Reads for Storefront
      prods = prods.filter(p => p.Status === 'Active' && p.Visibility === true && p['Publish Status'] === 'Published');
    } else {
      if (status) prods = prods.filter(p => p.Status === status);
      if (visibility) prods = prods.filter(p => String(p.Visibility) === String(visibility));
      if (publish_status) prods = prods.filter(p => p['Publish Status'] === publish_status);
      if (featured) prods = prods.filter(p => String(p.Featured) === String(featured));
      if (slug) prods = prods.filter(p => p['URL Slug'] === slug);
      if (sku) prods = prods.filter(p => p.SKU?.toLowerCase() === String(sku).toLowerCase());
      if (category) prods = prods.filter(p => p.Category?.includes(String(category)));
    }

    res.json({
      success: true,
      source,
      total: prods.length,
      records: prods
    });
  });

  // GET Single Product
  app.get("/api/cms/products/:idOrSlug", async (req, res) => {
    const { idOrSlug } = req.params;
    let prods = await fetchLiveAirtableProducts();
    if (!prods) {
      prods = Array.from(cmsProductsMap.values());
    }

    const found = prods.find(p => p.id === idOrSlug || p['URL Slug'] === idOrSlug || p.SKU === idOrSlug);

    if (!found) {
      return res.status(404).json({ success: false, error: `Product '${idOrSlug}' not found.` });
    }

    res.json({ success: true, record: found });
  });

  // 2. WRITES: Create Product (Required fields: Product Name, SKU, Price, Category. Unique URL Slug & SKU)
  app.post("/api/cms/products", (req, res) => {
    const body = req.body;
    const prods = Array.from(cmsProductsMap.values());
    const errors: string[] = [];

    // Required field validation
    if (!body['Product Name']?.trim()) errors.push("Product Name is required.");
    if (!body.SKU?.trim()) errors.push("SKU is required.");
    if (body.Price === undefined || body.Price === null || isNaN(Number(body.Price)) || Number(body.Price) < 0) {
      errors.push("Price must be a non-negative number.");
    }
    if (!body.Category || (Array.isArray(body.Category) && body.Category.length === 0)) {
      errors.push("Product must link to a valid Category.");
    }

    const skuCandidate = body.SKU?.trim();
    if (skuCandidate && prods.some(p => p.SKU?.toLowerCase() === skuCandidate.toLowerCase())) {
      errors.push(`SKU '${skuCandidate}' already exists. SKU must be unique.`);
    }

    // Auto slug generation if missing
    let slug = body['URL Slug']?.trim();
    if (!slug && body['Product Name']) {
      slug = body['Product Name'].toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-');
    }
    if (!slug) slug = `prod-slug-${Date.now()}`;

    // Slug collision check
    if (prods.some(p => p['URL Slug']?.toLowerCase() === slug.toLowerCase())) {
      errors.push(`URL Slug '${slug}' already exists. Slug must be unique.`);
    }

    // Option validation
    const validStatuses = ['Active', 'Draft', 'Archived'];
    const validPublishStatuses = ['Published', 'Unpublished', 'Pending'];
    if (body.Status && !validStatuses.includes(body.Status)) {
      errors.push(`Invalid Status '${body.Status}'. Allowed: ${validStatuses.join(', ')}`);
    }
    if (body['Publish Status'] && !validPublishStatuses.includes(body['Publish Status'])) {
      errors.push(`Invalid Publish Status '${body['Publish Status']}'. Allowed: ${validPublishStatuses.join(', ')}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
        message: `Validation failed: ${errors.join(' ')}`
      });
    }

    const priceNum = Number(body.Price);
    const costNum = body.Cost !== undefined ? Number(body.Cost) : 0;
    const margin = priceNum > 0 ? (priceNum - costNum) / priceNum : 0;

    const newProd = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      'Product Name': body['Product Name'].trim(),
      Description: body.Description || '',
      'Short Description': body['Short Description'] || '',
      Price: priceNum,
      Cost: costNum,
      'Margin (%)': Math.round(margin * 10000) / 10000,
      SKU: skuCandidate,
      Supplier: body.Supplier || 'Internal',
      Status: body.Status || 'Active',
      Category: Array.isArray(body.Category) ? body.Category : [body.Category],
      Tags: body.Tags || [],
      Images: body.Images || [],
      'On-Hand Quantity': body['On-Hand Quantity'] !== undefined ? Number(body['On-Hand Quantity']) : 0,
      'Reorder Threshold': body['Reorder Threshold'] !== undefined ? Number(body['Reorder Threshold']) : 10,
      Visibility: body.Visibility !== undefined ? Boolean(body.Visibility) : true,
      'Publish Status': body['Publish Status'] || 'Published',
      Featured: Boolean(body.Featured),
      'SEO Title': body['SEO Title'] || `${body['Product Name']} | D3COMPOSURE`,
      'SEO Description': body['SEO Description'] || body['Short Description'] || '',
      'URL Slug': slug,
      'Last Updated Date': new Date().toISOString().split('T')[0],
      'Inventory Adjustments': []
    };

    cmsProductsMap.set(newProd.id, newProd);

    // Initial inventory adjustment if stock > 0
    if (newProd['On-Hand Quantity'] > 0) {
      const adjId = `rec_adj_${Date.now()}`;
      const autonum = `ADJ-${String(cmsAutonumber++).padStart(5, '0')}`;
      const newAdj = {
        id: adjId,
        'Adjustment ID': autonum,
        Product: [newProd.id],
        Date: new Date().toISOString().split('T')[0],
        'Quantity Change': newProd['On-Hand Quantity'],
        Reason: 'New Shipment',
        Notes: `Initial stock for ${newProd['Product Name']}`,
        'Adjusted By': 'System'
      };
      cmsAdjustmentsMap.set(adjId, newAdj);
      newProd['Inventory Adjustments'].push(adjId);
    }

    return res.status(201).json({
      success: true,
      action: 'create',
      affectedRecord: newProd.id,
      fieldsChanged: Object.keys(newProd),
      record: newProd,
      message: `Successfully created product '${newProd['Product Name']}' (${newProd.SKU}).`
    });
  });

  // PATCH Product
  app.patch("/api/cms/products/:id", (req, res) => {
    const { id } = req.params;
    const body = req.body;
    const prod = cmsProductsMap.get(id);

    if (!prod) {
      return res.status(404).json({ success: false, error: `Product '${id}' not found.` });
    }

    // Read-only rule: Ignore attempts to manually write Last Updated Date
    delete body['Last Updated Date'];

    const updated = {
      ...prod,
      ...body,
      id: prod.id,
      'Last Updated Date': new Date().toISOString().split('T')[0]
    };

    if (body.Price !== undefined || body.Cost !== undefined) {
      const p = Number(updated.Price);
      const c = Number(updated.Cost || 0);
      updated['Margin (%)'] = p > 0 ? Math.round(((p - c) / p) * 10000) / 10000 : 0;
    }

    cmsProductsMap.set(id, updated);

    res.json({
      success: true,
      action: 'update',
      affectedRecord: id,
      fieldsChanged: Object.keys(body),
      record: updated,
      message: `Updated Product '${updated['Product Name']}'.`
    });
  });

  // DELETE Product
  app.delete("/api/cms/products/:id", (req, res) => {
    const { id } = req.params;
    if (!cmsProductsMap.has(id)) {
      return res.status(404).json({ success: false, error: `Product '${id}' not found.` });
    }
    cmsProductsMap.delete(id);
    res.json({ success: true, action: 'delete', affectedRecord: id, message: `Deleted Product '${id}'.` });
  });

  // GET Categories
  app.get("/api/cms/categories", (req, res) => {
    const cats = Array.from(cmsCategoriesMap.values());
    res.json({ success: true, total: cats.length, records: cats });
  });

  // POST Category
  app.post("/api/cms/categories", (req, res) => {
    const { name, description, parent_category, featured } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, error: "Category Name is required." });
    }

    const catId = `rec_cat_${Date.now()}`;
    const newCat = {
      id: catId,
      'Category Name': name.trim(),
      Description: description || '',
      'Parent Category': parent_category ? [parent_category] : [],
      'Featured Category': Boolean(featured),
      Products: []
    };

    cmsCategoriesMap.set(catId, newCat);
    res.status(201).json({ success: true, action: 'create', affectedRecord: catId, record: newCat });
  });

  // 4. INVENTORY INTEGRITY: Create Inventory Adjustments (Signed Quantity Change, Reason, On-Hand reconciliation, Restock trigger)
  app.get("/api/cms/inventory-adjustments", (req, res) => {
    const adjs = Array.from(cmsAdjustmentsMap.values());
    res.json({ success: true, total: adjs.length, records: adjs });
  });

  app.post("/api/cms/inventory-adjustments", (req, res) => {
    const { product_id, quantity_change, reason, notes, adjusted_by } = req.body;
    const errors: string[] = [];

    const prod = cmsProductsMap.get(product_id);
    if (!prod) errors.push(`Linked Product '${product_id}' not found.`);

    const delta = Number(quantity_change);
    if (isNaN(delta) || delta === 0) errors.push("Quantity Change must be a non-zero signed integer.");

    const allowedReasons = ['Restock', 'Sales Correction', 'Inventory Count', 'Damage', 'Return', 'New Shipment', 'Lost Item'];
    if (!reason || !allowedReasons.includes(reason)) {
      errors.push(`Invalid Reason '${reason}'. Allowed: ${allowedReasons.join(', ')}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors, message: `Adjustment failed: ${errors.join(' ')}` });
    }

    const adjId = `rec_adj_${Date.now()}`;
    const autonum = `ADJ-${String(cmsAutonumber++).padStart(5, '0')}`;

    const newAdj = {
      id: adjId,
      'Adjustment ID': autonum,
      Product: [prod.id],
      Date: new Date().toISOString().split('T')[0],
      'Quantity Change': delta,
      Reason: reason,
      Notes: notes || '',
      'Adjusted By': adjusted_by || 'Store Manager'
    };

    // Reconcile on-hand stock
    const oldQty = prod['On-Hand Quantity'] || 0;
    const newQty = Math.max(0, oldQty + delta);
    prod['On-Hand Quantity'] = newQty;
    prod['Last Updated Date'] = new Date().toISOString().split('T')[0];

    if (!prod['Inventory Adjustments']) prod['Inventory Adjustments'] = [];
    prod['Inventory Adjustments'].push(adjId);

    cmsAdjustmentsMap.set(adjId, newAdj);

    const isRestockNeeded = newQty <= (prod['Reorder Threshold'] || 10);

    res.status(201).json({
      success: true,
      action: 'create',
      affectedRecord: adjId,
      fieldsChanged: ['Adjustment ID', 'Product', 'Quantity Change', 'Reason', 'Notes'],
      record: newAdj,
      reconciledStock: newQty,
      restockNeeded: isRestockNeeded,
      message: `Logged Inventory Adjustment ${autonum} (${delta >= 0 ? '+' : ''}${delta} units, Reason: ${reason}). Reconciled On-Hand Stock for '${prod['Product Name']}': ${newQty}.${isRestockNeeded ? ' ⚠️ Restock threshold reached!' : ''}`
    });
  });

  // GET CATALOG AUDIT
  app.get("/api/cms/audit", (req, res) => {
    const prods = Array.from(cmsProductsMap.values());
    const cats = Array.from(cmsCategoriesMap.values());
    const adjs = Array.from(cmsAdjustmentsMap.values());

    const lowStockAlerts = prods.filter(p => (p['On-Hand Quantity'] || 0) <= (p['Reorder Threshold'] || 10));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalProducts: prods.length,
        totalCategories: cats.length,
        totalAdjustments: adjs.length,
        lowStockAlertsCount: lowStockAlerts.length,
        healthy: true
      },
      lowStockAlerts: lowStockAlerts.map(p => ({
        productName: p['Product Name'],
        sku: p.SKU,
        onHand: p['On-Hand Quantity'],
        reorderThreshold: p['Reorder Threshold']
      }))
    });
  });



  app.get("/api/products", async (req, res) => {
    try {
      // Direct query shortcut: /api/products?drive_url=...
      const singleDriveUrl = (req.query.drive_url || req.query.attachment || req.query.url) as string;
      if (singleDriveUrl) {
        const freshUrl = convertGoogleDriveUrl(singleDriveUrl);
        return res.json({
          original_url: singleDriveUrl,
          fresh_attachment_url: freshUrl,
          candidates: [
            freshUrl,
            singleDriveUrl
          ]
        });
      }

      const airtableProducts = await fetchLiveAirtableProducts();
      if (airtableProducts && airtableProducts.length > 0) {
        // Map Airtable records directly to storefront Products
        const storefrontProds = airtableProducts
          .filter(p => p.Visibility !== false && p.Status !== 'Draft' && p.Status !== 'Archived')
          .map(p => {
            const rawImgs = p.Images && p.Images.length > 0 ? p.Images : [{ url: '/uploads/hero_banner.jpg', type: 'image' }];
            const freshImgs = rawImgs.map((img: any, idx: number) => ({
              uid: img.uid || `att_${idx}`,
              url: convertGoogleDriveUrl(typeof img === 'string' ? img : img.url),
              type: (typeof img === 'object' && img.type) ? img.type : 'image',
              created_at: (typeof img === 'object' && img.created_at) ? img.created_at : new Date(Date.now() + idx * 1000).toISOString()
            }));

            // Sort attachments chronologically
            freshImgs.sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

            return {
              id: p.id,
              name: p['Product Name'] || p.name,
              description: p.Description || p.description || '',
              short_description: p['Short Description'] || '',
              price: p.Price || p.price || 350,
              category: Array.isArray(p.Category) ? (p.Category[0] || 'ARTIFACTS') : (p.Category || 'ARTIFACTS'),
              images: freshImgs,
              in_stock: (p['On-Hand Quantity'] ?? 10) > 0,
              stock_quantity: p['On-Hand Quantity'] ?? 10,
              sku: p.SKU || p.id,
              tags: p.Tags || [],
              is_visible: p.Visibility ?? true,
              featured: p.Featured ?? false,
              created_at: p['Last Updated Date'] || new Date().toISOString()
            };
          });

        // Chronological sort
        storefrontProds.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return res.json(storefrontProds);
      }

      if (db) {
        try {
          const snapshot = await db.collection('products').where('is_visible', '==', true).get();
          const dbProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
          const fileNames = localProducts.map(p => p.name.toLowerCase());
          
          const getMappedNewName = (dbName: string): string => {
            const name = dbName.trim().toLowerCase();
            if (name.includes("crewneck 01")) return "D3 01";
            if (name === "0011") return "D3 02";
            if (name === "11") return "D3 03";
            if (name.includes("0012") || name.includes("home boy")) return "D3 04";
            if (name === "12") return "D3 05";
            if (name.includes("0013") || name.includes("dog shirt")) return "D3 06";
            if (name === "13") return "D3 07";
            if (name.includes("0014") || name.includes("home girl")) return "D3 08";
            if (name === "14") return "D3 09";
            if (name === "0015") return "D3 10";
            if (name === "15") return "D3 11";
            if (name === "16") return "D3 12";
            return dbName;
          };

          const isUnwanted = (pName: string, pDesc: string = "") => {
            const nameLower = pName.toLowerCase();
            const descLower = pDesc.toLowerCase();
            return (
              nameLower.includes("home girl") || descLower.includes("home girl") ||
              nameLower.includes("essential home") || descLower.includes("essential home") ||
              nameLower.includes("dog shirt") || descLower.includes("dog shirt") ||
              nameLower.includes("archival artifact 14") || descLower.includes("archival artifact 14") ||
              nameLower.includes("limited edition induction") || descLower.includes("limited edition induction") ||
              nameLower.includes("shopping_bag") || descLower.includes("shopping_bag") ||
              nameLower.includes("shopping bag") || descLower.includes("shopping bag") ||
              nameLower.includes("0015") || descLower.includes("0015") ||
              nameLower.includes("essential artifact") || descLower.includes("essential artifact")
            );
          };

          const filtered = dbProducts
            .filter(p => !isUnwanted(p.name, p.description || ""))
            .map(p => {
              const targetNewName = getMappedNewName(p.name);
              const localMatch = localProducts.find(lp => lp.name.toLowerCase() === targetNewName.toLowerCase());
              if (localMatch) {
                const freshImgs = (localMatch.images || []).map((img: any, idx: number) => ({
                  ...img,
                  url: convertGoogleDriveUrl(img.url),
                  created_at: img.created_at || new Date(Date.now() + idx * 1000).toISOString()
                }));
                freshImgs.sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

                return {
                  ...localMatch,
                  ...p,
                  name: localMatch.name, // Force mapped name "D3 XX"
                  price: 350, // Force price to $350 as requested
                  images: freshImgs,
                  created_at: p.created_at || new Date().toISOString()
                };
              }
              return null;
            })
            .filter((p): p is any => p !== null && fileNames.includes(p.name.toLowerCase()));

          if (filtered.length > 0) {
            filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
            return res.json(filtered);
          }
        } catch {
          // Gracefully fall back to local product definitions if Firestore query is unauthorized or unavailable
        }
      }

      const formattedLocal = localProducts.map((p, pIdx) => {
        const freshImgs = (p.images || []).map((img: any, idx: number) => ({
          ...img,
          url: convertGoogleDriveUrl(img.url),
          created_at: img.created_at || new Date(Date.now() + idx * 1000).toISOString()
        }));
        freshImgs.sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

        return {
          ...p,
          price: 350,
          images: freshImgs,
          created_at: (p as any).created_at || new Date(Date.now() - pIdx * 60000).toISOString()
        };
      });

      formattedLocal.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      return res.json(formattedLocal);
    } catch (error: any) {
      return res.json(localProducts.map(p => ({ ...p, price: 350 })));
    }
  });

  // Keyless & Serverless attachment receiver
  app.post("/api/products", async (req, res) => {
    try {
      const body = req.body || {};
      const rawAttachments = body.attachments || body.images || body.drive_urls || body.url || [];
      const attachmentList = Array.isArray(rawAttachments) ? rawAttachments : [rawAttachments];

      const now = new Date().toISOString();
      const freshAttachments = attachmentList
        .filter(Boolean)
        .map((item: any, idx: number) => {
          const rawUrl = typeof item === 'string' ? item : (item.url || item.drive_url || item.src || '');
          const freshUrl = convertGoogleDriveUrl(rawUrl);
          const isVideo = rawUrl.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || rawUrl.includes('video');
          const isModel = rawUrl.toLowerCase().match(/\.(glb|gltf|usdz)$/) || rawUrl.includes('model');

          return {
            uid: `att_${Date.now()}_${idx}`,
            url: freshUrl,
            raw_source: rawUrl,
            type: isVideo ? 'video' : (isModel ? 'model3d' : 'image'),
            created_at: item.created_at || new Date(Date.now() + idx * 1000).toISOString(),
            order: idx
          };
        })
        .filter((att: any) => Boolean(att.url));

      // Sort attachments in chronological order
      freshAttachments.sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeA - timeB;
      });

      const newProduct = {
        id: body.id || `prod_${Date.now()}`,
        name: body.name || body['Product Name'] || "D3 ARTIFACT",
        description: body.description || body.Description || "Technical garment artifact embedded with fresh Google Drive attachments.",
        price: Number(body.price || body.Price || 350),
        category: body.category || "ARTIFACT",
        images: freshAttachments.length > 0 ? freshAttachments : [{ url: "/assets/images/IMG_4800_1_3.png", type: "image", created_at: now }],
        stock: Number(body.stock || 50),
        is_visible: body.is_visible !== undefined ? Boolean(body.is_visible) : true,
        created_at: body.created_at || now,
        updated_at: now
      };

      return res.status(201).json({
        success: true,
        message: "Google Drive image attachments parsed and converted keylessly",
        product: newProduct,
        attachments: freshAttachments
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: "Failed to parse attachment payload",
        details: err.message
      });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const airtableProducts = await fetchLiveAirtableProducts();
      if (airtableProducts && airtableProducts.length > 0) {
        const found = airtableProducts.find(p => p.id === id || p['URL Slug'] === id || p.SKU === id);
        if (found) {
          return res.json({
            id: found.id,
            name: found['Product Name'] || found.name,
            description: found.Description || found.description || '',
            short_description: found['Short Description'] || '',
            price: found.Price || found.price || 350,
            category: Array.isArray(found.Category) ? (found.Category[0] || 'ARTIFACTS') : (found.Category || 'ARTIFACTS'),
            images: found.Images && found.Images.length > 0 ? found.Images : [{ url: '/uploads/hero_banner.jpg', type: 'image' }],
            in_stock: (found['On-Hand Quantity'] ?? 10) > 0,
            stock_quantity: found['On-Hand Quantity'] ?? 10,
            sku: found.SKU || found.id,
            tags: found.Tags || [],
            is_visible: found.Visibility ?? true,
            featured: found.Featured ?? false,
            created_at: found['Last Updated Date'] || new Date().toISOString()
          });
        }
      }

      const doc = await db.collection('products').doc(id).get();
      
      const getMappedNewName = (dbName: string): string => {
        const name = dbName.trim().toLowerCase();
        if (name.includes("crewneck 01")) return "D3 01";
        if (name === "0011") return "D3 02";
        if (name === "11") return "D3 03";
        if (name.includes("0012") || name.includes("home boy")) return "D3 04";
        if (name === "12") return "D3 05";
        if (name.includes("0013") || name.includes("dog shirt")) return "D3 06";
        if (name === "13") return "D3 07";
        if (name.includes("0014") || name.includes("home girl")) return "D3 08";
        if (name === "14") return "D3 09";
        if (name === "0015") return "D3 10";
        if (name === "15") return "D3 11";
        if (name === "16") return "D3 12";
        return dbName;
      };

      if (!doc.exists) {
        const localProd = localProducts[0];
        return res.json({ id, ...localProd, price: 350 });
      }
      const data = doc.data() as any;
      const isUnwanted = (pName: string, pDesc: string = "") => {
        const nameLower = pName.toLowerCase();
        const descLower = pDesc.toLowerCase();
        return (
          nameLower.includes("home girl") || descLower.includes("home girl") ||
          nameLower.includes("essential home") || descLower.includes("essential home") ||
          nameLower.includes("dog shirt") || descLower.includes("dog shirt") ||
          nameLower.includes("archival artifact 14") || descLower.includes("archival artifact 14") ||
          nameLower.includes("limited edition induction") || descLower.includes("limited edition induction") ||
          nameLower.includes("shopping_bag") || descLower.includes("shopping_bag") ||
          nameLower.includes("shopping bag") || descLower.includes("shopping bag") ||
          nameLower.includes("0015") || descLower.includes("0015") ||
          nameLower.includes("essential artifact") || descLower.includes("essential artifact")
        );
      };

      if (isUnwanted(data.name || "", data.description || "")) {
        return res.status(404).json({ error: "Product not found" });
      }

      const targetNewName = getMappedNewName(data.name);
      const localMatch = localProducts.find(p => p.name.toLowerCase() === targetNewName.toLowerCase());
      res.json({ 
        id: doc.id, 
        ...(localMatch || {}), 
        ...data, 
        name: localMatch ? localMatch.name : data.name, // Force mapped name "D3 XX"
        price: 350 // Force price to $350 as requested
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/announcements", async (req, res) => {
    try {
      const snapshot = await db.collection('announcements').where('active', '==', true).orderBy('created_at', 'desc').get();
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(item => {
          const txt = (item.text || '').toUpperCase();
          return !txt.includes("ARCHIVAL ARTIFACT 16") && !txt.includes("ARCHIVAL ARTIFACT 13") && !txt.includes("LIMITED EDITION INDUCTION");
        });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const snapshot = await db.collection('settings').get();
      const data: Record<string, any> = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data().value;
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/settings", async (req, res) => {
    try {
      const snapshot = await db.collection('settings').get();
      const data: Record<string, any> = {};
      snapshot.forEach(doc => {
        data[doc.id] = doc.data().value;
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/admin/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      await db.collection('settings').doc(key).set({ key, value }, { merge: true });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/logs", async (req, res) => {
    try {
      await db.collection('logs').add({
        ...req.body,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/export-customers", async (req, res) => {
    try {
      const snapshot = await db.collection('orders').get();
      const emails = new Set(snapshot.docs.map(doc => doc.data().customer_email));
      const csv = "email\n" + Array.from(emails).join("\n");
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GitHub OAuth Routes
  app.get("/api/auth/github/url", (req, res) => {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/github/callback`;
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID!,
      redirect_uri: redirectUri,
      scope: 'repo,user',
      state: Math.random().toString(36).substring(7),
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code missing");

    try {
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await response.json();
      const accessToken = data.access_token;

      if (!accessToken) throw new Error("Failed to get access token");

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${accessToken}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error(error);
      res.status(500).send("Authentication failed");
    }
  });

  app.post("/api/export/github", async (req, res) => {
    const { token, repoName, username } = req.body;
    if (!token || !repoName) return res.status(400).json({ error: "Missing parameters" });

    const octokit = new Octokit({ auth: token });

    try {
      // 1. Create Repository
      console.log(`Creating repo: ${repoName} for user: ${username}`);
      await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        private: false,
        auto_init: true,
      });

      // Wait a bit for GitHub to initialize the repo
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Get all files to upload
      const filesToUpload: { path: string, content: Buffer }[] = [];
      
      const getFilesRecursively = (dir: string, baseDir: string) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relativePath = path.relative(baseDir, fullPath);
          
          if (fs.statSync(fullPath).isDirectory()) {
            if (item !== 'node_modules' && item !== '.git' && item !== 'dist') {
              getFilesRecursively(fullPath, baseDir);
            }
          } else {
            // Read as Buffer to support binary files
            const content = fs.readFileSync(fullPath);
            filesToUpload.push({ path: relativePath, content });
          }
        }
      };

      getFilesRecursively(_dirname, _dirname);

      // 3. Upload files
      // For simplicity, we'll create a single commit with all files
      // In a real app, you might want to use the Git Data API for large repos
      for (const file of filesToUpload) {
        try {
          await octokit.repos.createOrUpdateFileContents({
            owner: username,
            repo: repoName,
            path: file.path,
            message: `Initial commit: ${file.path}`,
            content: file.content.toString('base64'),
          });
        } catch (e) {
          console.error(`Failed to upload ${file.path}:`, e);
        }
      }

      res.json({ success: true, url: `https://github.com/${username}/${repoName}` });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || "Export failed" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    // Save to database
    try {
      await db.collection('transmissions').add({
        name,
        email,
        subject,
        message,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (dbErr) {
      console.error("Failed to save transmission to DB:", dbErr);
    }

    const adminBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #000; padding: 20px;">
        <h1 style="background: #000; color: #fff; padding: 10px; margin: -20px -20px 20px -20px;">NEW INQUIRY RECEIVED</h1>
        <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <div style="background: #eee; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
        <p style="font-size: 10px; opacity: 0.5;">This message was sent via the D3 COMPOSURE contact protocol.</p>
      </div>
    `;

    // Send Discord Webhook if configured
    if (DISCORD_WEBHOOK_URL) {
      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: `New Transmission: ${subject || 'No Subject'}`,
              color: 0, // Black
              fields: [
                { name: 'From', value: `${name} (${email})`, inline: true },
                { name: 'Message', value: message.slice(0, 1024) }
              ],
              timestamp: new Date().toISOString()
            }]
          })
        });
      } catch (webhookErr) {
        console.error("Discord Webhook failed:", webhookErr);
      }
    }

    try {
      if (transporter && SMTP_FROM) {
        await transporter.sendMail({
          from: `"D3 COMPOSURE Contact" <${SMTP_FROM}>`,
          to: ADMIN_EMAIL,
          subject: `INQUIRY: ${subject} from ${name}`,
          html: adminBody,
        });
        console.log(`Contact email sent from ${email} to ${ADMIN_EMAIL}`);
      } else {
        console.warn("SMTP credentials not configured. Skipping real contact email sending.");
        console.log("--- MOCK CONTACT EMAIL TO ADMIN ---");
        console.log(adminBody);
      }
    } catch (error) {
      console.error("Failed to send contact email notification:", error);
      // We don't fail the request here because it was already saved to DB and Discord
    }

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached.");
  } else {
    // Determine the path to the dist folder
    const getDistPath = () => {
      const rootDist = path.join(process.cwd(), "dist");
      if (fs.existsSync(rootDist)) return rootDist;
      const peerDist = path.join(_dirname, "dist");
      if (fs.existsSync(peerDist)) return peerDist;
      // If we are already inside dist (bundled server)
      if (process.cwd().endsWith('dist')) return process.cwd();
      return rootDist;
    };

    const distPath = getDistPath();
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Initial sync with Stripe
    syncStripeProducts(false).catch(console.error);

    // Safe database cleanup for known collections
    (async () => {
      try {
        const knownCollections = ['products', 'settings', 'announcements', 'discounts', 'drive_links', 'transmissions', 'waiting_list', 'newsletter', 'orders'];
        for (const colId of knownCollections) {
          try {
            const snapshot = await db.collection(colId).get();
            for (const doc of snapshot.docs) {
              const data = doc.data();
              const docId = doc.id;
              const str = JSON.stringify(data);
              if (str.toUpperCase().includes("A PREMIUM ARTIFACT FROM THE COLLECTION")) {
                console.log(`FOUND matching artifact text in collection '${colId}', doc ID: '${docId}'`);
                await db.collection(colId).doc(docId).delete();
                console.log(`DELETED doc ID: '${docId}' from collection '${colId}'`);
              }
            }
          } catch {
            // Ignore individual collection errors
          }
        }
      } catch (err) {
        console.warn("Optional database cleanup notice:", err);
      }
    })();
  });
}

startServer().catch(err => {
  console.error("FATAL: Failed to start server:", err);
  process.exit(1);
});
