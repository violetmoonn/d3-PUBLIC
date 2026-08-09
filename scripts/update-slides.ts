import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

async function run() {
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
    const slideshowUrl = '/uploads/hero_slideshow_slide_1783476026975.jpg';
    const slides = [
      { url: slideshowUrl, type: 'image' },
      { url: 'https://lh3.googleusercontent.com/d/1zdsMKzx2eky-W9GxjtogLdB8CFu6a46g', type: 'image' },
      { url: 'https://lh3.googleusercontent.com/d/1Vva7aQJxxVP6mJE8AM8VbpMWRAp2T6f0', type: 'image' },
      { url: 'https://images.unsplash.com/photo-1550745165-9bc0b252727f?auto=format&fit=crop&q=80&w=2070', type: 'image' }
    ];

    console.log("Updating hero_slides and hero_url in settings...");
    
    await db.collection('settings').doc('hero_slides').set({
      value: slides
    }, { merge: true });

    await db.collection('settings').doc('hero_url').set({
      value: slideshowUrl
    }, { merge: true });

    console.log("Database update successful!");
  } catch (err) {
    console.error("Database update failed:", err);
  }
}

run().then(() => process.exit(0));
