// Chat application JavaScript
class ChatApp {
    constructor() {
        this.BASE_URL = window.location.origin; // Dynamic base URL for Render
        this.initializeElements();
        this.bindEvents();
        this.setWelcomeTime();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.typingIndicator = document.getElementById('typingIndicator');
    }

    bindEvents() {
        this.messageInput.addEventListener('input', this.handleInputResize.bind(this));
        this.messageInput.addEventListener('keydown', this.handleKeydown.bind(this));
        this.sendButton.addEventListener('click', this.sendMessage.bind(this));
    }

    setWelcomeTime() {
        const welcomeTimeElement = document.getElementById('welcomeTime');
        if (welcomeTimeElement) {
            welcomeTimeElement.textContent = new Date().toLocaleTimeString();
        }
    }

    handleInputResize() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    handleKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    addMessage(content, isUser = false, timestamp = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
        const time = timestamp || new Date().toLocaleTimeString();
        messageDiv.innerHTML = `
            <div class="message-avatar">${isUser ? 'You' : 'AI'}</div>
            <div class="message-content">
                ${this.formatMessage(content)}
                <div class="message-time">${time}</div>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content) {
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    showError(message, resetTime = null) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `⚠️ ${this.formatMessage(message)}`;
        this.chatMessages.appendChild(errorDiv);
        if (resetTime) this.startCountdown(resetTime);
        this.scrollToBottom();
    }

    startCountdown(resetTimeStr) {
        const resetTime = new Date(resetTimeStr);
        const countdownDiv = document.createElement('div');
        countdownDiv.className = 'countdown';
        this.chatMessages.appendChild(countdownDiv);

        const updateCountdown = () => {
            const now = new Date();
            const diff = resetTime - now;
            if (diff <= 0) {
                countdownDiv.textContent = "✅ Quota should now be reset. Try again!";
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            countdownDiv.textContent = `⏳ Quota resets in ${hours}h ${minutes}m ${seconds}s`;
            setTimeout(updateCountdown, 1000);
        };

        updateCountdown();
        this.scrollToBottom();
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    clearInput() {
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
    }

    disableSend(disabled = true) {
        this.sendButton.disabled = disabled;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessage(message, true);
        this.clearInput();
        this.disableSend(true);
        this.showTypingIndicator();

        try {
            const response = await this.callAPI(message);
            this.handleAPIResponse(response);
        } catch (error) {
            this.handleAPIError(error);
        } finally {
            this.hideTypingIndicator();
            this.disableSend(false);
        }
    }

    async callAPI(message) {
        const response = await fetch(`${this.BASE_URL}/api/text`, { // Dynamic URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    handleAPIResponse(data) {
        if (data.error) {
            this.showError(data.error, data.reset_time);
        } else {
            this.addMessage(data.response);
        }
    }

    handleAPIError(error) {
        console.error('API Error:', error);
        this.showError('Network error. Please check your connection and try again.');
    }
}

// Utility functions
const utils = {
    debounce(func, wait) {
        let timeout;
        return function (...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
};

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
    if (utils.isMobile()) document.body.classList.add('mobile');
    window.chatApp.messageInput.focus();
});

window.addEventListener('resize', utils.debounce(() => {
    if (window.chatApp) window.chatApp.scrollToBottom();
}, 250));

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.chatApp) window.chatApp.messageInput.focus();
});
