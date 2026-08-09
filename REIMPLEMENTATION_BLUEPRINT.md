# 📐 REIMPLEMENTATION BLUEPRINT: D3COMPOSURE E-COMMERCE & LAB PLATFORM

> **Instruction for the AI Agent:** Use this master specification blueprint to implement or recreate the **D3COMPOSURE** e-commerce and artifact lab platform from scratch in a clean, highly modular, and maintainable environment.

---

## 1. Executive Summary & Brand Identity

**D3COMPOSURE** is an avant-garde, brutalist luxury apparel and experimental artifact platform ("Protocol Architecture", "Artifacts", "Sublimation", "Lab"). 

### Visual & Architectural Principles
- **Color Palette:** Deep jet-black canvas (`#080808` / `#0f0f0f`), stark white typography, subtle 1px structural borders (`border-white/10` or `border-zinc-800`), with high-visibility signal LEDs (`bg-emerald-500`, `#3B82F6`).
- **Typography & HUD Aesthetic:** Monospace tracking (`tracking-widest`, `font-mono`, uppercase) for technical labels, status indicators, and protocol headers. Clean sans-serif for body readability.
- **Media Support:** Rich multi-format rendering across images (JPG/PNG/WEBP), video loops (MP4/WEBM with autoplay/muted/inline), and interactive 3D GLTF models via `@google/model-viewer`.
- **Layout:** Dense, crisp, high-contrast grid layouts without unnecessary soft drop shadows or consumer SaaS gradients.

---

## 2. Recommended Clean Directory Structure

Replace single monolithic files with modular, single-responsibility modules:

```text
/
├── server.ts                       # Express server + Vite middleware + API endpoints
├── EDIT_PRODUCT_DATA_HERE.ts       # Seed/Fallback product dataset
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Top-level Router & Provider wrapper
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces (Product, Order, Settings, etc.)
│   ├── config/
│   │   ├── constants.ts            # Default theme, labels, and constants
│   │   └── seedData.ts             # Default fallback items & announcements
│   ├── services/
│   │   ├── firebase.ts             # Firebase client SDK initialization & helpers
│   │   ├── stripe.ts               # Stripe API integration proxy
│   │   └── mailer.ts               # Nodemailer & order notification helpers
│   ├── context/
│   │   ├── StoreContext.tsx        # Central state for products, cart, settings, user
│   │   └── AdminContext.tsx        # Admin authentication and panel state
│   ├── hooks/
│   │   ├── useProducts.ts          # Real-time Firestore product listener + local seed fallback
│   │   ├── useCart.ts              # Shopping bag management, size selection, promo calculation
│   │   └── useOrders.ts            # Public order tracking & submission
│   ├── utils/
│   │   ├── helpers.ts              # Math calculations, drive URL converter, formatters
│   │   └── logger.ts               # Centralized log entry writer
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx          # Store header with status indicators & bag count
│   │   │   ├── AnnouncementBar.tsx # Scrolling marquee bar
│   │   │   ├── MediaRenderer.tsx   # Image / Video / 3D GLTF Model viewer wrapper
│   │   │   ├── Modal.tsx           # Reusable backdrop modal container
│   │   │   └── NotificationSystem.tsx # Toast alerts & notifications
│   │   ├── storefront/
│   │   │   ├── HeroBillboard.tsx   # Featured carousel / video background header
│   │   │   ├── ProductGrid.tsx     # Filterable, searchable product gallery
│   │   │   ├── ProductCard.tsx     # Single product presentation card
│   │   │   ├── ProductDetailModal.tsx # Full product drawer/modal with size selector & 3D view
│   │   │   ├── ArtifactSubmissionModal.tsx # Community design submission form
│   │   │   └── OrderTracker.tsx    # Order lookup & dispatch status tool
│   │   ├── cart/
│   │   │   ├── CartDrawer.tsx      # Slide-out bag drawer with free shipping progress
│   │   │   └── CheckoutModal.tsx   # Multi-gateway payment flow (Stripe, PayPal, Crypto/Wire QR)
│   │   └── admin/
│   │       ├── AdminDashboard.tsx  # Main tabbed administrative suite
│   │       ├── ProductsTab.tsx     # Product CRUD & inventory manager
│   │       ├── OrdersTab.tsx       # Order management, dispatch & tracking assignment
│   │       ├── DiscountsTab.tsx    # Promo code generator & usage rules
│   │       ├── HeroTab.tsx         # Hero billboard slideshow manager
│   │       ├── AnnouncementsTab.tsx # Announcement bar content editor
│   │       ├── DriveLinksTab.tsx   # Google Drive URL to streaming CDN converter tool
│   │       ├── WaitlistTab.tsx     # Transmission / newsletter subscriber export
│   │       ├── DiagnosticsTab.tsx  # System health, log viewer & database sync checks
│   │       └── SettingsTab.tsx     # Site titles, maintenance toggle & section toggles
```

---

## 3. Data Schema & Types (`src/types/index.ts`)

Define precise interfaces for all data entities:

```typescript
export interface ProductAsset {
  uid?: string;
  url: string;
  type: 'image' | 'video' | 'model3d';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: ProductAsset[];
  category: string;
  stock: number;
  is_visible: boolean;
  is_featured?: boolean;
  sizes?: string[];
  stripe_payment_link?: string;
  stripe_product_id?: string;
  stripe_buy_button_id?: string;
  button_logic?: 'add_to_bag' | 'buy_now';
  tags?: string[];
  specs?: Record<string, string>;
  is_user_submitted?: boolean;
  status?: 'approved' | 'pending' | 'rejected';
  created_at?: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  payment_method: 'STRIPE' | 'PAYPAL' | 'WIRE_CRYPTO' | 'EXTERNAL_LINK';
  total_amount: number;
  discount_code?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: CartItem[];
  tracking_number?: string;
  created_at: any;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  min_purchase?: number;
  usage_count: number;
  usage_limit?: number;
  active: boolean;
  created_at: any;
}

export interface AppSettings {
  site_title?: string;
  site_subtitle?: string;
  hero_type?: 'IMAGE' | 'VIDEO';
  hero_url?: string;
  hero_slides?: ProductAsset[];
  maintenance_mode?: boolean;
  contact_email?: string;
  social_links?: Record<string, string>;
  sections?: Record<string, boolean>;
  [key: string]: any;
}
```

---

## 4. Core Features & Functional Requirements

### A. Storefront & Media Rendering
1. **Navbar & Status:** Display branding, live system clock/status indicator, protocol navigation tabs, and Shopping Bag drawer toggle with badge counter.
2. **Hero Billboard:** Carousel or video background featuring highlight products with animated slide transitions and call-to-action buttons.
3. **Product Catalog:** Grid with category filtering, search bar, stock counters (`STOCK: 05 AVAILABLE`), and fast quick-view / add-to-bag handlers.
4. **Interactive Media Renderer:** Supports JPG/PNG images, auto-playing video loops, and 3D GLTF models via `<model-viewer>` with camera controls and AR support.
5. **Community Lab Submissions:** Form allowing users to upload photo artifacts and propose custom designs, stored in Firestore for admin review.

### B. Shopping Bag & Multi-Gateway Checkout
1. **Cart Drawer:** Animated slide-out drawer displaying item quantities, size selection, free shipping progress bar, subtotal, and discount code application.
2. **Checkout Options:**
   - **Stripe Session Proxy:** Direct creation of Stripe checkout session via `/api/stripe/checkout`.
   - **PayPal Integration:** Integrated PayPal button component (`@paypal/react-paypal-js`).
   - **Crypto / Direct Wire:** Generates custom QR code for wallet/bank transfer with manual transaction reference logging.
   - **External Payment Links:** Redirects to custom user-configured link if set per product.
3. **Order Confirmation & Email Notifications:** On order creation, save to Firestore `orders` collection and trigger Nodemailer to send formatted customer receipt and admin alert emails.

### C. Order Tracking Tool
1. **Public Tracking View:** Simple search screen where customers enter their Order ID or Email address.
2. **Order Timeline:** Shows order status (`Pending` -> `Processing` -> `Shipped` -> `Delivered`), tracking number, carrier link, and item breakdown.

### D. Administrative Control Suite (`/admin`)
1. **Authentication:** Password protected or Firebase Auth admin guard.
2. **Product Manager:** Complete CRUD for products, size options, stock levels, image/video URLs, 3D model links, and Stripe IDs.
3. **Order Dispatch Hub:** Search, filter, and edit order statuses, assign tracking numbers, and view customer details.
4. **Discount Generator:** Create promo codes (Percentage off or Fixed amount) with usage limits and minimum order thresholds.
5. **Hero & Announcement Bar Editor:** Customize marquee texts, background colors, and hero slideshow media URLs.
6. **Google Drive Converter:** Utility tool that extracts file IDs from `drive.google.com/file/d/...` links and converts them into direct streaming CDN URLs (`https://lh3.googleusercontent.com/d/...`).
7. **System Diagnostics & Audit Logs:** Live log stream of database operations, order submissions, and API errors.

---

## 5. Backend Server Architecture (`server.ts`)

A clean Node.js Express backend serving both API routes and hosting Vite dev middleware:

### Required API Routes
- `GET /api/health` — System status check.
- `POST /api/orders` — Accepts order payload, writes to Firestore `orders`, updates product inventory, and sends confirmation emails via Nodemailer.
- `POST /api/stripe/checkout` — Generates a Stripe Checkout Session for items in the bag.
- `POST /api/stripe/sync` — Synchronizes products from Stripe API to Firestore.
- `POST /api/drive/convert` — Converts batch Google Drive URLs to direct CDN image/video streaming links.
- `POST /api/gemini/generate` — Calls `@google/genai` to generate technical product descriptions or tags.
- `GET /api/logs` & `POST /api/logs` — Retrieves and appends system event audit logs.

---

## 6. Execution Protocol for the Next Agent

When starting the implementation:
1. **Set Up Types & State Context:** Create `/src/types/index.ts` and set up clean React Context wrappers or hooks (`useProducts`, `useCart`, `useOrders`) rather than putting all state in one file.
2. **Implement Backend (`server.ts`):** Build Express routes with fallback error handling, Nodemailer transporter setup, and Stripe integration.
3. **Build Core Components:** Implement `MediaRenderer`, `Navbar`, `HeroBillboard`, `ProductGrid`, and `ProductDetailModal`.
4. **Integrate Cart & Checkout:** Connect `CartDrawer` with `CheckoutModal` and backend order submission.
5. **Build Admin Dashboard:** Build tabbed interface for Products, Orders, Discounts, Announcements, Drive Tool, and Settings.
6. **Verify Build:** Run `compile_applet` / `npm run build` to ensure zero compilation errors.
