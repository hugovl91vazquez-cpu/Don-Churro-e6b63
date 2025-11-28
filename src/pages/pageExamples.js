/**
 * Don Churro Sales Bot - Page Code Examples
 * Example implementations for different Wix pages
 * 
 * Copy these code snippets to their respective pages in Wix Editor
 */

// ============================================
// MASTER PAGE (Site-wide initialization)
// File: masterPage.js
// ============================================

import { initializeSalesBot, displayPromotionalBanner } from 'public/salesBotClient.js';
import { initializeChatBot } from 'public/chatWidget.js';

$w.onReady(async function () {
    // Initialize sales bot
    await initializeSalesBot();
    
    // Initialize chat widget
    await initializeChatBot($w);
    
    // Display promotional banner if element exists
    if ($w('#promoBanner')) {
        await displayPromotionalBanner($w, '#promoBanner');
    }
});


// ============================================
// HOME PAGE
// File: HOME.js
// ============================================

import { displayRecommendations, showSocialProofNotification } from 'public/salesBotClient.js';
import { currentMember } from 'wix-members-frontend';

$w.onReady(async function () {
    // Get current member for personalization
    const member = await currentMember.getMember();
    const customerId = member ? member._id : null;
    
    // Display personalized recommendations
    await displayRecommendations($w, '#recommendationsRepeater', customerId);
    
    // Show social proof notifications
    if ($w('#socialProofNotification')) {
        await showSocialProofNotification($w, '#socialProofNotification');
    }
});


// ============================================
// PRODUCT PAGE
// File: Product Page.js
// ============================================

import { 
    displayUpsell, 
    trackProductView, 
    showUrgencyNotification 
} from 'public/salesBotClient.js';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    // Get product from page context
    const product = await $w('#productPage1').getProduct();
    
    if (product) {
        // Track product view
        await trackProductView(product._id, {
            name: product.name,
            category: product.productType,
            price: product.price
        });
        
        // Display upsell products
        await displayUpsell($w, product._id, '#upsellContainer');
        
        // Show urgency notification if low stock
        showUrgencyNotification($w, product, '#urgencyNotification');
    }
});

// Handle add to cart
export async function addToCartButton_click(event) {
    const product = await $w('#productPage1').getProduct();
    const quantity = $w('#quantityInput').value || 1;
    
    // Track add to cart
    await trackAddToCart(product._id, quantity, product.price);
}


// ============================================
// CART PAGE
// File: Cart Page.js
// ============================================

import { displayCrossSell, trackAddToCart } from 'public/salesBotClient.js';
import wixStores from 'wix-stores';

$w.onReady(async function () {
    // Get current cart
    const cart = await wixStores.getCurrentCart();
    
    if (cart && cart.lineItems && cart.lineItems.length > 0) {
        // Extract product IDs from cart
        const cartProductIds = cart.lineItems.map(item => item.productId);
        
        // Display cross-sell recommendations
        await displayCrossSell($w, cartProductIds, '#crossSellSection');
    }
});


// ============================================
// THANK YOU PAGE
// File: Thank You Page.js
// ============================================

import { displayRecommendations } from 'public/salesBotClient.js';
import { currentMember } from 'wix-members-frontend';

$w.onReady(async function () {
    // Show thank you message
    $w('#thankYouMessage').text = "¡Gracias! Thank you for your order! 🎉";
    
    // Get member for future recommendations
    const member = await currentMember.getMember();
    
    if (member) {
        // Show "You might also like" recommendations for next purchase
        await displayRecommendations($w, '#futureRecommendations', member._id);
    }
});


// ============================================
// EXIT INTENT LIGHTBOX
// File: ExitIntentOffer (Lightbox).js
// ============================================

import wixWindow from 'wix-window';
import { trackCustomerInteraction } from 'backend/salesBot.jsw';

$w.onReady(function () {
    // Get offer data passed to lightbox
    const data = wixWindow.lightbox.getContext();
    
    if (data && data.offer) {
        $w('#offerTitle').text = data.offer.title;
        $w('#offerDescription').text = data.offer.description;
        $w('#discountCode').text = data.offer.code;
        $w('#discountValue').text = `${data.offer.value}% OFF`;
    }
});

export async function claimOfferButton_click(event) {
    const data = wixWindow.lightbox.getContext();
    
    // Track offer claim
    if (data) {
        await trackCustomerInteraction(data.customerId || 'anonymous', 'exit_intent_offer_claimed', {
            offer: data.offer
        });
    }
    
    // Copy code to clipboard
    // Note: Actual clipboard implementation may vary
    
    // Close lightbox
    wixWindow.lightbox.close({ claimed: true });
}

export function closeButton_click(event) {
    wixWindow.lightbox.close({ claimed: false });
}


// ============================================
// COLLECTION/CATEGORY PAGE
// File: Category Page.js
// ============================================

import { displayRecommendations } from 'public/salesBotClient.js';
import wixLocation from 'wix-location';

$w.onReady(async function () {
    // Get category from URL
    const category = wixLocation.path[1] || 'all';
    
    // Update page title
    $w('#categoryTitle').text = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Show featured products for this category
    // These would normally be filtered by category
    await displayRecommendations($w, '#featuredProducts', null);
});
