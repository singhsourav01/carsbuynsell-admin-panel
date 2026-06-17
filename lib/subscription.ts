import { apiRequestDirect } from "./auth";
import RazorpayCheckout from "react-native-razorpay";

// ── Real backend (port 8002) handles all subscription API logic ──────────────
const SUB_BASE = "http://65.2.10.30:3002";
const SUB_PATH = "/user/subscriptions";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SubscriptionPlan {
    sp_id: string;
    sp_name: string;
    sp_price: number;    // in rupees (not paise)
    sp_duration: number; // days
    sp_description: string;
}

export interface ActiveSubscription {
    sub_id: string;
    sub_status: string;
    sub_remaining_uses?: number;
    remaining_uses?: number;
    sub_expires_at: string;
    sub_starts_at: string;
    plan: SubscriptionPlan;
    // Engagements track active bids/orders per vehicle
    engagements?: Array<{
        eng_id: string;
        eng_listing_id: string;
        eng_type: 'AUCTION' | 'BUY_NOW';
        eng_status: 'ACTIVE' | 'CLOSED';
    }>;
}

export interface CreateOrderResult {
    razorpay_order_id: string;
    amount: number;   // in paise
    currency: string;
    key_id: string;
}

export interface RazorpayPaymentResult {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API calls
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /user/subscriptions/me
 * Returns the user's active subscription, or null if none/expired/all-engagements-used.
 * Backend checks: status=ACTIVE, expires_at > now, remaining_uses > 0
 * Votes restore when admin closes auction (not daily reset).
 */
export async function fetchMySubscription(): Promise<ActiveSubscription | null> {
    try {
        const url = `${SUB_BASE}${SUB_PATH}/me`;
        console.log("[DEBUG-SUB] Fetching my subscription from:", url);
        const res = await apiRequestDirect("GET", url, undefined, true);
        console.log("[DEBUG-SUB] /me response status:", res.status);

        const rawText = await res.text();
        console.log("[DEBUG-SUB] /me raw response:", rawText);

        if (!res.ok) return null; // 404 = no active sub, 401 = unauth — both return null
        const data = JSON.parse(rawText);
        console.log("[DEBUG-SUB] /me parsed data:", JSON.stringify(data?.data));
        return data?.data ?? null;
    } catch (e) {
        console.error("[DEBUG-SUB] fetchMySubscription error:", e);
        return null;
    }
}

/**
 * GET /user/subscriptions/plans
 * Returns all active subscription plans from the backend DB.
 */
export async function fetchPlans(): Promise<SubscriptionPlan[]> {
    try {
        const res = await apiRequestDirect("GET", `${SUB_BASE}${SUB_PATH}/plans`);
        const raw = await res.text();
        if (!res.ok) return [];
        const data = JSON.parse(raw);
        return data?.data ?? [];
    } catch {
        return [];
    }
}

/**
 * POST /user/subscriptions/create-order
 * Creates a Razorpay order on the backend and stores a PENDING subscription in DB.
 * Returns { razorpay_order_id, amount (paise), currency, key_id }
 */
export async function createSubscriptionOrder(plan_id: string): Promise<CreateOrderResult> {
    const url = `${SUB_BASE}${SUB_PATH}/create-order`;
    console.log("[SUB] Creating order:", url, "plan_id:", plan_id);

    // 15s timeout — backend calls Razorpay API which may be slow
    const fetchPromise = apiRequestDirect("POST", url, { plan_id }, true);
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Please check your connection.")), 15000)
    );

    const res = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    const raw = await res.text();
    console.log("[SUB] create-order response:", res.status, raw.substring(0, 400));

    let data: any = {};
    try { data = JSON.parse(raw); } catch { data = {}; }

    if (!res.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            data?.errors?.[0]?.message ||
            `Server error (${res.status})`
        );
    }
    return data.data as CreateOrderResult;
}

/**
 * Opens the Razorpay Native Checkout using react-native-razorpay.
 *
 * This uses the native Android/iOS SDK which supports:
 *  - UPI Intent (Google Pay, PhonePe, Paytm, etc.)
 *  - Cards, Net Banking, Wallets
 *  - Proper native payment sheet experience
 *
 * Flow:
 *  1. Create order on backend → get order_id, key_id, amount
 *  2. Open native Razorpay checkout with these details
 *  3. On success → returns payment_id, order_id, signature
 *  4. Verify signature on backend → activate subscription
 */
export async function openNativeRazorpayCheckout(
    order: CreateOrderResult,
    userName = "CarsbuyNsell User",
    userEmail = "",
    userPhone = "",
    description = "CarsbuyNsell Subscription",
): Promise<RazorpayPaymentResult> {
    console.log("[RZP-Native] Opening checkout for order:", order.razorpay_order_id);
    console.log("[RZP-Native] Amount (paise):", order.amount, "Key:", order.key_id);

    const options = {
        description: description,
        image: "https://carsbuynsell.com/logo.png",
        currency: order.currency || "INR",
        key: order.key_id,
        amount: String(order.amount), // Razorpay native SDK expects string
        name: "CarsbuyNsell",
        order_id: order.razorpay_order_id,
        prefill: {
            email: userEmail || "user@carsbuynsell.com",
            contact: userPhone || "",
            name: userName,
        },
        theme: { color: "#3D5BD9" },
    };

    console.log("[RZP-Native] Options:", JSON.stringify(options));

    try {
        const result = await RazorpayCheckout.open(options);
        console.log("[RZP-Native] Payment success:", JSON.stringify(result));

        // react-native-razorpay returns: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        if (!result.razorpay_payment_id || !result.razorpay_signature) {
            throw new Error("Payment succeeded but response is incomplete. Contact support.");
        }

        return {
            razorpay_payment_id: result.razorpay_payment_id,
            razorpay_order_id: result.razorpay_order_id || order.razorpay_order_id,
            razorpay_signature: result.razorpay_signature,
        };
    } catch (error: any) {
        console.error("[RZP-Native] Payment error:", JSON.stringify(error));

        // react-native-razorpay error structure: { code, description }
        if (error?.code === 0 || error?.description?.toLowerCase?.()?.includes("cancel")) {
            throw new Error("Payment was cancelled.");
        }

        const errorMsg = error?.description || error?.message || "Payment failed at gateway";
        throw new Error(errorMsg);
    }
}

/**
 * POST /user/subscriptions/verify-payment
 * Verifies the HMAC-SHA256 signature on the backend and activates the subscription.
 */
export async function verifySubscriptionPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
): Promise<ActiveSubscription> {
    const url = `${SUB_BASE}${SUB_PATH}/verify-payment`;
    const res = await apiRequestDirect(
        "POST", url,
        { razorpay_order_id, razorpay_payment_id, razorpay_signature },
        true
    );
    const raw = await res.text();
    console.log("[SUB] verify-payment response:", res.status, raw.substring(0, 300));
    let data: any = {};
    try { data = JSON.parse(raw); } catch { data = {}; }
    if (!res.ok) throw new Error(data?.message || data?.error || "Payment verification failed");
    return data.data as ActiveSubscription;
}
