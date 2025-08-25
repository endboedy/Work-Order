
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.GCP_SA_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('your-collection').get();
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

run();
