import { apiRequestDirect } from "./auth";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

// Required for web browser popups to communicate back to the main app tab
WebBrowser.maybeCompleteAuthSession();

// ── Real backend (port 8002) handles all subscription API logic ──────────────
const SUB_BASE = "http://13.201.55.131:3002";
const SUB_PATH = "/user/subscriptions";

// ── Local Express server (port 5000) serves the Razorpay checkout HTML page ──
// NOTE: This must remain 5000, because the real backend (8002) does not have
// the razorpay-checkout.html file.
const LOCAL_SERVER = process.env.EXPO_PUBLIC_LOCAL_SERVER || "http://13.201.55.131:3002";

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
 * Returns the user's active subscription, or null if none/expired.
 * Backend checks: status=ACTIVE, expires_at > now, remaining_uses > 0
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
 * Opens the Razorpay Standard Checkout in the device browser via expo-web-browser.
 *
 * Flow:
 *  1. Build URL to LOCAL_SERVER/razorpay-checkout with order params as query string
 *  2. Open via openAuthSessionAsync — waits for the autobid:// deep-link redirect
 *  3. Razorpay modal opens in browser; buyer completes payment
 *  4. On success, the HTML page redirects to:
 *       autobid://payment-callback?status=success&razorpay_payment_id=...
 *  5. We parse the params and return them
 */
export async function openRazorpayCheckout(
    order: CreateOrderResult,
    userName = "AutoBid User",
    userEmail = "",
): Promise<RazorpayPaymentResult> {
    const redirectUrl = Linking.createURL("payment-callback");

    const params = new URLSearchParams({
        order_id: order.razorpay_order_id,
        amount: String(order.amount),
        currency: order.currency || "INR",
        key_id: order.key_id,
        name: userName,
        email: userEmail,
        redirect_url: redirectUrl,
    });

    const checkoutUrl = `${LOCAL_SERVER}/razorpay-checkout?${params.toString()}`;

    console.log("[RZP] Opening:", checkoutUrl);
    console.log("[RZP] Redirect:", redirectUrl);

    const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, redirectUrl, {
        showInRecents: true,
        preferEphemeralSession: false,
    });

    console.log("[RZP] Browser result type:", result.type);

    if (result.type === "cancel") {
        throw new Error("Payment was cancelled.");
    }
    if (result.type !== "success" || !result.url) {
        throw new Error("Payment window closed before completion.");
    }

    // Parse: autobid://payment-callback?status=success&razorpay_payment_id=...
    const parsed = Linking.parse(result.url);
    const q = parsed.queryParams ?? {};
    console.log("[RZP] Callback params:", q);

    const status = q.status as string;

    if (status === "success") {
        const paymentId = q.razorpay_payment_id as string;
        const orderId = q.razorpay_order_id as string;
        const signature = q.razorpay_signature as string;
        if (!paymentId || !orderId || !signature) {
            throw new Error("Payment succeeded but response is incomplete. Contact support.");
        }
        return { razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature };
    }

    if (status === "failed") {
        const desc = q.error_description as string || "Payment failed";
        const reason = q.error_reason as string || "";
        throw new Error(`${desc}${reason ? ` (${reason})` : ""}`);
    }

    throw new Error("Unexpected payment result. Please try again.");
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
