/**
 * Don Churro Sales Bot - HTTP Functions
 * Wix Velo HTTP Endpoints for External Integrations
 * 
 * These endpoints can be called by external services like:
 * - Webhook handlers
 * - Third-party integrations
 * - Scheduled jobs
 */

import { ok, badRequest, serverError } from 'wix-http-functions';
import wixData from 'wix-data';
import { sendCartRecoveryEmail, trackAbandonedCart } from './salesBot.jsw';

/**
 * GET endpoint to check bot health status
 * URL: /_functions/salesBotHealth
 */
export function get_salesBotHealth(request) {
    return ok({
        body: {
            status: "healthy",
            version: "1.0.0",
            timestamp: new Date().toISOString(),
            service: "Don Churro Sales Bot"
        }
    });
}

/**
 * POST endpoint to process cart abandonment webhook
 * URL: /_functions/cartAbandoned
 */
export async function post_cartAbandoned(request) {
    try {
        const body = await request.body.json();
        
        if (!body.customerId || !body.cartItems) {
            return badRequest({
                body: {
                    error: "Missing required fields: customerId, cartItems"
                }
            });
        }

        const result = await trackAbandonedCart(
            body.customerId,
            body.cartItems,
            body.cartTotal || 0
        );

        if (result.success) {
            return ok({ body: result });
        } else {
            return serverError({ body: result });
        }
    } catch (error) {
        return serverError({
            body: {
                error: "Internal server error",
                message: error.message
            }
        });
    }
}

/**
 * POST endpoint to trigger cart recovery email
 * URL: /_functions/sendRecoveryEmail
 */
export async function post_sendRecoveryEmail(request) {
    try {
        const body = await request.body.json();
        
        if (!body.abandonedCartId) {
            return badRequest({
                body: {
                    error: "Missing required field: abandonedCartId"
                }
            });
        }

        const result = await sendCartRecoveryEmail(body.abandonedCartId);

        if (result.success) {
            return ok({ body: result });
        } else {
            return badRequest({ body: result });
        }
    } catch (error) {
        return serverError({
            body: {
                error: "Internal server error",
                message: error.message
            }
        });
    }
}

/**
 * GET endpoint to retrieve sales analytics
 * URL: /_functions/salesAnalytics
 */
export async function get_salesAnalytics(request) {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Get orders from last 30 days
        const orders = await wixData.query("Orders")
            .ge("_createdDate", thirtyDaysAgo)
            .find();

        // Get abandoned carts
        const abandonedCarts = await wixData.query("AbandonedCarts")
            .ge("abandonedAt", thirtyDaysAgo)
            .find();

        // Get recovered carts
        const recoveredCarts = abandonedCarts.items.filter(cart => cart.recovered);

        // Calculate metrics
        const totalRevenue = orders.items.reduce((sum, order) => sum + (order.total || 0), 0);
        const avgOrderValue = orders.items.length > 0 ? totalRevenue / orders.items.length : 0;
        const abandonmentRate = abandonedCarts.totalCount > 0 
            ? ((abandonedCarts.totalCount - recoveredCarts.length) / abandonedCarts.totalCount * 100).toFixed(2)
            : 0;
        const recoveryRate = abandonedCarts.totalCount > 0
            ? (recoveredCarts.length / abandonedCarts.totalCount * 100).toFixed(2)
            : 0;

        return ok({
            body: {
                period: "last_30_days",
                metrics: {
                    totalOrders: orders.totalCount,
                    totalRevenue: totalRevenue.toFixed(2),
                    avgOrderValue: avgOrderValue.toFixed(2),
                    abandonedCarts: abandonedCarts.totalCount,
                    recoveredCarts: recoveredCarts.length,
                    abandonmentRate: `${abandonmentRate}%`,
                    recoveryRate: `${recoveryRate}%`
                },
                generatedAt: now.toISOString()
            }
        });
    } catch (error) {
        return serverError({
            body: {
                error: "Failed to generate analytics",
                message: error.message
            }
        });
    }
}

/**
 * POST endpoint to process bulk abandoned cart recovery
 * URL: /_functions/bulkRecovery
 */
export async function post_bulkRecovery(request) {
    try {
        const body = await request.body.json();
        const hoursOld = body.hoursOld || 1; // Default: carts abandoned 1+ hour ago
        
        const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
        
        // Find abandoned carts that haven't been emailed yet
        const abandonedCarts = await wixData.query("AbandonedCarts")
            .le("abandonedAt", cutoffTime)
            .eq("emailSent", false)
            .eq("recovered", false)
            .limit(50)
            .find();

        const results = {
            processed: 0,
            successful: 0,
            failed: 0,
            errors: []
        };

        for (const cart of abandonedCarts.items) {
            results.processed++;
            try {
                const result = await sendCartRecoveryEmail(cart._id);
                if (result.success) {
                    results.successful++;
                } else {
                    results.failed++;
                    results.errors.push({ cartId: cart._id, error: result.message });
                }
            } catch (error) {
                results.failed++;
                results.errors.push({ cartId: cart._id, error: error.message });
            }
        }

        return ok({ body: results });
    } catch (error) {
        return serverError({
            body: {
                error: "Bulk recovery failed",
                message: error.message
            }
        });
    }
}
