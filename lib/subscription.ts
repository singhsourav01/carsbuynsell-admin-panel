// Use apiRequestDirect from auth — it uses expo/fetch correctly and works for all other API calls
import { apiRequestDirect, getToken } from "./auth";

const SUB_BASE = "http://169.254.61.129 :8002";
const SUB_PATH = "/user/subscriptions";

export interface SubscriptionPlan {
    sp_id: string;
    sp_name: string;
    sp_price: number;
    sp_duration: number;
    sp_description: string;
}

export interface ActiveSubscription {
    sub_id: string;
    sub_status: string;
    sub_remaining_uses: number;
    sub_expires_at: string;
    sub_starts_at: string;
    plan: SubscriptionPlan;
}

/** GET /user/subscriptions/me — returns active subscription or null */
export async function fetchMySubscription(): Promise<ActiveSubscription | null> {
    try {
        const res = await apiRequestDirect("GET", `${SUB_BASE}${SUB_PATH}/me`, undefined, true);
        if (!res.ok) return null;
        const data = JSON.parse(await res.text());
        return data?.data ?? null;
    } catch {
        return null;
    }
}

/** GET /user/subscriptions/plans — returns first active plan id */
async function getFirstPlanId(): Promise<string | null> {
    try {
        const url = `${SUB_BASE}${SUB_PATH}/plans`;
        console.log("[SUB] Fetching plans:", url);
        const res = await apiRequestDirect("GET", url);
        const raw = await res.text();
        console.log("[SUB] Plans response:", res.status, raw.substring(0, 300));
        if (!res.ok) return null;
        const data = JSON.parse(raw);
        const plans: SubscriptionPlan[] = data?.data ?? [];
        console.log("[SUB] Plans found:", plans.length, plans.map((p: SubscriptionPlan) => p.sp_id));
        return plans.length > 0 ? plans[0].sp_id : null;
    } catch (e) {
        console.log("[SUB] Plans fetch error:", e);
        return null;
    }
}

export interface CreateOrderResult {
    razorpay_order_id: string;
    amount: number;   // in paise
    currency: string;
    key_id: string;
}

/** POST /user/subscriptions/create-order */
export async function createSubscriptionOrder(): Promise<CreateOrderResult> {
    const plan_id = await getFirstPlanId();

    const body: Record<string, any> = {};
    if (plan_id) body.plan_id = plan_id;

    const url = `${SUB_BASE}${SUB_PATH}/create-order`;
    console.log("[SUB] Creating order:", url, "plan_id:", plan_id);

    // Wrap the API call in a 15s timeout because the backend might hang on Razorpay calls
    const fetchPromise = apiRequestDirect("POST", url, body, true);
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Backend took too long to respond. It might be hanging on the Razorpay API call.")), 15000)
    );

    const res = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    const raw = await res.text();
    console.log("[SUB] Create-order response:", res.status, raw.substring(0, 500));

    let data: any = {};
    try { data = JSON.parse(raw); } catch { data = {}; }

    if (!res.ok) {
        const msg =
            data?.message ||
            data?.error ||
            data?.errors?.[0]?.message ||
            `Request failed with status ${res.status}`;
        throw new Error(msg);
    }
    return data.data;
}

/** POST /user/subscriptions/verify-payment */
export async function verifySubscriptionPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
): Promise<ActiveSubscription> {
    const url = `${SUB_BASE}${SUB_PATH}/verify-payment`;
    const res = await apiRequestDirect("POST", url, { razorpay_order_id, razorpay_payment_id, razorpay_signature }, true);
    const raw = await res.text();
    console.log("[SUB] Verify-payment response:", res.status, raw.substring(0, 300));
    let data: any = {};
    try { data = JSON.parse(raw); } catch { data = {}; }
    if (!res.ok) throw new Error(data?.message || data?.error || "Payment verification failed");
    return data.data;
}
