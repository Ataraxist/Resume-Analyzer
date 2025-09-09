const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { getStorage } = require('firebase-admin/storage');
const { onCall } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();
// const auth = getAuth(); // Available for functions that need it
// const storage = getStorage(); // Available for functions that need it

// Import function modules
const { analyzeResume } = require('./src/analyzeResume.js');
const { resume } = require('./src/resume.js');
const { fetchOccupationsList } = require('./src/fetchOccupationsList.js');
const { searchOccupations } = require('./src/searchOccupations.js');
const { getOccupationDetails } = require('./src/getOccupationDetails.js');
const { fetchOccupation } = require('./src/fetchOccupation.js');
const { initializeJobZones } = require('./src/initializeJobZones.js');

// Callable Functions (HTTPS) - v2 with CORS enabled
// Functions that require authentication
exports.analyzeResumeFunction = onCall({ 
  cors: true,
  timeoutSeconds: 540,  // 9 minutes (max allowed)
  memory: '1GiB'       // More memory for analysis
}, analyzeResume);
exports.resumeFunction = onCall({ 
  cors: true,
  timeoutSeconds: 300,  // 5 minutes (default is 60 seconds)
  memory: '512MiB'      // Increase from default 256MB
}, resume);

// Functions that allow unauthenticated access
// Note: The function implementations themselves handle auth checking
exports.searchOccupationsFunction = onCall({ cors: true }, searchOccupations);
exports.fetchOccupationsListFunction = onCall({ cors: true }, fetchOccupationsList);
exports.getOccupationDetailsFunction = onCall({ cors: true }, getOccupationDetails);
exports.fetchOccupationFunction = onCall({ cors: true }, fetchOccupation);

// Admin function to initialize Job Zones (run once)
exports.initializeJobZonesFunction = onCall({ cors: true }, initializeJobZones);

// Note: User creation will be handled in the frontend after successful auth
// We'll create the user document when they first sign in