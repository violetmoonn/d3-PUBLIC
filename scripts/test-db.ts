import admin from "firebase-admin";

async function test() {
  try {
    const app = admin.initializeApp();
    console.log("Default Project ID:", app.options.projectId);
  } catch (err: any) {
    console.error("Default init failed:", err.message);
  }
}

test().then(() => process.exit(0));
