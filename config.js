// Settings for Tundra Academy LMS.
// Put your values between the quotes, save, and upload this file next to index.html.
// Leave everything empty to run with no shared database and no Google features.
// Step-by-step instructions are in README.md.
window.APP_CONFIG = {
  // Shared database (Supabase): makes accounts and data follow people between computers.
  supabaseUrl: "https://bbfeqqvcmqfvlkyojbkj.supabase.co/rest/v1/", // example: "https://abcdxyz.supabase.co"
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZmVxcXZjbXFmdmxreW9qYmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMDU3MjEsImV4cCI6MjEwNjU4MTcyMX0.rHFhTS1e_53K6AHPaG0leI2YVCOfJORb2AuzLreC3OY", // the "anon public" key from Project Settings > API
  pollMs: 4000, // how often (in milliseconds) to check for changes from other computers

  // Google Drive: lets teachers make a copy of a file for every student.
  googleClientId: "1084841387485-4r7fv22invmjsqf6tbuomhhvjmileojq.apps.googleusercontent.com", // example: "1234-abc.apps.googleusercontent.com"
  googleApiKey: "AIzaSyDndQxh3wDe7FWT5KNPiKdDFp79l6ZpaGo", // the API key from Google Cloud > Credentials
  googleAppId: "tundralms", // your Google Cloud project number
};
