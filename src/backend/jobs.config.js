/**
 * Don Churro Sales Bot - Scheduled Jobs
 * Wix Velo Jobs for Automated Tasks
 * 
 * Configure these jobs in the Wix Dashboard under:
 * Developer Tools > Scheduled Jobs
 */

import wixData from 'wix-data';
import { sendCartRecoveryEmail, getCustomerValueScore } from './salesBot.jsw';

/**
 * Scheduled Job: Process Abandoned Carts
 * Recommended Schedule: Every hour
 * 
 * This job finds carts abandoned 1-24 hours ago and sends recovery emails
 */
export async function processAbandonedCarts() {
    console.log("Starting abandoned cart processing job...");
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    try {
        // Find carts abandoned between 1-24 hours ago, not yet emailed
        const abandonedCarts = await wixData.query("AbandonedCarts")
            .ge("abandonedAt", twentyFourHoursAgo)
            .le("abandonedAt", oneHourAgo)
            .eq("emailSent", false)
            .eq("recovered", false)
            .limit(100)
            .find();

        console.log(`Found ${abandonedCarts.items.length} abandoned carts to process`);

        let successCount = 0;
        let failCount = 0;

        for (const cart of abandonedCarts.items) {
            try {
                const result = await sendCartRecoveryEmail(cart._id);
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                console.error(`Failed to process cart ${cart._id}:`, error);
                failCount++;
            }
        }

        console.log(`Abandoned cart job complete. Success: ${successCount}, Failed: ${failCount}`);
        
        return {
            processed: abandonedCarts.items.length,
            successful: successCount,
            failed: failCount
        };
    } catch (error) {
        console.error("Abandoned cart processing job failed:", error);
        throw error;
    }
}

/**
 * Scheduled Job: Send Second Reminder
 * Recommended Schedule: Every 6 hours
 * 
 * Sends a second reminder to carts that were emailed 24+ hours ago but not recovered
 */
export async function sendSecondReminder() {
    console.log("Starting second reminder job...");
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    try {
        // Find carts that received first email 24-48 hours ago
        const eligibleCarts = await wixData.query("AbandonedCarts")
            .ge("lastReminderAt", fortyEightHoursAgo)
            .le("lastReminderAt", twentyFourHoursAgo)
            .eq("recovered", false)
            .eq("reminderCount", 1)
            .limit(50)
            .find();

        console.log(`Found ${eligibleCarts.items.length} carts for second reminder`);

        let successCount = 0;

        for (const cart of eligibleCarts.items) {
            try {
                await sendCartRecoveryEmail(cart._id);
                successCount++;
            } catch (error) {
                console.error(`Failed to send second reminder for cart ${cart._id}:`, error);
            }
        }

        console.log(`Second reminder job complete. Sent: ${successCount}`);
        
        return { sent: successCount };
    } catch (error) {
        console.error("Second reminder job failed:", error);
        throw error;
    }
}

/**
 * Scheduled Job: Update Customer Segments
 * Recommended Schedule: Daily at 2 AM
 * 
 * Recalculates customer value scores and updates their segments
 */
export async function updateCustomerSegments() {
    console.log("Starting customer segmentation job...");
    
    try {
        // Get all customers with orders
        const customers = await wixData.query("Customers")
            .limit(1000)
            .find();

        console.log(`Processing ${customers.items.length} customers`);

        let updated = 0;

        for (const customer of customers.items) {
            try {
                const valueScore = await getCustomerValueScore(customer._id);
                
                if (valueScore.success && customer.segment !== valueScore.segment) {
                    await wixData.update("Customers", {
                        ...customer,
                        segment: valueScore.segment,
                        valueScore: valueScore.score,
                        lastSegmentUpdate: new Date()
                    });
                    updated++;
                }
            } catch (error) {
                console.error(`Failed to update segment for customer ${customer._id}:`, error);
            }
        }

        console.log(`Customer segmentation complete. Updated: ${updated}`);
        
        return { processed: customers.items.length, updated: updated };
    } catch (error) {
        console.error("Customer segmentation job failed:", error);
        throw error;
    }
}

/**
 * Scheduled Job: Clean Old Data
 * Recommended Schedule: Weekly on Sunday at 3 AM
 * 
 * Removes old analytics and interaction data to maintain performance
 */
export async function cleanOldData() {
    console.log("Starting data cleanup job...");
    
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    try {
        // Remove old browsing history
        const oldBrowsingHistory = await wixData.query("BrowsingHistory")
            .lt("timestamp", ninetyDaysAgo)
            .limit(1000)
            .find();

        let deletedBrowsing = 0;
        for (const record of oldBrowsingHistory.items) {
            await wixData.remove("BrowsingHistory", record._id);
            deletedBrowsing++;
        }

        // Remove old customer interactions
        const oldInteractions = await wixData.query("CustomerInteractions")
            .lt("timestamp", ninetyDaysAgo)
            .limit(1000)
            .find();

        let deletedInteractions = 0;
        for (const record of oldInteractions.items) {
            await wixData.remove("CustomerInteractions", record._id);
            deletedInteractions++;
        }

        // Remove recovered abandoned carts older than 90 days
        const oldCarts = await wixData.query("AbandonedCarts")
            .lt("abandonedAt", ninetyDaysAgo)
            .eq("recovered", true)
            .limit(500)
            .find();

        let deletedCarts = 0;
        for (const cart of oldCarts.items) {
            await wixData.remove("AbandonedCarts", cart._id);
            deletedCarts++;
        }

        console.log(`Cleanup complete. Deleted: ${deletedBrowsing} browsing records, ${deletedInteractions} interactions, ${deletedCarts} old carts`);
        
        return {
            deletedBrowsingHistory: deletedBrowsing,
            deletedInteractions: deletedInteractions,
            deletedCarts: deletedCarts
        };
    } catch (error) {
        console.error("Data cleanup job failed:", error);
        throw error;
    }
}

/**
 * Scheduled Job: Generate Daily Sales Report
 * Recommended Schedule: Daily at 6 AM
 * 
 * Creates a daily summary of sales performance
 */
export async function generateDailySalesReport() {
    console.log("Starting daily sales report generation...");
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const dayBefore = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    try {
        // Get yesterday's orders
        const todayOrders = await wixData.query("Orders")
            .ge("_createdDate", yesterday)
            .lt("_createdDate", now)
            .find();

        // Get day before yesterday's orders for comparison
        const previousOrders = await wixData.query("Orders")
            .ge("_createdDate", dayBefore)
            .lt("_createdDate", yesterday)
            .find();

        // Calculate metrics
        const todayRevenue = todayOrders.items.reduce((sum, order) => sum + (order.total || 0), 0);
        const previousRevenue = previousOrders.items.reduce((sum, order) => sum + (order.total || 0), 0);
        
        const revenueChange = previousRevenue > 0 
            ? ((todayRevenue - previousRevenue) / previousRevenue * 100).toFixed(2)
            : 0;

        const report = {
            date: yesterday.toISOString().split('T')[0],
            orders: todayOrders.totalCount,
            revenue: todayRevenue.toFixed(2),
            avgOrderValue: todayOrders.totalCount > 0 
                ? (todayRevenue / todayOrders.totalCount).toFixed(2) 
                : 0,
            revenueChangePercent: revenueChange,
            previousDayOrders: previousOrders.totalCount,
            previousDayRevenue: previousRevenue.toFixed(2),
            generatedAt: now.toISOString()
        };

        // Save report to database
        await wixData.insert("DailyReports", report);

        console.log("Daily sales report generated:", report);
        
        return report;
    } catch (error) {
        console.error("Daily sales report generation failed:", error);
        throw error;
    }
}
