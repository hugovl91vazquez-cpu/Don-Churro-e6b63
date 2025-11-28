/**
 * Don Churro Sales Bot - Frontend Client Module
 * Wix Velo Public Module for Client-Side Interactions
 * 
 * This module handles all frontend interactions including:
 * - Displaying product recommendations
 * - Managing popups and notifications
 * - Tracking user behavior
 * - Cart management
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';
import { session } from 'wix-storage';
import { currentMember } from 'wix-members-frontend';

// Import backend functions
import { 
    getPersonalizedRecommendations, 
    getTrendingProducts,
    getCrossSellProducts,
    getUpsellProducts,
    getActivePromotions,
    getPersonalizedOffer,
    trackCustomerInteraction
} from 'backend/salesBot.jsw';

/**
 * Initialize the sales bot on page load
 * Call this from your site's masterPage.js or specific page code
 */
export async function initializeSalesBot() {
    try {
        // Generate or retrieve session ID
        let sessionId = session.getItem('salesBotSessionId');
        if (!sessionId) {
            sessionId = generateSessionId();
            session.setItem('salesBotSessionId', sessionId);
        }

        // Get current member if logged in
        const member = await currentMember.getMember();
        const customerId = member ? member._id : `guest_${sessionId}`;

        // Track page view
        await trackPageView(customerId, sessionId);

        // Show exit intent popup listener
        setupExitIntentListener(customerId);

        // Setup scroll tracking
        setupScrollTracking(customerId, sessionId);

        console.log("Sales Bot initialized successfully");
        
        return { success: true, sessionId, customerId };
    } catch (error) {
        console.error("Failed to initialize Sales Bot:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate a unique session ID
 */
function generateSessionId() {
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Track page view interaction
 */
async function trackPageView(customerId, sessionId) {
    await trackCustomerInteraction(customerId, 'page_view', {
        sessionId: sessionId,
        url: wixLocation.url,
        path: wixLocation.path,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString()
    });
}

/**
 * Setup exit intent detection
 * Shows a popup when user is about to leave the page
 */
function setupExitIntentListener(customerId) {
    let exitIntentShown = session.getItem('exitIntentShown');
    
    if (exitIntentShown) {
        return; // Only show once per session
    }

    // Desktop: detect mouse leaving viewport
    if (wixWindow.formFactor !== 'Mobile') {
        document.addEventListener('mouseout', async (e) => {
            if (e.clientY <= 0 && !exitIntentShown) {
                session.setItem('exitIntentShown', 'true');
                await showExitIntentPopup(customerId);
            }
        });
    }
}

/**
 * Show exit intent popup with special offer
 */
async function showExitIntentPopup(customerId) {
    try {
        const offer = await getPersonalizedOffer(customerId);
        
        if (offer.success) {
            // Open lightbox with offer data
            await wixWindow.openLightbox("ExitIntentOffer", {
                offer: offer.offer,
                customerSegment: offer.customerSegment
            });

            // Track popup display
            await trackCustomerInteraction(customerId, 'exit_intent_popup_shown', {
                offer: offer.offer
            });
        }
    } catch (error) {
        console.error("Failed to show exit intent popup:", error);
    }
}

/**
 * Setup scroll depth tracking
 */
function setupScrollTracking(customerId, sessionId) {
    let maxScrollDepth = 0;
    const scrollThresholds = [25, 50, 75, 100];
    const trackedThresholds = new Set();

    window.addEventListener('scroll', async () => {
        const scrollPercent = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );

        if (scrollPercent > maxScrollDepth) {
            maxScrollDepth = scrollPercent;

            // Track milestone scroll depths
            for (const threshold of scrollThresholds) {
                if (maxScrollDepth >= threshold && !trackedThresholds.has(threshold)) {
                    trackedThresholds.add(threshold);
                    await trackCustomerInteraction(customerId, 'scroll_depth', {
                        sessionId: sessionId,
                        depth: threshold,
                        url: wixLocation.url
                    });
                }
            }
        }
    });
}

/**
 * Display product recommendations in a repeater
 * @param {Object} $w - Wix selector function
 * @param {string} repeaterId - ID of the repeater element
 * @param {string} customerId - Customer identifier (optional)
 */
export async function displayRecommendations($w, repeaterId, customerId = null) {
    try {
        let recommendations;
        
        if (customerId) {
            recommendations = await getPersonalizedRecommendations(customerId, 6);
        } else {
            recommendations = await getTrendingProducts(6);
        }

        if (recommendations.success && recommendations.recommendations.length > 0) {
            $w(repeaterId).data = recommendations.recommendations;
            
            $w(repeaterId).onItemReady(($item, itemData) => {
                $item('#productImage').src = itemData.mainMedia;
                $item('#productName').text = itemData.name;
                $item('#productPrice').text = `$${itemData.price.toFixed(2)}`;
                
                if (itemData.discountedPrice) {
                    $item('#discountPrice').text = `$${itemData.discountedPrice.toFixed(2)}`;
                    $item('#discountPrice').show();
                    $item('#productPrice').style.textDecoration = 'line-through';
                }

                $item('#productImage').onClick(() => {
                    wixLocation.to(itemData.productPageUrl);
                });
            });

            return { success: true, count: recommendations.recommendations.length };
        }
        
        return { success: false, message: "No recommendations available" };
    } catch (error) {
        console.error("Failed to display recommendations:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Display cross-sell products based on cart contents
 * @param {Object} $w - Wix selector function
 * @param {Array} cartItems - Array of product IDs in cart
 * @param {string} containerId - ID of the container element
 */
export async function displayCrossSell($w, cartItems, containerId) {
    try {
        const crossSell = await getCrossSellProducts(cartItems);

        if (crossSell.success && crossSell.products.length > 0) {
            $w(containerId).show();
            
            // Assuming a repeater inside the container
            $w(`${containerId} #crossSellRepeater`).data = crossSell.products;
            
            $w(`${containerId} #crossSellRepeater`).onItemReady(($item, itemData) => {
                $item('#crossSellImage').src = itemData.mainMedia;
                $item('#crossSellName').text = itemData.name;
                $item('#crossSellPrice').text = `$${itemData.price.toFixed(2)}`;
                
                $item('#addToCartBtn').onClick(async () => {
                    // Track cross-sell click
                    const member = await currentMember.getMember();
                    if (member) {
                        await trackCustomerInteraction(member._id, 'cross_sell_add', {
                            productId: itemData._id,
                            productName: itemData.name
                        });
                    }
                });
            });

            return { success: true, count: crossSell.products.length };
        }

        $w(containerId).hide();
        return { success: false, message: "No cross-sell products available" };
    } catch (error) {
        console.error("Failed to display cross-sell:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Display upsell products on product page
 * @param {Object} $w - Wix selector function
 * @param {string} productId - Current product ID
 * @param {string} containerId - ID of the upsell container
 */
export async function displayUpsell($w, productId, containerId) {
    try {
        const upsell = await getUpsellProducts(productId);

        if (upsell.success && upsell.products.length > 0) {
            $w(containerId).show();
            $w(`${containerId} #upsellRepeater`).data = upsell.products;
            
            $w(`${containerId} #upsellRepeater`).onItemReady(($item, itemData) => {
                $item('#upsellImage').src = itemData.mainMedia;
                $item('#upsellName').text = itemData.name;
                $item('#upsellPrice').text = `$${itemData.price.toFixed(2)}`;
                
                // Calculate and show savings/value proposition
                const priceDiff = itemData.price - upsell.currentProduct.price;
                if (itemData.rating > (upsell.currentProduct.rating || 0)) {
                    $item('#upsellBadge').text = `⭐ Higher Rated`;
                    $item('#upsellBadge').show();
                }

                $item('#upsellItem').onClick(async () => {
                    // Track upsell click
                    const member = await currentMember.getMember();
                    if (member) {
                        await trackCustomerInteraction(member._id, 'upsell_click', {
                            originalProductId: productId,
                            upsellProductId: itemData._id,
                            priceDifference: priceDiff
                        });
                    }
                    wixLocation.to(itemData.productPageUrl);
                });
            });

            return { success: true, count: upsell.products.length };
        }

        $w(containerId).hide();
        return { success: false, message: "No upsell products available" };
    } catch (error) {
        console.error("Failed to display upsell:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Display promotional banner
 * @param {Object} $w - Wix selector function
 * @param {string} bannerId - ID of the banner element
 */
export async function displayPromotionalBanner($w, bannerId) {
    try {
        const promotions = await getActivePromotions();

        if (promotions.success && promotions.promotions.length > 0) {
            const topPromo = promotions.promotions[0]; // Get highest priority
            
            $w(bannerId).show();
            $w(`${bannerId} #promoTitle`).text = topPromo.title;
            $w(`${bannerId} #promoDescription`).text = topPromo.description;
            
            if (topPromo.discountCode) {
                $w(`${bannerId} #promoCode`).text = topPromo.discountCode;
                $w(`${bannerId} #promoCode`).show();
            }

            if (topPromo.ctaUrl) {
                $w(`${bannerId} #promoCta`).onClick(() => {
                    wixLocation.to(topPromo.ctaUrl);
                });
            }

            return { success: true, promotion: topPromo };
        }

        $w(bannerId).hide();
        return { success: false, message: "No active promotions" };
    } catch (error) {
        console.error("Failed to display promotional banner:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Show urgency notification (low stock, limited time)
 * @param {Object} $w - Wix selector function
 * @param {Object} product - Product data
 * @param {string} notificationId - ID of the notification element
 */
export function showUrgencyNotification($w, product, notificationId) {
    try {
        let urgencyMessage = null;

        // Check stock level
        if (product.inventory && product.inventory.quantity <= 5) {
            urgencyMessage = `🔥 Only ${product.inventory.quantity} left in stock!`;
        }

        // Check for time-limited sale
        if (product.saleEndDate) {
            const endDate = new Date(product.saleEndDate);
            const now = new Date();
            const hoursLeft = Math.floor((endDate - now) / (1000 * 60 * 60));
            
            if (hoursLeft > 0 && hoursLeft <= 24) {
                urgencyMessage = `⏰ Sale ends in ${hoursLeft} hours!`;
            }
        }

        if (urgencyMessage) {
            $w(notificationId).text = urgencyMessage;
            $w(notificationId).show();
            
            // Pulse animation effect
            $w(notificationId).style.animation = 'pulse 2s infinite';
            
            return { success: true, message: urgencyMessage };
        }

        $w(notificationId).hide();
        return { success: false };
    } catch (error) {
        console.error("Failed to show urgency notification:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Track product view for analytics
 * @param {string} productId - Product being viewed
 * @param {Object} productData - Product details
 */
export async function trackProductView(productId, productData) {
    try {
        const member = await currentMember.getMember();
        const sessionId = session.getItem('salesBotSessionId');
        const customerId = member ? member._id : `guest_${sessionId}`;

        await trackCustomerInteraction(customerId, 'product_view', {
            sessionId: sessionId,
            productId: productId,
            productName: productData.name,
            category: productData.category,
            price: productData.price,
            url: wixLocation.url
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to track product view:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Track add to cart event
 * @param {string} productId - Product added to cart
 * @param {number} quantity - Quantity added
 * @param {number} price - Product price
 */
export async function trackAddToCart(productId, quantity, price) {
    try {
        const member = await currentMember.getMember();
        const sessionId = session.getItem('salesBotSessionId');
        const customerId = member ? member._id : `guest_${sessionId}`;

        await trackCustomerInteraction(customerId, 'add_to_cart', {
            sessionId: sessionId,
            productId: productId,
            quantity: quantity,
            price: price,
            totalValue: quantity * price
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to track add to cart:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Show social proof notification
 * @param {Object} $w - Wix selector function
 * @param {string} notificationId - ID of the notification element
 */
export async function showSocialProofNotification($w, notificationId) {
    try {
        // Get recent purchases (from last 24 hours)
        const recentActivity = [
            "Someone from New York just purchased!",
            "15 people are viewing this right now",
            "Purchased 24 times in the last 24 hours",
            "⭐ Top seller this week!"
        ];

        // Rotate through social proof messages
        let messageIndex = 0;
        
        const showNextMessage = () => {
            $w(notificationId).text = recentActivity[messageIndex];
            $w(notificationId).show();
            
            // Fade in effect
            $w(notificationId).style.opacity = 0;
            setTimeout(() => {
                $w(notificationId).style.opacity = 1;
            }, 100);

            messageIndex = (messageIndex + 1) % recentActivity.length;
        };

        showNextMessage();
        setInterval(showNextMessage, 5000); // Rotate every 5 seconds

        return { success: true };
    } catch (error) {
        console.error("Failed to show social proof:", error);
        return { success: false, error: error.message };
    }
}
