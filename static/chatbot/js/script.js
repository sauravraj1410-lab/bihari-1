document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const chatHistory = document.querySelector('.chat-history');

    // NEW DOM Elements (added)
    const sidebar = document.querySelector('.sidebar');
    const bottomNavIcons = document.querySelectorAll('.bottom-nav i');

    // API Endpoint
    const API_URL = '/api/chat/';
    
    // Initialize the application
    function init() {
        setupEventListeners();
        loadChatHistory();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Handle form submission
        chatForm.addEventListener('submit', handleSubmit);
        
        // Handle Enter key (shift + enter for new line)
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
        });
    }
    
    // Handle form submission
    async function handleSubmit(e) {
        e.preventDefault();
        
        const message = userInput.value.trim();
        if (!message) return;
        
        // Clear input
        userInput.value = '';
        
        // Add user message to chat
        addMessage('user', message);
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        
        try {
            // Send message to backend
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken') || ''
                },
                body: JSON.stringify({ message })
            });
            
            // Remove typing indicator
            typingIndicator.remove();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Add bot response to chat
            if (data.reply) {
                addMessage('bot', data.reply);
            } else if (data.error) {
                addMessage('bot', `Error: ${data.error}`);
            }
            
            // Save to chat history
            saveToHistory(message, data.reply || data.error);
            
        } catch (error) {
            console.error('Error:', error);
            typingIndicator.remove();
            addMessage('bot', 'Sorry, there was an error processing your request. Please try again.');
        }
    }
    
    // Add a message to the chat
    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender}-message message`;
        
        // Format message with newlines
        const formattedText = text.replace(/\n/g, '<br>');
        
        if (sender === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">
                        <p>${formattedText}</p>
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="bot-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-text">
                        <p>${formattedText}</p>
                    </div>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'bot-message message';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="bot-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }
    
    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Save chat to history
    function saveToHistory(userMessage, botReply) {
        const history = JSON.parse(localStorage.getItem('tuni_chat_history') || '[]');
        const timestamp = new Date().toISOString();
        
        history.unshift({
            user: userMessage,
            bot: botReply,
            timestamp: timestamp
        });
        
        // Keep only the last 20 conversations
        if (history.length > 20) {
            history.pop();
        }
        
        localStorage.setItem('tuni_chat_history', JSON.stringify(history));
        updateChatHistory(history);
    }
    
    // Load chat history
    function loadChatHistory() {
        const history = JSON.parse(localStorage.getItem('tuni_chat_history') || '[]');
        updateChatHistory(history);
    }
    
    // Update chat history sidebar
    function updateChatHistory(history) {
        chatHistory.innerHTML = '';
        
        if (history.length === 0) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'empty-history';
            emptyMessage.textContent = 'No chat history yet';
            chatHistory.appendChild(emptyMessage);
            return;
        }
        
        history.forEach((chat, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            // Get first 50 chars of user message for preview
            const preview = chat.user.length > 50 
                ? chat.user.substring(0, 50) + '...' 
                : chat.user;
            
            historyItem.innerHTML = `
                <div class="history-preview">${preview}</div>
                <div class="history-time">${formatTime(chat.timestamp)}</div>
            `;
            
            // Load the conversation when clicked
            historyItem.addEventListener('click', () => {
                loadConversation(chat);
            });
            
            chatHistory.appendChild(historyItem);
        });
    }
    
    // Load a specific conversation
    function loadConversation(chat) {
        chatMessages.innerHTML = '';
        
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'welcome-message';
        welcomeMessage.innerHTML = `
            <div class="bot-message">
                <div class="message-content">
                    <div class="bot-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-text">
                        <p>Hello! I'm Tuni, your AI assistant. How can I help you today?</p>
                    </div>
                </div>
            </div>
        `;
        chatMessages.appendChild(welcomeMessage);
        
        addMessage('user', chat.user);
        addMessage('bot', chat.bot);
    }
    
    // Format timestamp
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Get CSRF token from cookies
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    /* ------------------------------------------- */
    /*          NEW ADDED FUNCTIONS BELOW          */
    /* ------------------------------------------- */

    // Toggle Sidebar (Mobile)
    window.toggleSidebar = function () {
        sidebar.classList.toggle('hidden');
    };

    // Dark Mode Toggle
    window.toggleDarkMode = function () {
        document.body.classList.toggle('dark-mode');
    };

    // Floating New Chat Button
    window.startNewChat = function () {
        chatMessages.innerHTML = "";
        addMessage("bot", "New chat started! How can I assist you?");
    };

    // Bottom Navigation Highlight (Optional)
    bottomNavIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            bottomNavIcons.forEach(i => i.classList.remove("active"));
            icon.classList.add("active");
        });
    });

    // Initialize the app
    init();
});
