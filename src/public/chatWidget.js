/**
 * Don Churro Sales Bot - Chat Widget
 * Interactive Chat Bot for Customer Engagement and Sales
 * 
 * This module provides a conversational interface that helps customers:
 * - Find products
 * - Get recommendations
 * - Answer questions
 * - Apply discounts
 * - Complete purchases
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { currentMember } from 'wix-members-frontend';
import { session } from 'wix-storage';

import { 
    getPersonalizedRecommendations,
    getTrendingProducts,
    getPersonalizedOffer,
    trackCustomerInteraction
} from 'backend/salesBot.jsw';

// Chat bot configuration
const BOT_CONFIG = {
    name: "Don Churro Assistant",
    greeting: "¡Hola! 👋 Welcome to Don Churro! I'm here to help you find the perfect products. What can I help you with today?",
    avatar: "🤖",
    typingDelay: 1000,
    responseDelay: 500
};

// Intent patterns for natural language understanding
const INTENT_PATTERNS = {
    greeting: /^(hi|hello|hey|hola|buenos dias|good morning|good afternoon)/i,
    productSearch: /\b(looking for|find|search|want|need|show me)\b.*\b(product|item|churro|food|menu)/i,
    recommendations: /\b(recommend|suggest|best|popular|trending|top)\b/i,
    discount: /\b(discount|coupon|promo|offer|deal|sale|code)\b/i,
    help: /\b(help|support|question|problem|issue)\b/i,
    cart: /\b(cart|basket|checkout|buy|purchase|order)\b/i,
    price: /\b(price|cost|how much|expensive|cheap)\b/i,
    shipping: /\b(ship|deliver|shipping|delivery|when|arrive)\b/i,
    hours: /\b(hour|open|close|time|schedule)\b/i,
    location: /\b(location|address|where|find you|store)\b/i,
    thanks: /\b(thank|thanks|gracias|appreciate)\b/i,
    bye: /\b(bye|goodbye|adios|see you|later)\b/i
};

// Predefined responses
const RESPONSES = {
    greeting: [
        "¡Hola! How can I help you today? 😊",
        "Welcome! Looking for something delicious? 🍩",
        "Hi there! Ready to discover our amazing churros? 🎉"
    ],
    thanks: [
        "You're welcome! Is there anything else I can help with? 😊",
        "My pleasure! Let me know if you need anything else!",
        "¡De nada! Happy to help! 🎉"
    ],
    bye: [
        "Goodbye! Thanks for visiting Don Churro! 👋",
        "¡Adiós! Come back soon! 🍩",
        "Take care! Hope to see you again! 😊"
    ],
    shipping: "We offer fast shipping! 🚚 Standard delivery takes 3-5 business days. Express shipping (1-2 days) is also available at checkout!",
    hours: "We're here for you! 🕐 Online orders can be placed 24/7. Our customer support is available Monday-Friday, 9 AM - 6 PM.",
    location: "You can find all our store locations on our Locations page! 📍 Would you like me to take you there?",
    fallback: [
        "I'm not sure I understood that. Could you rephrase? 🤔",
        "Let me connect you with our support team for that question. In the meantime, can I help you find a product?",
        "That's a great question! For detailed assistance, please contact our support. How else can I help?"
    ]
};

/**
 * Chat Bot State Manager
 */
class ChatBotState {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.customerId = null;
        this.sessionId = null;
        this.context = {};
    }

    addMessage(sender, text, type = 'text', data = null) {
        this.messages.push({
            id: Date.now(),
            sender: sender,
            text: text,
            type: type,
            data: data,
            timestamp: new Date()
        });
    }

    setContext(key, value) {
        this.context[key] = value;
    }

    getContext(key) {
        return this.context[key];
    }
}

// Global chat state
let chatState = new ChatBotState();

/**
 * Initialize the chat bot
 * @param {Object} $w - Wix selector function
 */
export async function initializeChatBot($w) {
    try {
        // Get or create session
        chatState.sessionId = session.getItem('salesBotSessionId') || 
            'session_' + Date.now().toString(36);
        session.setItem('salesBotSessionId', chatState.sessionId);

        // Get current member
        const member = await currentMember.getMember();
        chatState.customerId = member ? member._id : `guest_${chatState.sessionId}`;

        // Setup chat widget event handlers
        setupChatEventHandlers($w);

        // Add greeting message
        chatState.addMessage('bot', BOT_CONFIG.greeting);

        console.log("Chat Bot initialized");
        return { success: true };
    } catch (error) {
        console.error("Failed to initialize chat bot:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Setup event handlers for chat widget elements
 */
function setupChatEventHandlers($w) {
    // Chat toggle button
    $w('#chatToggleBtn').onClick(() => {
        toggleChat($w);
    });

    // Send message button
    $w('#chatSendBtn').onClick(() => {
        sendMessage($w);
    });

    // Enter key in input
    $w('#chatInput').onKeyPress((event) => {
        if (event.key === 'Enter') {
            sendMessage($w);
        }
    });

    // Close button
    $w('#chatCloseBtn').onClick(() => {
        closeChat($w);
    });

    // Quick action buttons
    $w('#quickActionProducts').onClick(() => handleQuickAction($w, 'products'));
    $w('#quickActionDeals').onClick(() => handleQuickAction($w, 'deals'));
    $w('#quickActionHelp').onClick(() => handleQuickAction($w, 'help'));
}

/**
 * Toggle chat widget visibility
 */
function toggleChat($w) {
    chatState.isOpen = !chatState.isOpen;
    
    if (chatState.isOpen) {
        $w('#chatWidget').show();
        $w('#chatToggleBtn').hide();
        renderMessages($w);
        
        // Track chat opened
        trackCustomerInteraction(chatState.customerId, 'chat_opened', {
            sessionId: chatState.sessionId
        });
    } else {
        closeChat($w);
    }
}

/**
 * Close chat widget
 */
function closeChat($w) {
    chatState.isOpen = false;
    $w('#chatWidget').hide();
    $w('#chatToggleBtn').show();
}

/**
 * Send user message
 */
async function sendMessage($w) {
    const userInput = $w('#chatInput').value.trim();
    
    if (!userInput) return;

    // Add user message
    chatState.addMessage('user', userInput);
    $w('#chatInput').value = '';
    renderMessages($w);

    // Show typing indicator
    showTypingIndicator($w);

    // Track message
    await trackCustomerInteraction(chatState.customerId, 'chat_message', {
        sessionId: chatState.sessionId,
        message: userInput
    });

    // Process and generate response
    setTimeout(async () => {
        hideTypingIndicator($w);
        const response = await processUserInput(userInput);
        
        if (response.type === 'text') {
            chatState.addMessage('bot', response.text);
        } else if (response.type === 'products') {
            chatState.addMessage('bot', response.text, 'products', response.data);
        } else if (response.type === 'offer') {
            chatState.addMessage('bot', response.text, 'offer', response.data);
        }
        
        renderMessages($w);
    }, BOT_CONFIG.typingDelay);
}

/**
 * Process user input and determine appropriate response
 */
async function processUserInput(input) {
    const lowerInput = input.toLowerCase();

    // Check for greeting
    if (INTENT_PATTERNS.greeting.test(lowerInput)) {
        return {
            type: 'text',
            text: getRandomResponse(RESPONSES.greeting)
        };
    }

    // Check for product search or recommendations
    if (INTENT_PATTERNS.recommendations.test(lowerInput) || 
        INTENT_PATTERNS.productSearch.test(lowerInput)) {
        return await handleProductRecommendation();
    }

    // Check for discount request
    if (INTENT_PATTERNS.discount.test(lowerInput)) {
        return await handleDiscountRequest();
    }

    // Check for cart/checkout
    if (INTENT_PATTERNS.cart.test(lowerInput)) {
        return {
            type: 'text',
            text: "Ready to checkout? 🛒 Click here to view your cart and complete your order! [View Cart](/cart)"
        };
    }

    // Check for shipping
    if (INTENT_PATTERNS.shipping.test(lowerInput)) {
        return {
            type: 'text',
            text: RESPONSES.shipping
        };
    }

    // Check for hours
    if (INTENT_PATTERNS.hours.test(lowerInput)) {
        return {
            type: 'text',
            text: RESPONSES.hours
        };
    }

    // Check for location
    if (INTENT_PATTERNS.location.test(lowerInput)) {
        return {
            type: 'text',
            text: RESPONSES.location
        };
    }

    // Check for thanks
    if (INTENT_PATTERNS.thanks.test(lowerInput)) {
        return {
            type: 'text',
            text: getRandomResponse(RESPONSES.thanks)
        };
    }

    // Check for goodbye
    if (INTENT_PATTERNS.bye.test(lowerInput)) {
        return {
            type: 'text',
            text: getRandomResponse(RESPONSES.bye)
        };
    }

    // Check for help
    if (INTENT_PATTERNS.help.test(lowerInput)) {
        return {
            type: 'text',
            text: "I can help you with:\n• 🔍 Finding products\n• 💰 Getting discounts\n• 🛒 Checking out\n• 📦 Shipping info\n• ❓ General questions\n\nJust ask! 😊"
        };
    }

    // Fallback response
    return {
        type: 'text',
        text: getRandomResponse(RESPONSES.fallback)
    };
}

/**
 * Handle product recommendation request
 */
async function handleProductRecommendation() {
    try {
        let products;
        
        if (chatState.customerId && !chatState.customerId.startsWith('guest_')) {
            products = await getPersonalizedRecommendations(chatState.customerId, 3);
        } else {
            products = await getTrendingProducts(3);
        }

        if (products.success && products.recommendations.length > 0) {
            return {
                type: 'products',
                text: "Here are some products you might love! 🌟",
                data: products.recommendations
            };
        }
        
        return {
            type: 'text',
            text: "Check out our full menu for all our delicious options! [View Menu](/menu)"
        };
    } catch (error) {
        console.error("Error getting recommendations:", error);
        return {
            type: 'text',
            text: "Check out our full menu for all our delicious options! [View Menu](/menu)"
        };
    }
}

/**
 * Handle discount request
 */
async function handleDiscountRequest() {
    try {
        const offer = await getPersonalizedOffer(chatState.customerId);
        
        if (offer.success) {
            return {
                type: 'offer',
                text: `🎉 Great news! Here's a special offer just for you:`,
                data: offer.offer
            };
        }
        
        return {
            type: 'text',
            text: "I don't have any special offers right now, but check our promotions page for current deals! 🎁"
        };
    } catch (error) {
        console.error("Error getting offer:", error);
        return {
            type: 'text',
            text: "Check our promotions page for current deals! 🎁 [View Deals](/deals)"
        };
    }
}

/**
 * Handle quick action button clicks
 */
async function handleQuickAction($w, action) {
    switch (action) {
        case 'products':
            chatState.addMessage('user', "Show me your best products");
            break;
        case 'deals':
            chatState.addMessage('user', "Do you have any discounts?");
            break;
        case 'help':
            chatState.addMessage('user', "I need help");
            break;
    }
    
    renderMessages($w);
    showTypingIndicator($w);
    
    setTimeout(async () => {
        hideTypingIndicator($w);
        let response;
        
        switch (action) {
            case 'products':
                response = await handleProductRecommendation();
                break;
            case 'deals':
                response = await handleDiscountRequest();
                break;
            case 'help':
                response = {
                    type: 'text',
                    text: "I can help you with:\n• 🔍 Finding products\n• 💰 Getting discounts\n• 🛒 Checking out\n• 📦 Shipping info\n• ❓ General questions\n\nJust ask! 😊"
                };
                break;
        }
        
        if (response.type === 'products') {
            chatState.addMessage('bot', response.text, 'products', response.data);
        } else if (response.type === 'offer') {
            chatState.addMessage('bot', response.text, 'offer', response.data);
        } else {
            chatState.addMessage('bot', response.text);
        }
        
        renderMessages($w);
    }, BOT_CONFIG.typingDelay);
}

/**
 * Render messages in chat widget
 */
function renderMessages($w) {
    const messagesContainer = $w('#chatMessages');
    
    // Clear existing messages
    let html = '';
    
    for (const msg of chatState.messages) {
        const isBot = msg.sender === 'bot';
        const alignment = isBot ? 'left' : 'right';
        const bgColor = isBot ? '#f0f0f0' : '#4a90d9';
        const textColor = isBot ? '#333' : '#fff';
        
        html += `<div style="text-align: ${alignment}; margin: 8px 0;">
            <div style="display: inline-block; padding: 10px 14px; 
                background: ${bgColor}; color: ${textColor}; 
                border-radius: 16px; max-width: 80%;">
                ${isBot ? BOT_CONFIG.avatar + ' ' : ''}${msg.text}
            </div>
        </div>`;
        
        // Add product cards if this is a product message
        if (msg.type === 'products' && msg.data) {
            html += renderProductCards(msg.data);
        }
        
        // Add offer card if this is an offer message
        if (msg.type === 'offer' && msg.data) {
            html += renderOfferCard(msg.data);
        }
    }
    
    messagesContainer.html = html;
    
    // Scroll to bottom
    // Note: Actual scroll implementation depends on Wix widget capabilities
}

/**
 * Render product cards for chat
 */
function renderProductCards(products) {
    let html = '<div style="display: flex; gap: 10px; overflow-x: auto; padding: 10px 0;">';
    
    for (const product of products) {
        html += `
            <div style="min-width: 120px; border: 1px solid #ddd; border-radius: 8px; padding: 8px;">
                <div style="font-weight: bold; font-size: 12px;">${product.name}</div>
                <div style="color: #4a90d9; font-weight: bold;">$${(product.price ?? 0).toFixed(2)}</div>
                <a href="${product.productPageUrl || '/shop'}" style="color: #4a90d9; font-size: 11px;">View →</a>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

/**
 * Render offer card for chat
 */
function renderOfferCard(offer) {
    return `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; padding: 15px; border-radius: 12px; margin: 10px 0;">
            <div style="font-weight: bold; font-size: 14px;">${offer.title}</div>
            <div style="font-size: 12px; margin: 8px 0;">${offer.description}</div>
            <div style="background: white; color: #764ba2; padding: 8px; 
                border-radius: 6px; text-align: center; font-weight: bold;">
                Code: ${offer.code}
            </div>
        </div>
    `;
}

/**
 * Show typing indicator
 */
function showTypingIndicator($w) {
    $w('#typingIndicator').show();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator($w) {
    $w('#typingIndicator').hide();
}

/**
 * Get random response from array
 */
function getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Export chat state for external access
 */
export function getChatState() {
    return {
        isOpen: chatState.isOpen,
        messageCount: chatState.messages.length,
        customerId: chatState.customerId
    };
}
