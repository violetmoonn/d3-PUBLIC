import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function queryCollections() {
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

  const collections = [
    'settings',
    'drive_links',
    'discounts',
    'transmissions',
    'announcements'
  ];

  for (const collName of collections) {
    console.log(`\n=== Collection: ${collName} ===`);
    try {
      const snapshot = await db.collection(collName).get();
      console.log(`Documents count: ${snapshot.size}`);
      snapshot.forEach(doc => {
        console.log(`Document ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
      });
    } catch (err: any) {
      console.error(`Error querying ${collName}:`, err.message);
    }
  }
}

queryCollections().then(() => process.exit(0));
