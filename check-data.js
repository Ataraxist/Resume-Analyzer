import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD8S9Y0GlNZ0yJCzGpVdxVzJXVEP6HFT_k",
  authDomain: "resume-analyzer-4d622.firebaseapp.com",
  projectId: "resume-analyzer-4d622",
  storageBucket: "resume-analyzer-4d622.firebasestorage.app",
  messagingSenderId: "802176798472",
  appId: "1:802176798472:web:dfe8c95e5e2cae7b6e652f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkData() {
  console.log('=== Checking Occupations Data ===\n');
  
  // 1. Check a few sample occupations
  console.log('Sample occupations:');
  const sampleQuery = query(collection(db, 'occupations'), limit(3));
  const sampleSnapshot = await getDocs(sampleQuery);
  sampleSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`${doc.id}: ${data.title}`);
    console.log(`  bright_outlook: ${data.bright_outlook}`);
    console.log(`  rapid_growth: ${data.rapid_growth}`);
    console.log(`  numerous_openings: ${data.numerous_openings}`);
  });
  
  // 2. Check bright_outlook occupations
  console.log('\n=== Occupations with bright_outlook = true ===');
  const brightQuery = query(
    collection(db, 'occupations'),
    where('bright_outlook', '==', true),
    orderBy('title'),
    limit(10)
  );
  
  try {
    const brightSnapshot = await getDocs(brightQuery);
    console.log(`Found ${brightSnapshot.size} occupations with bright_outlook = true`);
    brightSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.title} (${doc.id})`);
    });
  } catch (error) {
    console.error('Error querying bright_outlook:', error.message);
    console.log('This might mean the index is not set up or the field doesn\'t exist');
  }
  
  // 3. Search for "law" occupations
  console.log('\n=== Searching for "law" (checking first 100) ===');
  const allQuery = query(collection(db, 'occupations'), orderBy('title'), limit(100));
  const allSnapshot = await getDocs(allQuery);
  
  const lawMatches = [];
  allSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.title?.toLowerCase().includes('law') || 
        data.description?.toLowerCase().includes('law')) {
      lawMatches.push(`${data.title} (${doc.id})`);
    }
  });
  
  console.log(`Found ${lawMatches.length} matches for "law" in first 100:`);
  lawMatches.forEach(match => console.log(`- ${match}`));
  
  // 4. Count bright_outlook occupations
  const brightCountQuery = query(
    collection(db, 'occupations'),
    where('bright_outlook', '==', true)
  );
  const brightCountSnapshot = await getDocs(brightCountQuery);
  console.log(`\nOccupations with bright_outlook = true: ${brightCountSnapshot.size}`);
  
  // 5. Check total count
  const totalSnapshot = await getDocs(collection(db, 'occupations'));
  console.log(`Total occupations in database: ${totalSnapshot.size}`);
}

checkData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });