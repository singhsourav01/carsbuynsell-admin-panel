import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: "PENDING_APPROVAL" | "ACCEPTED" | "REJECTED" | "BLOCKED";
}

const users: Record<string, User> = {
  demo: {
    id: "demo",
    fullName: "Demo User",
    email: "demo@autobid.in",
    phone: "+91 9999999999",
    status: "ACCEPTED",
  },
};

const sessions: Record<string, string> = {};
const pendingOtps: Record<string, { phone: string; userId: string }> = {};

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function registerRoutes(app: Express): Promise<Server> {

  // --- PHONE-BASED AUTH ---

  app.post("/api/auth/request-otp", (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone number required" });

    // find existing or create new pending user
    let user = Object.values(users).find((u) => u.phone === phone);
    if (!user) {
      const id = Date.now().toString();
      user = { id, fullName: "New User", email: `${id}@autobid.in`, phone, status: "PENDING_APPROVAL" };
      users[id] = user;
    }

    const otpKey = generateToken().substring(0, 8);
    pendingOtps[otpKey] = { phone, userId: user.id };

    res.json({ success: true, data: { otpKey, phone, userId: user.id } });
  });

  app.post("/api/auth/verify-phone-otp", (req: Request, res: Response) => {
    const { userId, otp } = req.body;
    const user = users[userId];
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // demo OTP: any 6-digit number works, or 123456 / 1234
    const isValid = otp && (otp === "123456" || otp === "1234" || /^\d{4,6}$/.test(otp));
    if (!isValid) return res.status(400).json({ success: false, message: "Invalid OTP. Use 123456 for demo." });

    if (user.status === "REJECTED") return res.status(403).json({ success: false, message: "Account rejected" });
    if (user.status === "BLOCKED") return res.status(403).json({ success: false, message: "Account blocked" });

    // auto-accept new users for demo
    if (user.status === "PENDING_APPROVAL") {
      user.status = "ACCEPTED";
    }

    const token = generateToken();
    sessions[token] = user.id;
    res.json({ success: true, data: { token, user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone } } });
  });

  // Demo login - instant access
  app.post("/api/auth/demo-login", (_req: Request, res: Response) => {
    const token = generateToken();
    sessions[token] = "demo";
    res.json({
      success: true,
      data: {
        token,
        user: { id: "demo", fullName: "Demo User", email: "demo@autobid.in", phone: "+91 9999999999" },
      },
    });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    const token = auth?.replace("Bearer ", "");
    if (token) delete sessions[token];
    res.json({ success: true });
  });

  // --- HOME ---

  app.get("/api/user/home", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        featured: [
          { id: "f1", title: "2021 2021 Toyota Fortuner L...", type: "AUCTION", currentBid: 3800000, image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=600", auctionEnd: "2026-04-15T18:00:00.000Z", bidCount: 34 },
          { id: "f2", title: "2023 2023 Hyundai Creta SX", type: "BUY_NOW", price: 1580000, image: "https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=600" },
          { id: "f3", title: "2022 BMW 3 Series M Sport", type: "AUCTION", currentBid: 5200000, image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600", auctionEnd: "2026-04-20T12:00:00.000Z", bidCount: 51 },
          { id: "f4", title: "2023 Tata Nexon EV Max", type: "BUY_NOW", price: 2050000, image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600" },
        ],
        categories: [
          { id: "all", label: "All" },
          { id: "sedan", label: "Sedan" },
          { id: "suv", label: "SUV" },
          { id: "luxury", label: "Luxury" },
          { id: "sports", label: "Sports" },
          { id: "electric", label: "Electric" },
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

  // --- LIVE AUCTIONS ---

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

  // --- BUY NOW ---

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

  // --- DEALS ---

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

  // --- PROFILE ---

  app.get("/api/user/profile", (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    const token = auth?.replace("Bearer ", "");
    const userId = token ? sessions[token] : null;
    const user = userId ? users[userId] : null;

    res.json({
      success: true,
      data: {
        fullName: user?.fullName ?? "Demo User",
        email: user?.email ?? "demo@autobid.in",
        phone: user?.phone ?? "+91 9999999999",
        subscription: { status: "ACTIVE", remainingListings: 2, expiresAt: "2026-05-20T00:00:00.000Z" },
      },
    });
  });

  // --- SUBSCRIPTIONS ---

  app.get("/api/subscriptions/me", (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: { status: "ACTIVE", plan: "STANDARD", remainingListings: 2, totalListings: 4, expiresAt: "2026-05-20T00:00:00.000Z", price: 999 },
    });
  });

  app.post("/api/subscriptions/purchase", (req: Request, res: Response) => {
    const { plan } = req.body;
    res.json({
      success: true,
      data: { subscriptionId: generateToken(), plan: plan || "STANDARD", remainingListings: 4, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), message: "Subscription activated!" },
    });
  });

  // --- SELL VEHICLE ---

  app.post("/api/user/sell-request", (req: Request, res: Response) => {
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
