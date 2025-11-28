# Don Churro Sales Bot 🍩🤖

A powerful Wix Velo sales optimization bot designed to maximize revenue through intelligent product recommendations, cart recovery, and customer engagement.

## Features

### 🎯 Sales Optimization
- **Personalized Recommendations**: AI-driven product suggestions based on customer purchase history and browsing behavior
- **Cross-sell Engine**: Suggest complementary products on cart page to increase order value
- **Upsell Suggestions**: Show higher-value alternatives on product pages
- **Trending Products**: Highlight best-sellers to new visitors

### 🛒 Cart Abandonment Recovery
- **Automatic Detection**: Track when customers leave without completing purchase
- **Email Recovery Campaigns**: Automated emails with personalized discount codes
- **Multi-touch Reminders**: Send follow-up reminders for unclaimed carts
- **Performance Tracking**: Monitor recovery rates and revenue saved

### 💬 Interactive Chat Widget
- **24/7 Customer Engagement**: Always-on sales assistant
- **Natural Language Processing**: Understand customer intent and respond appropriately
- **Product Discovery**: Help customers find what they're looking for
- **Instant Offers**: Deliver personalized discount codes through chat
- **Quick Actions**: One-click access to products, deals, and help

### 📊 Customer Intelligence
- **Customer Segmentation**: Automatically categorize customers (VIP, Loyal, Regular, New)
- **Lifetime Value Scoring**: Calculate and track customer value
- **Behavior Tracking**: Monitor page views, scroll depth, and interactions
- **Personalized Offers**: Deliver segment-specific discounts and promotions

### 🔔 Engagement Features
- **Exit Intent Popups**: Capture leaving visitors with special offers
- **Social Proof Notifications**: Show real-time purchase activity
- **Urgency Indicators**: Display low stock and time-limited sale alerts
- **Promotional Banners**: Highlight active promotions site-wide

## Project Structure

```
Don-Churro/
├── src/
│   ├── backend/
│   │   ├── salesBot.jsw         # Core backend logic
│   │   ├── http-functions.js    # HTTP API endpoints
│   │   └── jobs.config.js       # Scheduled job definitions
│   ├── public/
│   │   ├── salesBotClient.js    # Frontend client module
│   │   └── chatWidget.js        # Chat bot implementation
│   └── pages/
│       └── pageExamples.js      # Page integration examples
├── docs/
│   └── SETUP.md                 # Detailed setup guide
└── README.md
```

## Quick Start

1. **Enable Velo**: Turn on Dev Mode in Wix Editor
2. **Create Databases**: Set up required collections (see [SETUP.md](docs/SETUP.md))
3. **Install Files**: Copy backend and public files to your Wix site
4. **Add Elements**: Set up chat widget and recommendation displays
5. **Configure Jobs**: Schedule automated tasks in Wix Dashboard
6. **Test**: Verify all features are working correctly

## Key Modules

### Backend (salesBot.jsw)
- `getPersonalizedRecommendations()` - Get AI-powered product suggestions
- `getCrossSellProducts()` - Find complementary products
- `getUpsellProducts()` - Find higher-value alternatives  
- `trackAbandonedCart()` - Save abandoned cart for recovery
- `sendCartRecoveryEmail()` - Trigger recovery email with discount
- `getPersonalizedOffer()` - Get customer-specific discount

### Frontend (salesBotClient.js)
- `initializeSalesBot()` - Initialize tracking and features
- `displayRecommendations()` - Show product recommendations
- `displayCrossSell()` - Display cross-sell products
- `displayUpsell()` - Show upsell alternatives
- `showUrgencyNotification()` - Display low stock/time alerts

### Chat Widget (chatWidget.js)
- `initializeChatBot()` - Start chat functionality
- Natural language intent recognition
- Product search and discovery
- Discount code delivery
- Quick action buttons

## HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/_functions/salesBotHealth` | GET | Health check |
| `/_functions/cartAbandoned` | POST | Record abandoned cart |
| `/_functions/sendRecoveryEmail` | POST | Trigger recovery email |
| `/_functions/salesAnalytics` | GET | Get sales metrics |
| `/_functions/bulkRecovery` | POST | Process multiple carts |

## Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Process Abandoned Carts | Hourly | Send recovery emails |
| Second Reminder | Every 6 hours | Follow-up reminders |
| Update Customer Segments | Daily 2 AM | Recalculate customer tiers |
| Clean Old Data | Weekly Sunday | Remove outdated records |
| Daily Sales Report | Daily 6 AM | Generate performance summary |

## Sales Strategies Implemented

1. **Recommendation Engine**: Show relevant products based on behavior
2. **Abandoned Cart Recovery**: Recover 10-15% of lost sales
3. **Cross-sell at Checkout**: Increase average order value
4. **Upsell on Product Pages**: Guide to premium options
5. **Exit Intent Capture**: Convert leaving visitors
6. **Social Proof**: Build trust with activity notifications
7. **Urgency Creation**: Encourage immediate purchase
8. **Customer Loyalty**: Reward repeat customers with better offers
9. **Chat Engagement**: 24/7 sales assistance
10. **Personalized Discounts**: Right offer to right customer

## Documentation

For detailed setup instructions, database schemas, and troubleshooting, see:
- [Setup Guide](docs/SETUP.md)

## Requirements

- Wix website with Wix Stores
- Wix Premium plan
- Velo by Wix enabled
- Wix CRM for customer management
- Triggered Emails feature

## License

MIT License - Feel free to modify and use for your business.

---

**Made with ❤️ for Don Churro** 🍩
