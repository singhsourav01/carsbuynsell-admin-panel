import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";

const users: Record<string, {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  status: "PENDING_APPROVAL" | "ACCEPTED" | "REJECTED" | "BLOCKED";
  otpVerified: boolean;
}> = {};

const sessions: Record<string, string> = {};

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // --- AUTH ROUTES ---

  app.post("/api/auth/register", (req: Request, res: Response) => {
    const { fullName, email, phone, password } = req.body;
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }
    const existing = Object.values(users).find(u => u.email === email);
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    const id = Date.now().toString();
    users[id] = { id, fullName, email, phone, password, status: "PENDING_APPROVAL", otpVerified: false };
    res.json({ success: true, data: { userId: id, phone, email } });
  });

  app.post("/api/auth/verify-otp", (req: Request, res: Response) => {
    const { userId, phoneOtp, emailOtp } = req.body;
    if (!users[userId]) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (phoneOtp !== "1234" || emailOtp !== "1234") {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    users[userId].otpVerified = true;
    res.json({ success: true, data: { status: "PENDING_APPROVAL" } });
  });

  app.get("/api/auth/status", (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    const token = auth?.replace("Bearer ", "");
    const userId = token ? sessions[token] : null;
    if (!userId || !users[userId]) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Auto-accept after OTP verified for demo
    if (users[userId].otpVerified && users[userId].status === "PENDING_APPROVAL") {
      users[userId].status = "ACCEPTED";
    }
    res.json({ success: true, data: { status: users[userId].status } });
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = Object.values(users).find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (user.status === "REJECTED") {
      return res.status(403).json({ success: false, message: "Account rejected by admin" });
    }
    if (user.status === "BLOCKED") {
      return res.status(403).json({ success: false, message: "Account has been blocked" });
    }
    if (user.status === "PENDING_APPROVAL") {
      return res.status(403).json({ success: false, message: "Account pending approval" });
    }
    const token = generateToken();
    sessions[token] = user.id;
    res.json({ success: true, data: { token, user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone } } });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    const token = auth?.replace("Bearer ", "");
    if (token) delete sessions[token];
    res.json({ success: true });
  });

  // --- HOME ---

  app.get("/api/user/home", (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        featured: [
          {
            id: "f1",
            title: "2023 BMW M3 Competition",
            type: "AUCTION",
            currentBid: 8500000,
            image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600",
            auctionEnd: "2026-04-15T18:00:00.000Z",
            bidCount: 34,
          },
          {
            id: "f2",
            title: "2022 Mercedes GLE 63S",
            type: "AUCTION",
            currentBid: 12500000,
            image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600",
            auctionEnd: "2026-04-20T12:00:00.000Z",
            bidCount: 51,
          },
          {
            id: "f3",
            title: "2021 Porsche Cayenne GTS",
            type: "BUY_NOW",
            price: 9800000,
            image: "https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=600",
          },
        ],
        categories: [
          { id: "all", label: "All", icon: "grid" },
          { id: "sedan", label: "Sedan", icon: "car" },
          { id: "suv", label: "SUV", icon: "car-sport" },
          { id: "luxury", label: "Luxury", icon: "diamond" },
          { id: "sports", label: "Sports", icon: "flash" },
          { id: "electric", label: "Electric", icon: "flash" },
        ],
        recent: {
          data: [
            {
              id: "r1",
              title: "Honda City ZX 2022",
              type: "AUCTION",
              currentBid: 1265000,
              image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400",
              auctionEnd: "2026-04-10T12:00:00.000Z",
              bidCount: 12,
            },
            {
              id: "r2",
              title: "Toyota Fortuner 2021",
              type: "AUCTION",
              currentBid: 4150000,
              image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=400",
              auctionEnd: "2026-05-01T10:00:00.000Z",
              bidCount: 22,
            },
            {
              id: "r3",
              title: "Hyundai Creta 2023",
              type: "BUY_NOW",
              price: 1800000,
              image: "https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=400",
            },
            {
              id: "r4",
              title: "Mahindra XUV700 AX7",
              type: "AUCTION",
              currentBid: 2350000,
              image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400",
              auctionEnd: "2026-04-25T14:00:00.000Z",
              bidCount: 8,
            },
            {
              id: "r5",
              title: "Tata Nexon EV Max",
              type: "BUY_NOW",
              price: 2050000,
              image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400",
            },
            {
              id: "r6",
              title: "Kia Seltos HTX+ 2023",
              type: "AUCTION",
              currentBid: 1750000,
              image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400",
              auctionEnd: "2026-04-18T09:00:00.000Z",
              bidCount: 16,
            },
          ],
        },
      },
    });
  });

  // --- LIVE AUCTIONS ---

  app.get("/api/user/live", (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        auctions: [
          {
            id: "1",
            title: "2022 Honda City ZX",
            type: "AUCTION",
            currentBid: 1265000,
            minIncrement: 5000,
            bidCount: 12,
            auctionEnd: "2026-04-10T12:00:00.000Z",
            image: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600",
            category: "Sedan",
            year: 2022,
            km: 45000,
            location: "Mumbai",
          },
          {
            id: "2",
            title: "Toyota Fortuner 2021",
            type: "AUCTION",
            currentBid: 4150000,
            minIncrement: 10000,
            bidCount: 22,
            auctionEnd: "2026-05-01T10:00:00.000Z",
            image: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=600",
            category: "SUV",
            year: 2021,
            km: 62000,
            location: "Delhi",
          },
          {
            id: "3",
            title: "BMW 3 Series 2020",
            type: "AUCTION",
            currentBid: 3200000,
            minIncrement: 25000,
            bidCount: 31,
            auctionEnd: "2026-04-08T16:00:00.000Z",
            image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600",
            category: "Luxury",
            year: 2020,
            km: 38000,
            location: "Bangalore",
          },
          {
            id: "4",
            title: "Maruti Suzuki Brezza 2023",
            type: "AUCTION",
            currentBid: 1050000,
            minIncrement: 5000,
            bidCount: 7,
            auctionEnd: "2026-04-12T11:00:00.000Z",
            image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600",
            category: "SUV",
            year: 2023,
            km: 18000,
            location: "Pune",
          },
        ],
      },
    });
  });

  app.post("/api/user/live/:id/bid", (req: Request, res: Response) => {
    const { bidAmount } = req.body;
    res.json({
      success: true,
      data: {
        newBid: bidAmount,
        bidCount: Math.floor(Math.random() * 10) + 20,
        message: "Bid placed successfully!",
      },
    });
  });

  // --- BUY NOW ---

  app.get("/api/user/buy-now", (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        vehicles: [
          {
            id: "b1",
            title: "Hyundai Creta 2023",
            price: 1800000,
            type: "BUY_NOW",
            image: "https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=600",
            category: "SUV",
            year: 2023,
            km: 22000,
            location: "Chennai",
            fuel: "Petrol",
            transmission: "Automatic",
          },
          {
            id: "b2",
            title: "Tata Nexon EV Max",
            price: 2050000,
            type: "BUY_NOW",
            image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600",
            category: "Electric",
            year: 2023,
            km: 12000,
            location: "Hyderabad",
            fuel: "Electric",
            transmission: "Automatic",
          },
          {
            id: "b3",
            title: "Mahindra Thar 2022",
            price: 1650000,
            type: "BUY_NOW",
            image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600",
            category: "SUV",
            year: 2022,
            km: 35000,
            location: "Jaipur",
            fuel: "Diesel",
            transmission: "Manual",
          },
          {
            id: "b4",
            title: "Kia Seltos HTX+ 2023",
            price: 1950000,
            type: "BUY_NOW",
            image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600",
            category: "SUV",
            year: 2023,
            km: 8000,
            location: "Kolkata",
            fuel: "Petrol",
            transmission: "CVT",
          },
        ],
      },
    });
  });

  app.post("/api/user/buy-now/:id/purchase", (req: Request, res: Response) => {
    res.json({
      success: true,
      data: { dealId: generateToken(), message: "Purchase initiated successfully!" },
    });
  });

  // --- DEALS ---

  app.get("/api/user/deals", (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        myDeals: [
          {
            id: "d1",
            vehicle: "Honda City ZX",
            vehicleImage: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400",
            status: "WON",
            price: 1200000,
            date: "2026-03-20T10:00:00.000Z",
            type: "AUCTION",
          },
          {
            id: "d2",
            vehicle: "Toyota Fortuner",
            vehicleImage: "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=400",
            status: "PENDING_PAYMENT",
            price: 4100000,
            date: "2026-03-25T14:00:00.000Z",
            type: "AUCTION",
          },
          {
            id: "d3",
            vehicle: "Hyundai Creta 2023",
            vehicleImage: "https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=400",
            status: "COMPLETED",
            price: 1800000,
            date: "2026-02-15T09:00:00.000Z",
            type: "BUY_NOW",
          },
          {
            id: "d4",
            vehicle: "BMW 3 Series",
            vehicleImage: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400",
            status: "LOST",
            price: 3200000,
            date: "2026-03-10T11:00:00.000Z",
            type: "AUCTION",
          },
        ],
      },
    });
  });

  // --- PROFILE ---

  app.get("/api/user/profile", (req: Request, res: Response) => {
    const auth = req.headers.authorization;
    const token = auth?.replace("Bearer ", "");
    const userId = token ? sessions[token] : null;

    if (userId && users[userId]) {
      const user = users[userId];
      return res.json({
        success: true,
        data: {
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          subscription: {
            status: "ACTIVE",
            remainingListings: 2,
            expiresAt: "2026-05-20T00:00:00.000Z",
          },
        },
      });
    }

    res.json({
      success: true,
      data: {
        fullName: "Arjun Mehta",
        email: "arjun@gmail.com",
        phone: "+91 9359588022",
        subscription: {
          status: "ACTIVE",
          remainingListings: 2,
          expiresAt: "2026-05-20T00:00:00.000Z",
        },
      },
    });
  });

  // --- SUBSCRIPTIONS ---

  app.get("/api/subscriptions/me", (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: "ACTIVE",
        plan: "STANDARD",
        remainingListings: 2,
        totalListings: 4,
        expiresAt: "2026-05-20T00:00:00.000Z",
        price: 999,
      },
    });
  });

  app.post("/api/subscriptions/purchase", (req: Request, res: Response) => {
    const { plan } = req.body;
    res.json({
      success: true,
      data: {
        subscriptionId: generateToken(),
        plan: plan || "STANDARD",
        remainingListings: 4,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        message: "Subscription activated successfully!",
      },
    });
  });

  // --- SELL VEHICLE ---

  app.post("/api/user/sell-request", (req: Request, res: Response) => {
    const { title, description, category, listingType, basePrice } = req.body;
    if (!title || !basePrice) {
      return res.status(400).json({ success: false, message: "Title and price are required" });
    }
    res.json({
      success: true,
      data: {
        requestId: generateToken(),
        title,
        status: "PENDING_ADMIN_REVIEW",
        message: "Your vehicle has been submitted for review. Admin will list it within 24 hours.",
      },
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
