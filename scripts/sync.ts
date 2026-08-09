import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { products } from "../EDIT_PRODUCT_DATA_HERE.ts";

async function seed() {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let adminApp;
  let firebaseConfig;

  if (fs.existsSync(firebaseConfigPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    adminApp = admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
  } else {
    // Rely on default environment credentials
    adminApp = admin.initializeApp();
    firebaseConfig = { firestoreDatabaseId: undefined };
  }

  const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || undefined);

  try {
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();
    const productNamesInFile = products.map(p => (p as any).name);

    // 1. Remove products that are NOT in the file
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!productNamesInFile.includes(data.name)) {
        await productsRef.doc(doc.id).delete();
        console.log(`Removed product (not in file): ${data.name}`);
      }
    }

    // 2. Add or Update products from the file
    for (const p of products) {
      // Convert images to direct links
      const images = (p.images || []).map(img => {
        if (!img.url) return img;
        const driveRegex = /\/file\/d\/([^\/]+)/;
        const match = img.url.match(driveRegex);
        if (match && match[1]) {
          return {
            ...img,
            url: `https://lh3.googleusercontent.com/u/0/d/${match[1]}=w1000`
          };
        }
        return img;
      });

      const processedProduct = { ...p, images };
      const existing = await productsRef.where('name', '==', (p as any).name).get();
      if (existing.empty) {
        await productsRef.add({
          ...processedProduct,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Added product: ${(p as any).name}`);
      } else {
        const docId = existing.docs[0].id;
        await productsRef.doc(docId).set({
          ...processedProduct,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`Synchronized product: ${(p as any).name}`);
      }
    }
    console.log("Synchronization complete! The store now only displays what is in the file.");
  } catch (err) {
    console.error("Synchronization failed:", err);
  }
}

seed().then(() => process.exit(0));
