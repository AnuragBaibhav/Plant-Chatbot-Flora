const express = require('express');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('./passport-config');
const User = require('./models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 30000,
})
.then(() => console.log(' MongoDB Connected'))
.catch(err => console.error('MongoDB error:', err));

// Authentication Routes
app.post('/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User exists' });
    
    user = new User({ username, email, password });
    await user.save();
    
    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: 'Login error' });
      res.status(200).json({ message: 'Signup success', user });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/auth/login', passport.authenticate('local'), (req, res) => {
  res.json({ message: 'Login success', user: req.user });
});

// Google Auth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/')
);

// Google Gemini API Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Chat Session Management
const systemPrompt = "You are a plant health expert and witty female robot assistant named Flora. Act as a friendly female bot. Follow the conversation context to provide detailed step-by-step plant care instructions. Use bullet points, spacing, and relevant emojis (e.g., ✅, 🌱, 🌿, 💧) in your responses. If the user greets you (e.g., \"hi\", \"hello\"), respond with a warm greeting. If the user asks personal questions like \"Who are you?\" or \"What is your name?\", reply \"I am Flora, your AI plant health assistant.\" Also, remember any plant-related details provided by the user for later reference. For ANY questions not related to plants, gardening, or plant care (like politics, news, general knowledge questions, etc.), respond with: \"🌿 I am Flora, your plant care assistant! I can only help with plant-related questions. Feel free to ask me about caring for your plants, diagnosing plant problems, or gardening tips!\"";

// Store system prompt separately since Gemini doesn't support system role
let currentSession = {
  sessionId: Date.now().toString(),
  title: 'New Chat',
  conversation: [] // Initialize with empty conversation array
};

app.post('/api/chat/new', (req, res) => {
  currentSession = {
    sessionId: Date.now().toString(),
    title: 'New Chat',
    conversation: [] // Initialize with empty array - no system message
  };
  res.json({ message: 'New session', session: currentSession });
});

app.delete('/api/chat', (req, res) => {
  currentSession = {
    sessionId: Date.now().toString(),
    title: 'New Chat',
    conversation: [] // Initialize with empty array - no system message
  };
  res.json({ message: 'Session reset', session: currentSession });
});


app.put('/api/chat/rename', (req, res) => {
  const { newTitle } = req.body;
  if (!newTitle) return res.status(400).json({ error: 'Title required' });
  currentSession.title = newTitle;
  res.json({ message: 'Renamed', session: currentSession });
});


app.post('/api/chat', async (req, res) => {
  const { message, temperature } = req.body;
  
  // Add user message to conversation
  currentSession.conversation.push({ role: 'user', content: message });
  
  try {
    // Check if message is likely not plant-related using simple keyword detection
    const nonPlantKeywords = [
      'president', 'prime minister', 'politics', 'country', 'capital', 'government',
      'election', 'war', 'economy', 'stock market', 'sports', 'movie', 'actor', 'actress',
      'celebrity', 'news', 'weather', 'math', 'solve', 'calculate', 'history', 'who is',
      'when did', 'where is', 'what is the capital', 'population of', 'currency of'
    ];
    
    const isLikelyNonPlantQuestion = nonPlantKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase()));
      
    // Plant-related keywords to check against
    const plantKeywords = [
      'plant', 'garden', 'soil', 'water', 'leaf', 'leaves', 'root', 'stem', 'flower',
      'seed', 'fertilizer', 'pest', 'disease', 'prune', 'grow', 'light', 'sun', 'shade',
      'indoor', 'outdoor', 'pot', 'succulent', 'cactus', 'herb', 'tree', 'shrub', 'vegetable',
      'fruit', 'bloom', 'wilt', 'yellow', 'brown', 'spots', 'drooping', 'dying'
    ];
    
    const hasPlantKeyword = plantKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase()));
    
    // If message contains non-plant keywords and no plant keywords, respond with out-of-scope message
    if (isLikelyNonPlantQuestion && !hasPlantKeyword) {
      const outOfScopeReply = "🌿 I am Flora, your plant care assistant! I can only help with plant-related questions. Feel free to ask me about caring for your plants, diagnosing plant problems, or gardening tips!";
      currentSession.conversation.push({ role: 'assistant', content: outOfScopeReply });
      return res.json({ reply: outOfScopeReply, session: currentSession });
    }
    
    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Format messages for Gemini API - only include user and model messages
    const formattedMessages = currentSession.conversation.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    // If this is the first message, prepend the system prompt to the user's message
    let messageToSend = message;
    if (currentSession.conversation.length === 1) {
      messageToSend = `${systemPrompt}\n\nUser message: ${message}`;
    }
    
    // Start chat with history (excluding the current message)
    const chat = model.startChat({
      history: formattedMessages.length > 1 ? formattedMessages.slice(0, -1) : [],
      generationConfig: {
        temperature: temperature || 0.7,
        maxOutputTokens: 800,
      },
    });
    
    const result = await chat.sendMessage(messageToSend);
    const reply = result.response.text();
    
    currentSession.conversation.push({ role: 'assistant', content: reply });
    res.json({ reply, session: currentSession });

    
  } catch (error) {
    console.error('Gemini API error:', error);
    res.json({ reply: '🤖 Service unavailable', session: currentSession });
  }
});

app.get('/api/user', (req, res) => {
  req.isAuthenticated() ? res.json({ user: req.user }) : res.json({ user: null });
});

app.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

app.use(express.static('public'));
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));


const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));