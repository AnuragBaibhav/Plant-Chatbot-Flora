// Array of dynamic placeholder quotes
const placeholderQuotes = [
  "🌱 Every plant has a story. Let's help yours thrive! - Flora",
  "🌿 Yellow leaves? Brown spots? Ask me about plant problems! - Flora",
  "💧 Watering schedules tailored to your plants and environment! - Flora",
  "🌞 Let me help you find the perfect light for your plants! - Flora",
  "🍃 Wondering about fertilizers? I can guide you! - Flora",
  "🌵 Succulents, tropicals, or herbs - I'm here to help them flourish! - Flora",
  "🌸 From seed to bloom, I'll be your plant care companion! - Flora",
  "🪴 Indoor plant problems? Let's diagnose and treat them together! - Flora"
];

const botName = "Flora";

// Plant-related emoji set for responses
const plantEmojis = ['🌱', '🌿', '🍃', '🌵', '🌴', '🌳', '🌲', '🍀', '🪴', '🌷', '🌸', '💐', '🌺', '🌻', '🌼', '🍂', '💧', '☀️', '🌤️', '🌡️', '✂️', '🧪'];

// Function to get random plant emoji
function getRandomPlantEmoji() {
  return plantEmojis[Math.floor(Math.random() * plantEmojis.length)];
}

function getRandomPlaceholder() {
  const index = Math.floor(Math.random() * placeholderQuotes.length);
  return placeholderQuotes[index];
}

// Global variable to track current typing interval
let currentTypingInterval = null;

function simulateTyping(text, element, callback) {
  // Clear any existing typing interval
  if (currentTypingInterval) {
    clearInterval(currentTypingInterval);
    currentTypingInterval = null;
  }
  
  element.innerHTML = ''; 
  let index = 0;
  
  // Create timestamp element but don't append it until typing is complete
  const timestamp = document.createElement('div');
  timestamp.className = 'message-timestamp';
  timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  timestamp.style.display = 'none'; // Hide timestamp initially
  
  // Create content element for typing effect
  const contentElement = document.createElement('div');
  contentElement.className = 'message-content';
  
  // Add typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'typing-indicator';
  typingIndicator.innerHTML = '<span></span><span></span><span></span>';
  element.appendChild(typingIndicator);
  
  // Ensure scroll to bottom when typing starts
  const chatBox = document.getElementById('chat-box');
  // Ensure scrolling works properly
  ensureScrollToBottom();
  
  currentTypingInterval = setInterval(() => {
    if (index === 0) {
      // Remove typing indicator when starting to show text
      element.removeChild(typingIndicator);
      element.appendChild(contentElement);
      element.appendChild(timestamp); // Append timestamp but it's still hidden
    }
    
    // Process markdown-like formatting with improved spacing
    if (index < text.length) {
      if (text.substring(index).startsWith('\n')) {
        contentElement.innerHTML += '<br>';
        index += 2;
      } else if (text.substring(index).startsWith('\n- ')) {
        contentElement.innerHTML += '<br>• ';
        index += 3;
      } else if (text.substring(index).startsWith('\n')) {
        contentElement.innerHTML += '<br>';
        index += 1;
      } else {
        contentElement.innerHTML += text.charAt(index);
        index++;
      }
      // Scroll to bottom as text is being typed
      // Ensure scrolling works properly
  ensureScrollToBottom();
    }
    
    if (index >= text.length) {
      clearInterval(currentTypingInterval);
      currentTypingInterval = null;
      timestamp.style.display = 'block'; // Show timestamp after typing is complete
      // Ensure scroll to bottom when typing completes
      // Ensure scrolling works properly
  ensureScrollToBottom();
      if (callback) callback();
    }
  }, 28); // Fast typing speed for smooth effect
}

let sessions = JSON.parse(localStorage.getItem('chatSessions')) || [];

function createNewSession() {
  return {
    sessionId: Date.now().toString(),
    title: 'New Chat',
    createdAt: new Date().toISOString(),
    conversation: [
      {
        role: 'system',
        content: 'You are a plant health expert and witty female robot assistant named Flora. Act as a friendly female bot. Follow the conversation context to provide detailed step-by-step plant care instructions. Use bullet points, spacing, and relevant emojis (e.g., ✅, 🌱, 🌿, 💧) in your responses. If the user greets you (e.g., "hi", "hello"), respond with a warm greeting. If the user asks personal questions like "Who are you?" or "What is your name?", reply "I am Flora, your AI plant health assistant." Also, remember any plant-related details provided by the user for later reference. If the question is not about plants or gardening, respond with "Out of my scope".'
      }
    ]
  };
}

let currentSession = sessions.length > 0 ? sessions[sessions.length - 1] : createNewSession();

function saveSessions() {
  localStorage.setItem('chatSessions', JSON.stringify(sessions));
}

function updateSession() {
  const index = sessions.findIndex(s => s.sessionId === currentSession.sessionId);
  if (index !== -1) {
    sessions[index] = currentSession;
  } else {
    sessions.push(currentSession);
  }
  saveSessions();
  loadChatHistory();
}

function displayPlaceholder() {
  const chatBox = document.getElementById('chat-box');
  if (currentSession.conversation.length === 1) {
    chatBox.innerHTML = `
      <div class="placeholder">
        <p>${getRandomPlaceholder()}</p>
      </div>
    `;
    chatBox.classList.add('placeholder-active');
  }
}

function removePlaceholder() {
  const chatBox = document.getElementById('chat-box');
  chatBox.classList.remove('placeholder-active');
  if (chatBox.querySelector('.placeholder')) {
    chatBox.innerHTML = '';
  }
}

function startNewChat() {
  updateSession();
  currentSession = createNewSession();
  document.getElementById('chat-box').innerHTML = '';
  loadChatHistory();
  displayPlaceholder();
}


function deleteSession(sessionId) {
  sessions = sessions.filter(s => s.sessionId !== sessionId);
  if (currentSession.sessionId === sessionId) {
    currentSession = createNewSession();
    document.getElementById('chat-box').innerHTML = '';
  }
  saveSessions();
  loadChatHistory();
  loadSession(currentSession);
}


function renameSession(sessionId, newTitle) {
  let session = sessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.title = newTitle;
    if (currentSession.sessionId === sessionId) {
      currentSession.title = newTitle;
    }
    saveSessions();
    loadChatHistory();
  }
}


function shareSession(sessionId) {
  const shareURL = `${window.location.origin}/chat/${sessionId}`;
  alert('Share this URL: ' + shareURL);
}

function loadChatHistory() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  
  // Group sessions by date
  const groupedSessions = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  sessions.forEach(session => {
    // Create date string for grouping
    const sessionDate = session.createdAt ? new Date(session.createdAt).toDateString() : today;
    let dateGroup;
    
    if (sessionDate === today) {
      dateGroup = 'Today';
    } else if (sessionDate === yesterday) {
      dateGroup = 'Yesterday';
    } else {
      dateGroup = sessionDate;
    }
    
    if (!groupedSessions[dateGroup]) {
      groupedSessions[dateGroup] = [];
    }
    
    groupedSessions[dateGroup].push(session);
  });
  
  // Sort date groups (Today, Yesterday, then other dates in descending order)
  const sortedGroups = Object.keys(groupedSessions).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return new Date(b) - new Date(a);
  });
  
  // Create date sections and add sessions
  sortedGroups.forEach(dateGroup => {
    // Add date section header
    const dateHeader = document.createElement('div');
    dateHeader.className = 'history-date-section';
    dateHeader.textContent = dateGroup;
    historyList.appendChild(dateHeader);
    
    // Add sessions for this date
    groupedSessions[dateGroup].forEach(session => {
      const li = document.createElement('li');
      li.className = 'chat-session-item';
      li.setAttribute('data-session-id', session.sessionId);
    
      // Create title and date elements
      const titleContainer = document.createElement('div');
      titleContainer.className = 'chat-session-title-container';
      
      const titleSpan = document.createElement('span');
      titleSpan.className = 'chat-session-title';
      
      // Generate a title based on first user message if available
      if (session.title === 'New Chat' && session.conversation.length > 1) {
        const firstUserMsg = session.conversation.find(msg => msg.role === 'user');
        if (firstUserMsg) {
          // Use first 30 chars of first message as title
          const title = firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
          titleSpan.textContent = title;
        } else {
          titleSpan.textContent = session.title;
        }
      } else {
        titleSpan.textContent = session.title;
      }
      
      titleContainer.appendChild(titleSpan);
      
      // Add date if not Today/Yesterday
      if (dateGroup !== 'Today' && dateGroup !== 'Yesterday') {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'chat-session-date';
        const date = new Date(session.createdAt || Date.now());
        dateSpan.textContent = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        titleContainer.appendChild(dateSpan);
      }
      
      li.appendChild(titleContainer);
    
      const optionsSpan = document.createElement('span');
      optionsSpan.className = 'chat-session-options';
      optionsSpan.textContent = '⋮';
      li.appendChild(optionsSpan);
    
      const menuDiv = document.createElement('div');
      menuDiv.className = 'options-menu';
    
      const renameBtn = document.createElement('button');
      renameBtn.textContent = 'Rename Chat';
      renameBtn.onclick = (e) => {
        e.stopPropagation();
        const newTitle = prompt('Enter new chat title:', titleSpan.textContent);
        if (newTitle) renameSession(session.sessionId, newTitle);
      };
      menuDiv.appendChild(renameBtn);
    
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete Chat';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this chat?')) {
          deleteSession(session.sessionId);
        }
      };
      menuDiv.appendChild(deleteBtn);
    
      const shareBtn = document.createElement('button');
      shareBtn.textContent = 'Share Chat';
      shareBtn.onclick = (e) => {
        e.stopPropagation();
        shareSession(session.sessionId);
      };
      menuDiv.appendChild(shareBtn);
    
      li.appendChild(menuDiv);
    
      optionsSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.options-menu').forEach(menu => {
          if (menu !== menuDiv) menu.style.display = 'none';
        });
        menuDiv.style.display = (menuDiv.style.display === 'block') ? 'none' : 'block';
      });
    
      li.addEventListener('click', () => {
        loadSession(session);
      });
    
      historyList.appendChild(li);
    });
  });
  
  // Ensure registration number is always displayed at the bottom of history panel
  const historyPanel = document.querySelector('.history-panel');
  
  // Make sure history panel has position relative for absolute positioning to work
  historyPanel.style.position = 'relative';
  
}
// Helper function to ensure scrolling works consistently
function ensureScrollToBottom() {
  const chatBox = document.getElementById('chat-box');
  // Use setTimeout to ensure this happens after DOM updates
  setTimeout(() => {
    // Scroll to the bottom of the chat box
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 10);
}

function loadSession(session) {
  currentSession = session;
  const chatBox = document.getElementById('chat-box');
  const welcomeScreen = document.getElementById('welcome-screen');
  
  // Hide welcome screen when loading a session
  welcomeScreen.style.display = 'none';
  
  removePlaceholder();
  chatBox.innerHTML = '';
  
  session.conversation.forEach((msg, index) => {
    if (msg.role === 'system') return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = msg.role === 'user' ? 'user-msg' : 'bot-msg';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (msg.role === 'user') {
      contentDiv.innerHTML = `You: ${msg.content}`;
    } else {
      // Check if the message already starts with the bot name to prevent duplication
      let botContent = msg.content;
      if (botContent.startsWith(`${botName}:`)) {
        // If it already has the bot name prefix, ensure there's no duplication
        botContent = botContent.replace(new RegExp(`^${botName}:\s*${botName}:`, 'i'), `${botName}:`);
        contentDiv.innerHTML = botContent.replace(/\n\n/g, '<br><br>').replace(/\n- /g, '<br>• ');
      } else {
        contentDiv.innerHTML = `${botName}: ${botContent.replace(/\n\n/g, '<br><br>').replace(/\n- /g, '<br>• ')}`;
      }
    }
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    msgDiv.appendChild(contentDiv);
    msgDiv.appendChild(timestamp);
    chatBox.appendChild(msgDiv);
    
    // Show timestamps with a staggered delay to simulate the chat loading
    setTimeout(() => {
      timestamp.style.display = 'block';
      // Ensure scrolling after each message timestamp appears
      ensureScrollToBottom();
    }, 300 * (index + 1));
  });
  
  // Initial scroll to bottom
  ensureScrollToBottom();
}

async function sendMessage() {
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const welcomeScreen = document.getElementById('welcome-screen');
  const sendBtn = document.getElementById('send-btn');
  const message = userInput.value.trim();
  if (!message) return;
  
  // Hide welcome screen on first message
  welcomeScreen.style.display = 'none';
  
  removePlaceholder();
  
  // Create user message with timestamp
  const userMsgDiv = document.createElement('div');
  userMsgDiv.className = 'user-msg';
  
  const userContent = document.createElement('div');
  userContent.className = 'message-content';
  userContent.textContent = `You: ${message}`;
  
  const timestamp = document.createElement('div');
  timestamp.className = 'message-timestamp';
  timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  timestamp.style.display = 'none'; // Hide timestamp initially
  
  userMsgDiv.appendChild(userContent);
  userMsgDiv.appendChild(timestamp);
  chatBox.appendChild(userMsgDiv);
  
  // Show timestamp after a brief delay to simulate message being sent
  setTimeout(() => {
    timestamp.style.display = 'block';
  }, 500);
  
  currentSession.conversation.push({ role: 'user', content: message });
  userInput.value = '';
  
  // Change send button to stop button
  sendBtn.innerHTML = '<i class="fas fa-stop"></i>';
  sendBtn.classList.add('stop-btn');
  
  // Store original onclick function
  const originalOnClick = sendBtn.onclick;
  
  // Change button function to stop typing
  sendBtn.onclick = () => {
    if (currentTypingInterval) {
      clearInterval(currentTypingInterval);
      currentTypingInterval = null;
      
      // Reset button back to send
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
      sendBtn.classList.remove('stop-btn');
      sendBtn.onclick = originalOnClick;
    }
  };
  
  // Check if this is a scheduling or task info request
  const schedulerResponse = handleSchedulingInChat(message);
  
  // Fixed temperature value since slider is removed
  const temperature = 0.7;
  
  try {
    // If we have a scheduler response, use it directly instead of calling the API
    let data = { reply: '' };
    
    if (!schedulerResponse) {
      // Only call the API if it's not a scheduling-related request
      const response = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, temperature })
      });
      data = await response.json();
    }
    
    let replyText = data.reply;
    
    // If this was a scheduling or task info request, use the message from the response
    if (schedulerResponse) {
      replyText = schedulerResponse.message;
      
      // If this was a scheduling action, update the task counter
      if (schedulerResponse.type === 'scheduling' && schedulerResponse.action === 'created') {
        updateTaskCounter(); // Update the task counter in the header
      }
    }
    
    replyText = replyText.replace(/###/g, '\n\n');
    replyText = replyText.replace(/-\s/g, '\n- ');
    
    // Fix the duplicate 'Anna: Anna:' issue by checking if the reply already contains the bot name
    if (replyText.startsWith(`${botName}:`)) {
      // If it already has the bot name prefix, ensure there's no duplication
      replyText = replyText.replace(new RegExp(`^${botName}:\s*${botName}:`, 'i'), `${botName}:`);
    } else {
      // If it doesn't have the bot name prefix, add it
      replyText = `${botName}: ${replyText}`;
    }
    
    const botMsgDiv = document.createElement('div');
    botMsgDiv.className = 'bot-msg';
    chatBox.appendChild(botMsgDiv);
    
    simulateTyping(replyText, botMsgDiv, () => {
      // Reset button back to send when typing is complete
      sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
      sendBtn.classList.remove('stop-btn');
      sendBtn.onclick = originalOnClick;
      
      currentSession.conversation.push({ role: 'assistant', content: replyText });
      updateSession();
    });
  } catch (error) {
    // Reset button back to send on error
    sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    sendBtn.classList.remove('stop-btn');
    sendBtn.onclick = originalOnClick;
    
    const errDiv = document.createElement('div');
    errDiv.className = 'bot-msg';
    
    const errContent = document.createElement('div');
    errContent.className = 'message-content';
    errContent.textContent = `${botName}: 🔧 Maintenance in progress!`;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    errDiv.appendChild(errContent);
    errDiv.appendChild(timestamp);
    chatBox.appendChild(errDiv);
  }
  // Ensure scrolling works properly
  ensureScrollToBottom();
}

async function checkUserStatus() {
  try {
    const res = await fetch('/api/user');
    const data = await res.json();
    const authBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const welcomeText = document.getElementById('welcome-text');

    if (data.user) {
      userMenu.style.display = 'block';
      authBtn.style.display = 'none';
      welcomeText.textContent = `Welcome, ${data.user.firstName || data.user.username}`;
      
      document.getElementById('username-btn').addEventListener('click', toggleDropdown);
    } else {
      userMenu.style.display = 'none';
      authBtn.style.display = 'block';
    }
  } catch (error) {
    console.error('Error checking user status:', error);
  }
}

function toggleDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('dropdown-menu');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

window.addEventListener('click', () => {
  document.getElementById('dropdown-menu').style.display = 'none';
});

async function logoutUser() {
  try {
    const res = await fetch('/logout');
    if (res.ok) {
      document.getElementById('user-menu').style.display = 'none';
      document.getElementById('login-btn').style.display = 'block';
      
      sessions = [];
      localStorage.removeItem('chatSessions');
      currentSession = createNewSession();
      loadChatHistory();
      displayPlaceholder();
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

document.getElementById('login-btn').addEventListener('click', () => {
  document.getElementById('auth-modal').style.display = 'flex';
});
async function logoutUser() {
  try {
    const res = await fetch('/logout');
    if (res.ok) {
      document.getElementById('login-btn').textContent = 'Login / Signup';
      document.getElementById('login-btn').onclick = () => {
        document.getElementById('auth-modal').style.display = 'flex';
      };
      sessions = [];
      localStorage.removeItem('chatSessions');
      currentSession = createNewSession();
      loadChatHistory();
      displayPlaceholder();
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}
// Function to update the task counter in the header
function updateTaskCounter() {
  const taskCounter = document.getElementById('task-counter');
  const upcomingTasks = getUpcomingTasks();
  
  if (upcomingTasks.length > 0) {
    taskCounter.textContent = upcomingTasks.length;
    taskCounter.style.display = 'flex';
  } else {
    taskCounter.style.display = 'none';
  }
}

window.addEventListener('load', () => {
  checkUserStatus();
  loadChatHistory();
  
  // Show welcome screen by default
  const welcomeScreen = document.getElementById('welcome-screen');
  welcomeScreen.style.display = 'flex';
  
  if (currentSession.conversation.length === 1) {
    displayPlaceholder();
  } else {
    loadSession(currentSession);
  }
  
  // Initialize scheduler
  updateTaskCounter();
  
  // Registration number is now handled in loadChatHistory function
});
document.getElementById('user-input').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendMessage();
});

// Feature buttons functionality
function insertQuery(query) {
  const userInput = document.getElementById('user-input');
  userInput.value = query;
  sendMessage();
}

document.getElementById('plant-care-btn').addEventListener('click', function() {
  insertQuery('Give me tips for general plant care');
});

document.getElementById('disease-identification-btn').addEventListener('click', function() {
  insertQuery('How can I identify common plant diseases?');
});

document.getElementById('watering-schedule-btn').addEventListener('click', function() {
  insertQuery('What is the ideal watering schedule for indoor plants?');
});

document.getElementById('fertilization-btn').addEventListener('click', function() {
  insertQuery('When and how should I fertilize my plants?');
});

// Temperature slider removed as requested

document.getElementById('light-requirements-btn').addEventListener('click', function() {
  insertQuery('What are the light requirements for different types of plants?');
});

document.getElementById('seasonal-care-btn').addEventListener('click', function() {
  insertQuery('How should I adjust plant care based on seasons?');
});

document.getElementById('new-chat-btn').addEventListener('click', function() {
  startNewChat();
});


document.getElementById('login-btn').addEventListener('click', () => {
  document.getElementById('auth-modal').style.display = 'flex';
});

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('auth-modal').style.display = 'none';
});

document.getElementById('tab-signup').addEventListener('click', () => {
  document.getElementById('signup-section').style.display = 'block';
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('tab-signup').classList.add('active');
  document.getElementById('tab-login').classList.remove('active');
});

document.getElementById('tab-login').addEventListener('click', () => {
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('signup-section').style.display = 'none';
  document.getElementById('tab-login').classList.add('active');
  document.getElementById('tab-signup').classList.remove('active');
});

document.getElementById('google-signup-btn').addEventListener('click', () => {
  window.location.href = 'http://localhost:4000/auth/google';
});

document.getElementById('google-login-btn').addEventListener('click', () => {
  window.location.href = 'http://localhost:4000/auth/google';
});

document.getElementById('signup-submit').addEventListener('click', async () => {
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const res = await fetch('http://localhost:4000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    console.log(data);
    
    if (data.message && data.message.includes('Signup success')) {
      document.getElementById('auth-modal').style.display = 'none';
      checkUserStatus();
      window.location.href = '/';
    } else {
      alert(data.message || 'Signup failed. Please try again.');
    }
  } catch (error) {
    console.error('Signup error:', error);
    alert('Signup failed. Please check the console for more details.');
  }
});

document.getElementById('login-submit').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log(data);
    if (data.message === 'Login success') {
      document.getElementById('auth-modal').style.display = 'none';
      checkUserStatus();
      window.location.href = '/';
    } else {
      alert(data.message || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed. Please check the console for more details.');
  }
});