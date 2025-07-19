import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

// Define the knowledge base for RAG simulation
const knowledgeBase = [
    {
        topic: "Generative AI",
        keywords: ["generative ai", "genai", "ai generation", "new content"],
        content: "Generative AI refers to artificial intelligence systems capable of generating new content, such as text, images, audio, or video. Large Language Models (LLMs) are a prime example of generative AI, trained on vast datasets to understand and produce human-like language."
    },
    {
        topic: "RAG (Retrieval-Augmented Generation)",
        keywords: ["rag", "retrieval augmented generation", "retrieval", "augmentation"],
        content: "RAG combines the strengths of retrieval-based and generative AI models. It works by first retrieving relevant information from a knowledge base based on a user query, and then using that retrieved context to augment the prompt given to a generative model (like an LLM). This helps reduce hallucinations and grounds responses in factual data."
    },
    {
        topic: "Prompt Engineering",
        keywords: ["prompt engineering", "prompts", "crafting prompts", "guide llms"],
        content: "Prompt engineering is the art and science of crafting effective inputs (prompts) for AI models, especially LLMs, to guide them towards generating desired outputs. It involves techniques like defining roles, setting constraints, providing examples (few-shot learning), and specifying output formats."
    },
    {
        topic: "Vector Databases",
        keywords: ["vector databases", "vector db", "embeddings", "similarity search"],
        content: "Vector databases are specialized databases designed to store, manage, and query high-dimensional vector embeddings. They enable efficient similarity searches, allowing systems like RAG to quickly find semantically similar documents or data points based on their vector representations."
    },
    {
        topic: "Chunking Strategies",
        keywords: ["chunking", "text splitting", "document chunks", "segmenting"],
        content: "Chunking strategies involve breaking down large documents or texts into smaller, manageable segments (chunks) before they are embedded and stored in a vector database. Effective chunking is crucial for RAG, as it ensures that relevant information can be retrieved efficiently without overwhelming the LLM with too much context."
    },
    {
        topic: "Llama 3",
        keywords: ["llama 3", "meta ai", "open-source llm"],
        content: "Llama 3 is a family of large language models developed by Meta AI. It is an open-source model designed for various natural language processing tasks, known for its strong performance across benchmarks. It can be used for text generation, summarization, question answering, and more."
    },
    {
        topic: "Streamlit Deployment",
        keywords: ["streamlit", "deployment", "web app", "python ui"],
        content: "Streamlit is an open-source Python library that simplifies the creation of custom web applications for machine learning and data science. It allows developers to quickly build interactive UIs with minimal code, making it an ideal tool for deploying AI prototypes and demos."
    },
    {
        topic: "Evaluation Metrics (General)",
        keywords: ["evaluation", "metrics", "arize ai", "performance assessment"],
        content: "Evaluating AI models and systems involves using various metrics to assess their performance. For RAG systems, key metrics include context relevance (how well retrieved info matches query), answer faithfulness (is answer supported by context), and answer relevance (is answer relevant to query). Tools like Arize AI help automate this process."
    },
    {
        topic: "AI Clone Purpose",
        keywords: ["ai clone", "chatbot purpose", "intelligent interaction"],
        content: "An 'AI Clone' in this context refers to a sophisticated GenAI chatbot capable of providing informed and contextually relevant responses by leveraging external knowledge, mimicking intelligent interaction over a specific body of information. It's built using RAG to ground responses in facts."
    }
];

// Main App component for the AI Clone Chatbot
function App() {
    // State variables for chat messages, user input, loading status, and Firebase
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false); // To track Firebase auth readiness

    // Ref for scrolling to the bottom of the chat
    const messagesEndRef = useRef(null);

    // Scroll to the latest message whenever messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Firebase Initialization and Authentication
    useEffect(() => {
        try {
            // Retrieve Firebase config and app ID from global variables
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

            if (!firebaseConfig) {
                console.error("Firebase config is not defined. Cannot initialize Firebase.");
                return;
            }

            // Initialize Firebase app
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestoreDb);
            setAuth(firebaseAuth);

            // Authenticate user with custom token or anonymously
            const authenticateUser = async () => {
                const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(firebaseAuth, initialAuthToken);
                    } else {
                        await signInAnonymously(firebaseAuth);
                    }
                } catch (error) {
                    console.error("Firebase authentication error:", error);
                    // Fallback to anonymous sign-in if custom token fails or is not provided
                    await signInAnonymously(firebaseAuth);
                }
            };

            authenticateUser();

            // Listen for authentication state changes
            const unsubscribeAuth = onAuthStateChanged(firebaseAuth, (user) => {
                if (user) {
                    setUserId(user.uid);
                    setIsAuthReady(true); // Auth is ready
                } else {
                    setUserId(null);
                    setIsAuthReady(true); // Auth is ready, but user is null (e.g., anonymous)
                }
            });

            // Cleanup function for auth listener
            return () => unsubscribeAuth();
        } catch (error) {
            console.error("Error initializing Firebase:", error);
        }
    }, []); // Run once on component mount

    // Firestore Listener for Chat History
    useEffect(() => {
        // Only set up listener if Firebase is initialized and auth is ready
        if (db && userId && isAuthReady) {
            // Define the collection path for chat history
            // Using public data path for demonstration of multi-user potential,
            // though for private user data, it would be `/artifacts/${appId}/users/${userId}/chat_history`
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const chatCollectionRef = collection(db, `artifacts/${appId}/public/data/chat_history`);

            // Create a query to order messages by timestamp
            const q = query(chatCollectionRef, orderBy("timestamp", "asc"));

            // Set up real-time listener for chat messages
            const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const fetchedMessages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setMessages(fetchedMessages);
            }, (error) => {
                console.error("Error fetching messages from Firestore:", error);
            });

            // Cleanup function for snapshot listener
            return () => unsubscribeSnapshot();
        }
    }, [db, userId, isAuthReady]); // Re-run if db, userId, or isAuthReady changes

    // Function to simulate RAG retrieval
    const retrieveContext = (query) => {
        const lowerCaseQuery = query.toLowerCase();
        let bestContext = null;
        let maxMatches = 0;

        // Simple keyword matching for demonstration
        for (const item of knowledgeBase) {
            let currentMatches = 0;
            // Check keywords
            for (const keyword of item.keywords) {
                if (lowerCaseQuery.includes(keyword)) {
                    currentMatches++;
                }
            }
            // Check content itself (simple substring match)
            if (item.content.toLowerCase().includes(lowerCaseQuery)) {
                currentMatches++;
            }

            if (currentMatches > maxMatches) {
                maxMatches = currentMatches;
                bestContext = item.content;
            }
        }
        return bestContext;
    };

    // Function to send a message and get AI response
    const handleSendMessage = async () => {
        if (!userInput.trim() || loading || !db || !userId) return;

        setLoading(true);
        const userMessage = {
            text: userInput,
            sender: 'user',
            timestamp: serverTimestamp(), // Use server timestamp for consistency
            userId: userId // Store user ID for potential multi-user display
        };

        // Add user message to Firestore
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const chatCollectionRef = collection(db, `artifacts/${appId}/public/data/chat_history`);

        try {
            await addDoc(chatCollectionRef, userMessage);

            // Simulate RAG: Retrieve context based on user input
            const retrievedContext = retrieveContext(userInput);

            // Prompt Engineering: Augment the prompt with retrieved context
            let prompt = `You are an AI assistant specialized in explaining concepts related to Generative AI, RAG, Prompt Engineering, Vector Databases, and related technologies. Answer the user's question concisely and accurately.`;

            if (retrievedContext) {
                prompt += `\n\nHere is some relevant information:\n${retrievedContext}\n\n`;
            } else {
                prompt += `\n\nNo specific relevant information found in the knowledge base. Try to answer based on general knowledge about AI topics if possible, or state if you don't know.`;
            }

            prompt += `\n\nUser's question: ${userInput}`;
            prompt += `\n\nAnswer:`;

            // Call the LLM (Gemini API)
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = { contents: chatHistory };
            const apiKey = ""; // Canvas will automatically provide this in runtime

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            let aiResponseText = "Sorry, I couldn't get a response from the AI.";
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                aiResponseText = result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected AI response structure:", result);
            }

            const aiMessage = {
                text: aiResponseText,
                sender: 'ai',
                timestamp: serverTimestamp(),
                userId: 'AI' // AI's identifier
            };

            // Add AI response to Firestore
            await addDoc(chatCollectionRef, aiMessage);

            setUserInput(''); // Clear input field
        } catch (error) {
            console.error("Error sending message or getting AI response:", error);
            const errorMessage = {
                text: "An error occurred while processing your request. Please try again.",
                sender: 'ai',
                timestamp: serverTimestamp(),
                userId: 'AI'
            };
            await addDoc(chatCollectionRef, errorMessage); // Log error message to chat
        } finally {
            setLoading(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent new line in textarea
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 font-sans antialiased text-gray-800">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-600 to-purple-700 p-4 text-white shadow-lg rounded-b-xl">
                <h1 className="text-3xl font-extrabold text-center tracking-tight">
                    <span className="inline-block transform -rotate-3 mr-2">🤖</span>
                    AI Clone Chatbot
                    <span className="inline-block transform rotate-3 ml-2">🧠</span>
                </h1>
                {userId && (
                    <p className="text-sm text-center mt-2 opacity-90">
                        Your User ID: <span className="font-mono bg-blue-700 px-2 py-1 rounded-md text-xs">{userId}</span>
                    </p>
                )}
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100 rounded-lg shadow-inner m-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 italic mt-10">
                        Start a conversation! Ask me about Generative AI, RAG, Vector Databases, or Llama 3.
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-md p-3 rounded-xl shadow-md ${
                                msg.sender === 'user'
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none'
                            }`}
                        >
                            <p className="font-semibold text-sm mb-1">
                                {msg.sender === 'user' ? `You (${msg.userId.substring(0, 8)}...)` : 'AI Clone'}
                            </p>
                            <p className="text-base break-words whitespace-pre-wrap">{msg.text}</p>
                            {msg.timestamp && (
                                <p className="text-xs opacity-75 mt-1">
                                    {new Date(msg.timestamp.toDate()).toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} /> {/* Scroll target */}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 shadow-lg rounded-t-xl mx-4 mb-4">
                <div className="flex items-center space-x-3">
                    <textarea
                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none overflow-hidden h-12 transition-all duration-200 ease-in-out"
                        placeholder="Type your message..."
                        value={userInput}
                        onChange={(e) => {
                            setUserInput(e.target.value);
                            // Auto-resize textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = (e.target.scrollHeight) + 'px';
                        }}
                        onKeyPress={handleKeyPress}
                        rows={1}
                        style={{ maxHeight: '150px' }} // Prevent textarea from growing too large
                        disabled={loading || !isAuthReady}
                    />
                    <button
                        onClick={handleSendMessage}
                        className={`p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105
                            ${loading || !isAuthReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading || !isAuthReady}
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </button>
                </div>
                {!isAuthReady && (
                    <p className="text-center text-sm text-red-500 mt-2">Initializing Firebase... Please wait.</p>
                )}
            </div>
        </div>
    );
}

export default App;
