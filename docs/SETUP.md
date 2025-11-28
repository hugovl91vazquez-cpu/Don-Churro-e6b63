# Don Churro Sales Bot - Setup Guide

This guide will help you set up the Don Churro Sales Bot in your Wix website to maximize sales through automated recommendations, cart recovery, and customer engagement.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [File Installation](#file-installation)
5. [Page Integration](#page-integration)
6. [Chat Widget Setup](#chat-widget-setup)
7. [Scheduled Jobs](#scheduled-jobs)
8. [Email Templates](#email-templates)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Don Churro Sales Bot is a comprehensive sales optimization solution for Wix websites that includes:

- **Personalized Product Recommendations**: AI-driven suggestions based on customer behavior
- **Cross-sell & Upsell Engine**: Increase average order value with smart product suggestions
- **Cart Abandonment Recovery**: Automated email campaigns to recover lost sales
- **Interactive Chat Widget**: 24/7 customer engagement and sales assistance
- **Customer Segmentation**: VIP, loyal, regular, and new customer tiers with personalized offers
- **Social Proof Notifications**: Build trust and urgency with real-time activity
- **Analytics & Reporting**: Track performance and optimize strategies

---

## Prerequisites

Before setting up the bot, ensure you have:

- A Wix website with Wix Stores enabled
- Wix Premium plan with Velo by Wix enabled
- Access to Wix CRM for customer management
- Triggered Emails feature enabled (for cart recovery)

---

## Database Setup

Create the following databases (collections) in your Wix site:

### 1. AbandonedCarts

| Field Name | Type | Description |
|------------|------|-------------|
| customerId | Text | Customer/contact ID |
| cartItems | Object | JSON array of cart items |
| cartTotal | Number | Total cart value |
| abandonedAt | Date | When cart was abandoned |
| recovered | Boolean | Whether cart was recovered |
| emailSent | Boolean | Whether recovery email was sent |
| reminderCount | Number | Number of reminders sent |
| lastReminderAt | Date | When last reminder was sent |

### 2. BrowsingHistory

| Field Name | Type | Description |
|------------|------|-------------|
| customerId | Text | Customer/visitor ID |
| productId | Text | Viewed product ID |
| category | Text | Product category |
| timestamp | Date | View timestamp |
| sessionId | Text | Browser session ID |

### 3. CustomerInteractions

| Field Name | Type | Description |
|------------|------|-------------|
| customerId | Text | Customer/visitor ID |
| interactionType | Text | Type of interaction |
| data | Object | Interaction details |
| timestamp | Date | Interaction timestamp |
| sessionId | Text | Session identifier |

### 4. ProductAssociations

| Field Name | Type | Description |
|------------|------|-------------|
| productId | Text | Source product ID |
| associatedProductId | Text | Related product ID |
| associationStrength | Number | How often bought together (0-100) |

### 5. Promotions

| Field Name | Type | Description |
|------------|------|-------------|
| title | Text | Promotion title |
| description | Text | Promotion description |
| discountCode | Text | Discount code |
| startDate | Date | Promotion start |
| endDate | Date | Promotion end |
| isActive | Boolean | Whether active |
| priority | Number | Display priority (lower = higher) |
| ctaUrl | URL | Call-to-action link |

### 6. DiscountCodes

| Field Name | Type | Description |
|------------|------|-------------|
| code | Text | Discount code |
| discountType | Text | "percentage" or "fixed" |
| discountValue | Number | Discount amount |
| minOrderAmount | Number | Minimum order required |
| expiresAt | Date | Code expiration |
| usageLimit | Number | Max uses allowed |
| usedCount | Number | Times used |
| isActive | Boolean | Whether active |

### 7. DailyReports

| Field Name | Type | Description |
|------------|------|-------------|
| date | Text | Report date (YYYY-MM-DD) |
| orders | Number | Number of orders |
| revenue | Number | Total revenue |
| avgOrderValue | Number | Average order value |
| revenueChangePercent | Number | Change from previous day |
| generatedAt | Date | Report generation time |

---

## File Installation

### Step 1: Backend Files

1. Open Wix Editor and enable Dev Mode
2. Navigate to **Backend** folder
3. Create the following files and paste the code:

| File Name | Source |
|-----------|--------|
| salesBot.jsw | `/src/backend/salesBot.jsw` |
| http-functions.js | `/src/backend/http-functions.js` |
| jobs.config.js | `/src/backend/jobs.config.js` |

### Step 2: Public Files

1. Navigate to **Public** folder
2. Create the following files:

| File Name | Source |
|-----------|--------|
| salesBotClient.js | `/src/public/salesBotClient.js` |
| chatWidget.js | `/src/public/chatWidget.js` |

---

## Page Integration

### Master Page Setup

Add this code to your site's **masterPage.js**:

```javascript
import { initializeSalesBot, displayPromotionalBanner } from 'public/salesBotClient.js';
import { initializeChatBot } from 'public/chatWidget.js';

$w.onReady(async function () {
    await initializeSalesBot();
    await initializeChatBot($w);
    
    if ($w('#promoBanner')) {
        await displayPromotionalBanner($w, '#promoBanner');
    }
});
```

### Product Page Setup

Add to your product page code:

```javascript
import { displayUpsell, trackProductView, showUrgencyNotification } from 'public/salesBotClient.js';

$w.onReady(async function () {
    const product = await $w('#productPage1').getProduct();
    
    if (product) {
        await trackProductView(product._id, product);
        await displayUpsell($w, product._id, '#upsellContainer');
        showUrgencyNotification($w, product, '#urgencyNotification');
    }
});
```

See `/src/pages/pageExamples.js` for complete examples for all page types.

---

## Chat Widget Setup

### Required Elements

Add these elements to your Master Page:

1. **Chat Toggle Button** (ID: `#chatToggleBtn`)
   - Floating button to open chat
   - Recommended: Bottom-right corner, 60x60px

2. **Chat Widget Container** (ID: `#chatWidget`)
   - The main chat window
   - Default state: Hidden
   - Contains:
     - `#chatCloseBtn` - Close button
     - `#chatMessages` - Messages container (HTML element)
     - `#chatInput` - Text input for user messages
     - `#chatSendBtn` - Send button
     - `#typingIndicator` - Typing animation (default: hidden)

3. **Quick Action Buttons** (inside chat widget)
   - `#quickActionProducts` - "View Products" button
   - `#quickActionDeals` - "Get Deals" button
   - `#quickActionHelp` - "Help" button

### CSS Styling Recommendations

```css
#chatWidget {
    position: fixed;
    bottom: 100px;
    right: 20px;
    width: 350px;
    height: 500px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    z-index: 9999;
}

#chatToggleBtn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #4a90d9;
    z-index: 9998;
}
```

---

## Scheduled Jobs

Configure these jobs in **Wix Dashboard > Developer Tools > Scheduled Jobs**:

| Job Name | Function | Schedule |
|----------|----------|----------|
| Process Abandoned Carts | `processAbandonedCarts` | Every hour |
| Second Reminder | `sendSecondReminder` | Every 6 hours |
| Update Customer Segments | `updateCustomerSegments` | Daily at 2:00 AM |
| Clean Old Data | `cleanOldData` | Weekly, Sunday 3:00 AM |
| Daily Sales Report | `generateDailySalesReport` | Daily at 6:00 AM |

---

## Email Templates

Create these Triggered Email templates in Wix CRM:

### Cart Recovery Email (ID: `cart_recovery_email`)

**Subject**: Olvidaste algo... / You left something behind

**Dynamic Variables**:
- `{{customerName}}` - Customer's first name
- `{{cartItems}}` - JSON of cart items
- `{{cartTotal}}` - Original cart total
- `{{discountCode}}` - Recovery discount code
- `{{discountPercent}}` - Discount percentage

**Recommended Content**:
```
¡Hola {{customerName}}!

We noticed you left some delicious items in your cart. 🛒

Your cart total: ${{cartTotal}}

Don't miss out! Use code {{discountCode}} for {{discountPercent}}% off!

[Complete Your Order →]

¡Nos vemos pronto!
The Don Churro Team 🍩
```

---

## Testing

### Test Checklist

1. **Product Recommendations**
   - [ ] Trending products display on home page
   - [ ] Personalized recommendations show for logged-in users
   - [ ] Cross-sell products appear on cart page
   - [ ] Upsell products display on product pages

2. **Chat Widget**
   - [ ] Chat opens/closes correctly
   - [ ] Bot responds to greetings
   - [ ] Product recommendations work via chat
   - [ ] Discount codes are delivered

3. **Cart Abandonment**
   - [ ] Abandoned carts are tracked
   - [ ] Recovery emails are sent
   - [ ] Discount codes are generated and valid

4. **Analytics**
   - [ ] Page views are tracked
   - [ ] Product views are recorded
   - [ ] Add-to-cart events logged

### Testing HTTP Endpoints

```bash
# Check bot health
curl https://YOUR-SITE.wixsite.com/_functions/salesBotHealth

# Get analytics
curl https://YOUR-SITE.wixsite.com/_functions/salesAnalytics
```

---

## Troubleshooting

### Common Issues

**Q: Recommendations not appearing**
- Check that products have the required fields (name, price, category)
- Verify the database collections exist and are properly configured
- Check browser console for JavaScript errors

**Q: Chat widget not responding**
- Ensure all element IDs match exactly
- Check that the chat widget is initialized in masterPage.js
- Verify backend functions are exported correctly

**Q: Cart recovery emails not sending**
- Confirm Triggered Emails is enabled
- Verify email template ID matches code
- Check that customer has valid email on file

**Q: Scheduled jobs not running**
- Verify job configuration in Wix Dashboard
- Check job logs for errors
- Ensure functions are exported from jobs.config.js

### Support

For additional help, check:
- [Wix Velo Documentation](https://www.wix.com/velo/reference)
- [Wix CRM API Reference](https://www.wix.com/velo/reference/wix-crm-backend)
- [Wix Stores Documentation](https://www.wix.com/velo/reference/wix-stores)

---

## Best Practices

1. **Start Simple**: Enable features one at a time
2. **Monitor Performance**: Check analytics daily
3. **A/B Test**: Try different offers and messages
4. **Update Regularly**: Keep product associations current
5. **Respect Privacy**: Follow GDPR and local regulations
6. **Personalize**: The more data you collect, the better recommendations become

---

## License

MIT License - Feel free to modify and use for your business.

**Made with ❤️ for Don Churro**
