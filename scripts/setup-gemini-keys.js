/**
 * Script to populate Gemini API keys in Firestore
 * Run this locally with admin credentials to add keys
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

// Check for encryption key
const encryptionKey = process.env.GEMINI_ENCRYPTION_KEY || process.argv[2];
if (!encryptionKey) {
  console.error('❌ Error: Encryption key is required');
  console.error('Usage: node setup-gemini-keys.js <encryption_key>');
  console.error('   or: GEMINI_ENCRYPTION_KEY=your_key node setup-gemini-keys.js');
  process.exit(1);
}

// Initialize admin SDK with service account
const serviceAccount = require('../firebase/service-account.json'); // Path to your service account file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Encryption setup
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = encryptionKey;

function encryptApiKey(apiKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Your Gemini API keys (add all 100+ keys here)
const API_KEYS = [
  'AIzaSyDJcRVWCdiFfxGhemcXInruY1gSrG3dnkc',
  'AIzaSyC1MVvHCTFpFZTwUA3XG8IANZ-m5qfJZu0',
  'AIzaSyCkKf8BLHwD7IJREPxUlt7zQ8UOG_XgUp8',
  // ... add all your keys
];

async function populateKeys() {
  const batch = db.batch();
  const now = admin.firestore.Timestamp.now();

  API_KEYS.forEach((apiKey, index) => {
    const docRef = db.collection('geminiApiKeys').doc(`key_${index + 1}`);
    
    batch.set(docRef, {
      apiKey: encryptApiKey(apiKey),
      dailyRequestCount: 0,
      lastResetTimestampDaily: now,
      currentMinuteTimestamp: now,
      currentMinuteRequestCount: 0,
      isDisabled: false,
      lastUsedTimestamp: null,
      createdAt: now
    });
  });

  try {
    await batch.commit();
    console.log(`Successfully added ${API_KEYS.length} API keys to Firestore`);
  } catch (error) {
    console.error('Error adding keys:', error);
  }

  process.exit();
}

// Run the script
populateKeys();
