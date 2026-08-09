import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function listAll() {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let adminApp;
  let firebaseConfig;

  if (fs.existsSync(firebaseConfigPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    adminApp = admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
  } else {
    adminApp = admin.initializeApp();
    firebaseConfig = { firestoreDatabaseId: undefined };
  }

  const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || undefined);

  try {
    const collections = await db.listCollections();
    console.log("=== Firestore Collections ===");
    for (const coll of collections) {
      console.log(`Collection: ${coll.id}`);
      const snapshot = await coll.limit(5).get();
      console.log(`  Documents (${snapshot.size}):`);
      for (const doc of snapshot.docs) {
        console.log(`    ID: ${doc.id}`);
        console.log("    Data:", JSON.stringify(doc.data(), null, 2));
      }
    }
    console.log("=============================");
  } catch (err) {
    console.error("Failed to list collections:", err);
  }
}

listAll().then(() => process.exit(0));
