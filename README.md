AI Clone Chatbot
This project implements a basic Generative AI chatbot with a simulated Retrieval-Augmented Generation (RAG) pipeline, demonstrating key concepts like prompt engineering and Firebase integration for chat history persistence. It's built using React and Tailwind CSS for a modern, responsive user interface.

Features
Interactive Chat Interface: A clean and responsive UI for user interaction.

Simulated RAG: A hardcoded knowledge base and keyword-based retrieval logic demonstrate how relevant context can be fetched.

Prompt Engineering: User queries are augmented with retrieved context to guide the LLM's responses.

Generative AI: Integrates with the gemini-2.0-flash model (via a placeholder API key that would be replaced with your actual key/environment variable in a real deployment).

Firebase Firestore Integration: Chat messages are stored and retrieved in real-time, allowing for persistent chat history.

Firebase Authentication: Handles anonymous user authentication.

Responsive Design: Styled with Tailwind CSS for optimal viewing on various devices.

Setup Instructions
To run this project locally, you'll need Node.js and npm (or Yarn) installed.

1. Initialize a React Project
If you don't have an existing React project, you can create one using Create React App:

npx create-react-app ai-clone-chatbot
cd ai-clone-chatbot

2. Install Dependencies
Install the necessary dependencies for Firebase and Tailwind CSS:

npm install firebase tailwindcss postcss autoprefixer
# Or using yarn:
# yarn add firebase tailwindcss postcss autoprefixer

3. Configure Tailwind CSS
Create tailwind.config.js and postcss.config.js in your project root.

tailwind.config.js:

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Using Inter font
      },
    },
  },
  plugins: [],
}

postcss.config.js:

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

Add Tailwind CSS directives to your src/index.css file (or create it if it doesn't exist):

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Optional: Add Inter font import if not already globally available */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

4. Replace src/App.js
Delete the existing src/App.js and src/App.css (if any) and replace src/App.js with the content provided in the AI Clone Chatbot (React) immersive.

5. Firebase Project Setup
Go to the Firebase Console.

Create a new project.

Add a new web app to your Firebase project.

During the setup, you will get your Firebase configuration object. It looks something like this:

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

Update src/App.js:
In src/App.js, locate the useEffect block where Firebase is initialized. You'll see a placeholder for firebaseConfig. For local development, you should replace the typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null; line with your actual Firebase config object:

// Replace this block for local development with your actual Firebase config
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
// The line below should be removed or commented out if you hardcode firebaseConfig
// const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

Important: For production, it's best practice to use environment variables (e.g., .env file with REACT_APP_FIREBASE_API_KEY) to store sensitive keys.

Firebase Security Rules:
For the chat history to work, you need to set up Firestore security rules. Go to Firestore Database -> Rules in your Firebase console and update them to allow read/write access for authenticated users (for a public chat, or specific user access for private data).

Example Public Chat Rules (for /artifacts/{appId}/public/data/chat_history):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/chat_history/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

Note: The __app_id variable is specific to the Canvas environment. For a standalone project, you would define a fixed appId string in your code (e.g., const appId = 'my-chatbot-app';) and use that in your Firestore paths.

6. Gemini API Key
The gemini-2.0-flash model call in src/App.js uses const apiKey = ""; which is automatically provided in the Canvas environment. For a standalone project, you will need to:

Obtain a Gemini API key from Google AI Studio.

Store it securely, preferably as an environment variable (e.g., REACT_APP_GEMINI_API_KEY).

Modify the handleSendMessage function in src/App.js to use this environment variable:

// In handleSendMessage function
const apiKey = process.env.REACT_APP_GEMINI_API_KEY; // Get from environment variable
// Ensure you have a .env file in your project root:
// REACT_APP_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

7. Run the Application
Once all dependencies are installed and configurations are set, you can run the React application:

npm start
# Or using yarn:
# yarn start

This will open the chatbot in your browser, usually at http://localhost:3000.

Project Structure (Typical React App)
After following these steps, your project directory will generally look like this:

ai-clone-chatbot/
├── public/
│   └── index.html
│   └── ... (other public assets)
├── src/
│   ├── App.js           <-- This is the code provided
│   ├── index.css
│   ├── index.js
│   └── ... (other React files)
├── package.json
├── package-lock.json (or yarn.lock)
├── tailwind.config.js
├── postcss.config.js
├── .env (optional, for API keys)
└── README.md            <-- This file

This structure is standard for a React application and suitable for hosting on GitHub.