import { sendChatMessage } from '../api.js';

let chatInput;
let chatHistory;
let chatForm;

export function initChat() {
    chatInput   = document.getElementById('chat-input');
    chatHistory = document.getElementById('chat-history');
    chatForm    = document.getElementById('chat-form');

    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender === 'user' ? 'chat-message--user' : ''}`;

    msgDiv.style.opacity   = '0';
    msgDiv.style.transform = 'translateY(24px) scale(0.95)';
    msgDiv.style.filter    = 'blur(4px)';

    const avatar = document.createElement('div');
    avatar.className = sender === 'user' ? 'chat-avatar' : 'chat-avatar chat-avatar--ai';
    avatar.innerHTML = sender === 'user'
        ? '<i data-lucide="user"></i>'
        : '<i data-lucide="bot"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    
    if (sender !== 'user') {
        bubble.style.position = 'relative';
        const trail = document.createElement('div');
        trail.className = 'border-trail';
        trail.style.inset = '-1px';
        bubble.appendChild(trail);
    }

    const textSpan = document.createElement('span');
    textSpan.style.position = 'relative';
    textSpan.style.zIndex = '1';
    textSpan.textContent = text;
    bubble.appendChild(textSpan);

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatHistory.appendChild(msgDiv);

    if (typeof lucide !== 'undefined') lucide.createIcons();

    requestAnimationFrame(() => {
        msgDiv.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        msgDiv.style.opacity   = '1';
        msgDiv.style.transform = 'translateY(0) scale(1)';
        msgDiv.style.filter    = 'blur(0px)';
    });

    setTimeout(() => {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: 'smooth' });
    }, 100);
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message';
    typingDiv.id        = 'typing-indicator';

    typingDiv.style.opacity   = '0';
    typingDiv.style.transform = 'translateY(20px) scale(0.9)';

    typingDiv.innerHTML = `
        <div class="chat-avatar chat-avatar--ai"><i data-lucide="bot"></i></div>
        <div class="chat-bubble typing" style="position: relative;">
            <div class="border-trail" style="inset: -1px;"></div>
            <div style="position: relative; z-index: 1; display: flex; align-items: center; gap: 5px;">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        </div>
    `;

    chatHistory.appendChild(typingDiv);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    requestAnimationFrame(() => {
        typingDiv.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        typingDiv.style.opacity   = '1';
        typingDiv.style.transform = 'translateY(0) scale(1)';
    });

    setTimeout(() => {
        chatHistory.scrollTo({ top: chatHistory.scrollHeight, behavior: 'smooth' });
    }, 100);
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (!indicator) return;

    indicator.style.opacity   = '0';
    indicator.style.transform = 'translateY(-12px) scale(0.9)';
    indicator.style.filter    = 'blur(4px)';
    setTimeout(() => indicator.remove(), 400);
}

async function handleSendMessage(e) {
    e.preventDefault();

    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';

    showTypingIndicator();

    try {
        const response = await sendChatMessage(text);
        if (response.delayMs) {
            setTimeout(() => {
                removeTypingIndicator();
                appendMessage(response.text, 'system');
            }, response.delayMs);
        } else {
            removeTypingIndicator();
            appendMessage(response.text, 'system');
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator();
        appendMessage('**Connection error:** Failed to reach the AI agent.', 'system');
    }
}
