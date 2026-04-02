import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RazorpaySDK = require("razorpay");

// ── Razorpay client — created lazily so dotenv is already loaded ───────────────
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID || "";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.");
  }
  return new RazorpaySDK({ key_id, key_secret });
}

// In-memory pending subscription store keyed by Razorpay order ID
// (Replaces DB in this local dev server)
const pendingSubs: Record<string, { user_id: string; plan_id: string; expires_at: string }> = {};
const activeSubs: Record<string, {
  sub_id: string; sub_status: string; sub_remaining_uses: number;
  sub_expires_at: string; sub_starts_at: string;
  sub_razorpay_order_id: string; sub_razorpay_payment_id: string;
  plan: { sp_id: string; sp_name: string; sp_price: number; sp_duration: number; sp_description: string };
}> = {};

// Engagement tracking: votes locked per vehicle until auction closes
interface Engagement {
  eng_id: string;
  eng_user_id: string;
  eng_listing_id: string;
  eng_type: 'AUCTION' | 'BUY_NOW';
  eng_status: 'ACTIVE' | 'CLOSED';
  eng_created_at: string;
  eng_closed_at?: string;
}
const engagements: Engagement[] = [];

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  status: "PENDING_PHONE" | "PENDING_EMAIL" | "PENDING_APPROVAL" | "ACCEPTED" | "REJECTED" | "BLOCKED";
  phoneVerified: boolean;
  emailVerified: boolean;
}

const users: Record<string, User> = {
  demo: {
    id: "demo",
    fullName: "Demo User",
    email: "demo@carsbuynsell.in",
    phone: "+91 9999999999",
    password: "demo123",
    status: "ACCEPTED",
    phoneVerified: true,
    emailVerified: true,
  },
};

const sessions: Record<string, string> = {};
// In-memory OTPs: userId → { phoneOtp, emailOtp }
const otpStore: Record<string, { phoneOtp: string; emailOtp: string }> = {};

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ──────────────────────────────────────────────
  // SIGN UP / REGISTRATION
  // ──────────────────────────────────────────────

  // Step 1: Register — collect details, create pending user, generate OTPs
  app.post("/api/auth/register", (req: Request, res: Response) => {
    const { fullName, phone, email, password } = req.body;
    if (!fullName || !phone || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingPhone = Object.values(users).find((u) => u.phone === phone);
    if (existingPhone) {
      return res.status(409).json({ success: false, message: "This phone number is already registered" });
    }
    const existingEmail = Object.values(users).find((u) => u.email === email.toLowerCase());
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "This email is already registered" });
    }

    const id = Date.now().toString();
    users[id] = {
      id,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      status: "PENDING_PHONE",
      phoneVerified: false,
      emailVerified: false,
    };

    // For demo, OTPs are fixed (123456 for phone, 654321 for email)
    // In production these would be sent via SMS/email
    const phoneOtp = "123456";
    const emailOtp = "654321";
    otpStore[id] = { phoneOtp, emailOtp };

    console.log(`[SIGNUP] New user: ${fullName} | Phone OTP: ${phoneOtp} | Email OTP: ${emailOtp}`);

    res.json({
      success: true,
      data: {
        userId: id,
        phone: users[id].phone,
        email: users[id].email,
        message: "Account created. Please verify your phone number.",
      },
    });
  });

  // Step 2a: Verify phone OTP
  app.post("/api/auth/verify-phone", (req: Request, res: Response) => {
    const { userId, otp } = req.body;
    const user = users[userId];
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const stored = otpStore[userId];
    // Accept fixed demo OTP or actual stored OTP
    const isValid = otp === "123456" || otp === stored?.phoneOtp;
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Use 123456 for demo." });
    }

    user.phoneVerified = true;
    user.status = "PENDING_EMAIL";

    res.json({
      success: true,
      data: {
        userId,
        email: user.email,
        message: "Phone verified! Please verify your email.",
      },
    });
  });

  // Step 2b: Verify email OTP
  app.post("/api/auth/verify-email", (req: Request, res: Response) => {
    const { userId, otp } = req.body;
    const user = users[userId];
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!user.phoneVerified) {
      return res.status(400).json({ success: false, message: "Please verify your phone first" });
    }

    const stored = otpStore[userId];
    // Accept fixed demo OTP or actual stored OTP
    const isValid = otp === "654321" || otp === "123456" || otp === stored?.emailOtp;
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Use 654321 for demo." });
    }

    user.emailVerified = true;
    user.status = "PENDING_APPROVAL";

    // Clean up OTP store
    delete otpStore[userId];

    res.json({
      success: true,
      data: {
        userId,
        status: "PENDING_APPROVAL",
        message: "Email verified! Your account is pending admin approval.",
      },
    });
  });

  // Resend OTP (phone or email)
  app.post("/api/auth/resend-otp", (req: Request, res: Response) => {
    const { userId, type } = req.body; // type: "phone" | "email"
    const user = users[userId];
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!otpStore[userId]) {
      otpStore[userId] = { phoneOtp: "123456", emailOtp: "654321" };
    }

    const hint = type === "email" ? "654321" : "123456";
    res.json({
      success: true,
      data: { message: `OTP resent. Demo OTP: ${hint}` },
    });
  });

  // ──────────────────────────────────────────────
  // PHONE LOGIN (for existing users)
  // ──────────────────────────────────────────────

  app.post("/api/auth/request-otp", (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone number required" });

    const user = Object.values(users).find((u) => u.phone === phone);
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this number. Please sign up first." });
    }

    if (user.status === "PENDING_PHONE" || user.status === "PENDING_EMAIL") {
      return res.status(403).json({ success: false, message: "Please complete your account verification first." });
    }
    if (user.status === "PENDING_APPROVAL") {
      return res.status(403).json({ success: false, message: "Account is pending admin approval.", pendingApproval: true });
    }
    if (user.status === "REJECTED") return res.status(403).json({ success: false, message: "Account has been rejected." });
    if (user.status === "BLOCKED") return res.status(403).json({ success: false, message: "Account has been blocked." });

    if (!otpStore[user.id]) otpStore[user.id] = { phoneOtp: "123456", emailOtp: "654321" };

    res.json({ success: true, data: { userId: user.id, phone } });
  });

  app.post("/api/auth/verify-phone-otp", (req: Request, res: Response) => {
    const { userId, otp } = req.body;
    const user = users[userId];
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.status !== "ACCEPTED") return res.status(403).json({ success: false, message: "Account is not active yet." });

    const isValid = otp && /^\d{4,6}$/.test(otp);
    if (!isValid) return res.status(400).json({ success: false, message: "Invalid OTP. Use 123456 for demo." });

    const token = generateToken();
    sessions[token] = user.id;
    res.json({ success: true, data: { token, user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone } } });
  });

  // Demo login — instant access
  app.post("/api/auth/demo-login", (_req: Request, res: Response) => {
    const token = generateToken();
    sessions[token] = "demo";
    res.json({
      success: true,
      data: {
        token,
        user: { id: "demo", fullName: "Demo User", email: "demo@carsbuynsell.in", phone: "+91 9999999999" },
      },
    });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    const token = auth?.replace("Bearer ", "");
    if (token) delete sessions[token];
    res.json({ success: true });
  });

  // ──────────────────────────────────────────────
  // HOME
  // ──────────────────────────────────────────────

  app.get("/api/user/home", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        featured: [
          { id: "f1", title: "2021 Toyota Fortuner Legend", type: "AUCTION", currentBid: 3800000, image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=600", auctionEnd: "2026-04-15T18:00:00.000Z", bidCount: 34 },
          { id: "f2", title: "2023 Hyundai Creta SX", type: "BUY_NOW", price: 1580000, image: "https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=600" },
          { id: "f3", title: "2022 BMW 3 Series M Sport", type: "AUCTION", currentBid: 5200000, image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600", auctionEnd: "2026-04-20T12:00:00.000Z", bidCount: 51 },
          { id: "f4", title: "2023 Tata Nexon EV Max", type: "BUY_NOW", price: 2050000, image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600" },
        ],
        categories: [
          { id: "all", label: "All" }, { id: "sedan", label: "Sedan" }, { id: "suv", label: "SUV" },
          { id: "luxury", label: "Luxury" }, { id: "sports", label: "Sports" }, { id: "electric", label: "Electric" },
        ],
        recent: {
          data: [
            { id: "r1", title: "Honda City ZX 2022", type: "AUCTION", currentBid: 1265000, image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400", auctionEnd: "2026-04-10T12:00:00.000Z", bidCount: 12 },
            { id: "r2", title: "Toyota Fortuner 2021", type: "AUCTION", currentBid: 4150000, image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=400", auctionEnd: "2026-05-01T10:00:00.000Z", bidCount: 22 },
            { id: "r3", title: "Hyundai Creta 2023", type: "BUY_NOW", price: 1800000, image: "https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=400" },
            { id: "r4", title: "Mahindra XUV700 AX7", type: "AUCTION", currentBid: 2350000, image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400", auctionEnd: "2026-04-25T14:00:00.000Z", bidCount: 8 },
            { id: "r5", title: "Tata Nexon EV Max", type: "BUY_NOW", price: 2050000, image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400" },
            { id: "r6", title: "Kia Seltos HTX+ 2023", type: "AUCTION", currentBid: 1750000, image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400", auctionEnd: "2026-04-18T09:00:00.000Z", bidCount: 16 },
          ],
        },
      },
    });
  });

  // ──────────────────────────────────────────────
  // LIVE AUCTIONS
  // ──────────────────────────────────────────────

  app.get("/api/user/live", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        auctions: [
          { id: "1", title: "2022 Honda City ZX", type: "AUCTION", currentBid: 1265000, minIncrement: 5000, bidCount: 12, auctionEnd: "2026-04-10T12:00:00.000Z", image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600", category: "Sedan", year: 2022, km: 45000, location: "Mumbai" },
          { id: "2", title: "Toyota Fortuner 2021", type: "AUCTION", currentBid: 4150000, minIncrement: 10000, bidCount: 22, auctionEnd: "2026-05-01T10:00:00.000Z", image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=600", category: "SUV", year: 2021, km: 62000, location: "Delhi" },
          { id: "3", title: "BMW 3 Series 2020", type: "AUCTION", currentBid: 3200000, minIncrement: 25000, bidCount: 31, auctionEnd: "2026-04-08T16:00:00.000Z", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600", category: "Luxury", year: 2020, km: 38000, location: "Bangalore" },
          { id: "4", title: "Maruti Brezza 2023", type: "AUCTION", currentBid: 1050000, minIncrement: 5000, bidCount: 7, auctionEnd: "2026-04-12T11:00:00.000Z", image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600", category: "SUV", year: 2023, km: 18000, location: "Pune" },
        ],
      },
    });
  });

  app.post("/api/user/live/:id/bid", (req: Request, res: Response) => {
    const { bidAmount } = req.body;
    res.json({ success: true, data: { newBid: bidAmount, bidCount: Math.floor(Math.random() * 10) + 20, message: "Bid placed successfully!" } });
  });

  // ──────────────────────────────────────────────
  // BUY NOW
  // ──────────────────────────────────────────────

  app.get("/api/user/buy-now", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        vehicles: [
          { id: "b1", title: "Hyundai Creta 2023", price: 1800000, type: "BUY_NOW", image: "https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=600", category: "SUV", year: 2023, km: 22000, location: "Chennai", fuel: "Petrol", transmission: "Automatic" },
          { id: "b2", title: "Tata Nexon EV Max", price: 2050000, type: "BUY_NOW", image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600", category: "Electric", year: 2023, km: 12000, location: "Hyderabad", fuel: "Electric", transmission: "Automatic" },
          { id: "b3", title: "Mahindra Thar 2022", price: 1650000, type: "BUY_NOW", image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600", category: "SUV", year: 2022, km: 35000, location: "Jaipur", fuel: "Diesel", transmission: "Manual" },
          { id: "b4", title: "Kia Seltos HTX+ 2023", price: 1950000, type: "BUY_NOW", image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600", category: "SUV", year: 2023, km: 8000, location: "Kolkata", fuel: "Petrol", transmission: "CVT" },
        ],
      },
    });
  });

  app.post("/api/user/buy-now/:id/purchase", (_req: Request, res: Response) => {
    res.json({ success: true, data: { dealId: generateToken(), message: "Purchase initiated successfully!" } });
  });

  // ──────────────────────────────────────────────
  // DEALS
  // ──────────────────────────────────────────────

  app.get("/api/user/deals", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        myDeals: [
          { id: "d1", vehicle: "Honda City ZX", vehicleImage: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400", status: "WON", price: 1200000, date: "2026-03-20T10:00:00.000Z", type: "AUCTION" },
          { id: "d2", vehicle: "Toyota Fortuner", vehicleImage: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=400", status: "PENDING_PAYMENT", price: 4100000, date: "2026-03-25T14:00:00.000Z", type: "AUCTION" },
          { id: "d3", vehicle: "Hyundai Creta 2023", vehicleImage: "https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=400", status: "COMPLETED", price: 1800000, date: "2026-02-15T09:00:00.000Z", type: "BUY_NOW" },
          { id: "d4", vehicle: "BMW 3 Series", vehicleImage: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400", status: "LOST", price: 3200000, date: "2026-03-10T11:00:00.000Z", type: "AUCTION" },
        ],
      },
    });
  });

  // ──────────────────────────────────────────────
  // PROFILE
  // ──────────────────────────────────────────────

  app.get("/api/user/profile", (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    const token = auth?.replace("Bearer ", "");
    const userId = token ? sessions[token] : null;
    const user = userId ? users[userId] : null;

    res.json({
      success: true,
      data: {
        fullName: user?.fullName ?? "Demo User",
        email: user?.email ?? "demo@carsbuynsell.in",
        phone: user?.phone ?? "+91 9999999999",
        subscription: { status: "ACTIVE", remainingListings: 2, expiresAt: "2026-05-20T00:00:00.000Z" },
      },
    });
  });

  // ──────────────────────────────────────────────
  // RAZORPAY CHECKOUT PAGE
  // ──────────────────────────────────────────────

  // Serves the Razorpay Standard Checkout HTML page.
  // The mobile app opens this in expo-web-browser.
  // Query params: order_id, amount, currency, key_id, name, email, callback_scheme
  app.get("/razorpay-checkout", (_req: Request, res: Response) => {
    const templatePath = path.resolve(process.cwd(), "server", "templates", "razorpay-checkout.html");
    const html = fs.readFileSync(templatePath, "utf-8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(html);
  });

  // ──────────────────────────────────────────────
  // USER SUBSCRIPTIONS  (paths match backend microservice)
  // ──────────────────────────────────────────────

  /** GET /user/subscriptions/plans — returns all active plans */
  app.get("/user/subscriptions/plans", (_req: Request, res: Response) => {
    res.json({
      success: true,
      statusCode: 200,
      data: [
        {
          sp_id: "plan_vehicle_access",
          sp_name: "Vehicle Access Plan",
          sp_description: "Bid or buy up to 3 vehicles per day",
          sp_price: 10000,
          sp_duration: 365,
          sp_is_active: true,
        },
      ],
      message: "Plans fetched successfully",
    });
  });

  /** GET /user/subscriptions/me — returns the current user's active subscription */
  app.get("/user/subscriptions/me", (req: Request, res: Response) => {
    // Identify user from Bearer token stored in sessions
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? sessions[token] : null;

    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: "Unauthorized" });
    }

    const sub = activeSubs[userId];
    if (!sub) {
      return res.status(404).json({ success: false, statusCode: 404, message: "No active subscription found" });
    }

    // Engagement-based model: check if user has available slots (no daily reset)
    if (sub.sub_remaining_uses <= 0) {
      return res.status(404).json({ success: false, statusCode: 404, message: "All engagement slots are in use. Wait for an auction to close." });
    }

    // Include user's active engagements in response
    const userEngagements = engagements.filter(e => e.eng_user_id === userId && e.eng_status === 'ACTIVE');

    return res.json({ 
      success: true, 
      statusCode: 200, 
      data: { ...sub, engagements: userEngagements }, 
      message: "Subscription fetched" 
    });
  });

  /** POST /user/subscriptions/create-order — creates a Razorpay order */
  app.post("/user/subscriptions/create-order", async (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? sessions[token] : null;

    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: "Unauthorized" });
    }

    // Block if user already has active subscription with available engagement slots
    const existing = activeSubs[userId];
    if (existing && existing.sub_remaining_uses > 0) {
      return res.status(409).json({ 
        success: false, 
        statusCode: 409, 
        message: "You already have an active subscription with available engagement slots" 
      });
    }

    try {
      const razorpay = getRazorpay(); // lazy init — keys guaranteed by this point
      const amountInPaise = 10000 * 100; // ₹10,000 in paise
      const plan_id = req.body.plan_id || "plan_vehicle_access";

      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        notes: { user_id: userId, plan_id },
      });

      // Store pending subscription
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      pendingSubs[razorpayOrder.id] = { user_id: userId, plan_id, expires_at: expiresAt };

      return res.status(201).json({
        success: true,
        statusCode: 201,
        data: {
          razorpay_order_id: razorpayOrder.id,
          amount: amountInPaise,
          currency: "INR",
          key_id: process.env.RAZORPAY_KEY_ID || "",
        },
        message: "Order created successfully",
      });
    } catch (err: any) {
      console.error("[RZP] Create order error:", err);
      return res.status(500).json({
        success: false, statusCode: 500,
        message: err?.error?.description || err?.message || "Failed to create Razorpay order",
      });
    }
  });

  /** POST /user/subscriptions/verify-payment — verifies signature and activates subscription */
  app.post("/user/subscriptions/verify-payment", (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? sessions[token] : null;

    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: "Unauthorized" });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, statusCode: 400, message: "Missing payment fields" });
    }

    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

    // Verify HMAC-SHA256 signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, statusCode: 400, message: "Invalid payment signature" });
    }

    // Look up pending subscription
    const pending = pendingSubs[razorpay_order_id];
    if (!pending) {
      return res.status(404).json({ success: false, statusCode: 404, message: "Pending subscription not found" });
    }

    // Activate subscription (engagement-based model — no daily reset)
    const now = new Date().toISOString();
    const subscription = {
      sub_id: generateToken(),
      sub_status: "ACTIVE",
      sub_remaining_uses: 3, // 3 active vehicle engagements at a time
      sub_expires_at: pending.expires_at,
      sub_starts_at: now,
      sub_razorpay_order_id: razorpay_order_id,
      sub_razorpay_payment_id: razorpay_payment_id,
      plan: {
        sp_id: pending.plan_id,
        sp_name: "Vehicle Access Plan",
        sp_price: 10000,
        sp_duration: 365,
        sp_description: "Bid or buy up to 3 vehicles at a time",
      },
    };

    activeSubs[userId] = subscription;
    delete pendingSubs[razorpay_order_id];

    return res.json({ success: true, statusCode: 200, data: subscription, message: "Payment verified & subscription activated" });
  });

  // ──────────────────────────────────────────────
  // ENGAGEMENT MANAGEMENT (Mock for development)
  // ──────────────────────────────────────────────

  /** POST /admin/listings/:id/close-auction — closes auction and restores votes */
  app.post("/admin/listings/:id/close-auction", (req: Request, res: Response) => {
    const listingId = req.params.id;
    const { status } = req.body; // "SOLD" or "EXPIRED"

    // Find all active engagements for this listing
    const activeEngs = engagements.filter(e => e.eng_listing_id === listingId && e.eng_status === 'ACTIVE');
    let votesRestored = 0;

    for (const eng of activeEngs) {
      eng.eng_status = 'CLOSED';
      eng.eng_closed_at = new Date().toISOString();

      // Restore vote to subscription (only for AUCTION type, not BUY_NOW)
      if (eng.eng_type === 'AUCTION') {
        const userSub = Object.values(activeSubs).find(s => 
          engagements.some(e => e.eng_user_id === eng.eng_user_id)
        );
        if (userSub) {
          userSub.sub_remaining_uses = Math.min(3, userSub.sub_remaining_uses + 1);
          votesRestored++;
        }
      }
    }

    return res.json({
      success: true,
      statusCode: 200,
      data: { listing_id: listingId, status, engagements_closed: activeEngs.length },
      message: `Auction closed. ${votesRestored} vote(s) restored.`
    });
  });

  /** POST /user/listings/:id/bid — place bid (creates engagement on first bid) */
  app.post("/user/listings/:id/bid", (req: Request, res: Response) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const userId = token ? sessions[token] : null;
    const listingId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, statusCode: 401, message: "Unauthorized" });
    }

    const sub = activeSubs[userId];
    if (!sub || sub.sub_remaining_uses <= 0) {
      return res.status(403).json({ 
        success: false, 
        statusCode: 403, 
        message: "All 3 engagement slots are in use. Wait for an auction to close or purchase a new subscription." 
      });
    }

    // Check if user already has engagement for this listing
    const existingEng = engagements.find(e => e.eng_user_id === userId && e.eng_listing_id === listingId);

    if (!existingEng) {
      // First bid on this listing — create engagement and decrement vote
      engagements.push({
        eng_id: generateToken(),
        eng_user_id: userId,
        eng_listing_id: listingId,
        eng_type: 'AUCTION',
        eng_status: 'ACTIVE',
        eng_created_at: new Date().toISOString(),
      });
      sub.sub_remaining_uses--;
    }

    return res.json({
      success: true,
      statusCode: 200,
      data: { bid_id: generateToken(), listing_id: listingId, amount: req.body.amount },
      message: existingEng ? "Bid placed (same engagement)" : "Bid placed (1 vote used)"
    });
  });

  // ──────────────────────────────────────────────
  // SELL VEHICLE
  // ──────────────────────────────────────────────

  app.post("/user/sell-request", (req: Request, res: Response) => {
    const { title, basePrice } = req.body;
    if (!title || !basePrice) return res.status(400).json({ success: false, message: "Title and price are required" });
    res.json({
      success: true,
      data: { requestId: generateToken(), title, status: "PENDING_ADMIN_REVIEW", message: "Your vehicle has been submitted. Admin will review within 24 hours." },
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
