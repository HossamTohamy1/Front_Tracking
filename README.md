# 🚢 Front Tracking — Shipment Tracking Website

> The website customers and staff use to request imports, see costs, pay, and follow their containers on the way.

---

## 🧐 What is this, in plain words?

This is the **part of the system you actually see and click** — the screens of the import & shipment tracking platform.
(The "brain" behind it is the **[Tracking](https://github.com/HossamTohamy1/Tracking)** project.)

With it you can:

- 🔐 **Sign up / log in**.
- 📝 **Request an import** of a product.
- 💰 See the **cost calculation** (shipping, customs, fees) before you commit.
- 💳 **Pay online** by card (Stripe).
- 📦 See your **containers** and **track** each one stage by stage.
- 📊 Use a **dashboard** with an overview of everything.

It also works as an installable app on your phone (PWA).

## 👥 Who uses it?

| Who | What they can do |
|---|---|
| **Customer** | Request imports, view costs, pay, track containers |
| **Staff / Admin** | Manage products, containers and requests from the dashboard |

---

## 🛠️ For developers

**Tech stack:** React 19 · TypeScript · Vite · React Router · Axios · Stripe (`@stripe/react-stripe-js`) · PWA (`vite-plugin-pwa`) · React Icons

**Main folders in `src/`:** `auth`, `dashboard`, `importRequests`, `costCalculations`, `payments`, `containers`, `tracking`, `products`, `components`, `pages`

**Run locally**

1. Install [Node.js](https://nodejs.org/) (LTS).
2. Copy `.env.example` to `.env` and fill in:
   - `VITE_API_BASE_URL` — URL of the Tracking API
   - `VITE_STRIPE_PUBLISHABLE_KEY` — your Stripe publishable key
3. Run:
   ```bash
   npm install
   npm run dev
   ```

---

## 🇪🇬 بالعربي

ده الموقع اللي العميل بيشوفه ويدوس فيه في نظام تتبّع الشحنات: يسجّل دخول، ويقدّم طلب استيراد، ويشوف التكلفة، ويدفع بالكارت، ويتابع الكونتينر بتاعه خطوة بخطوة. وتقدر كمان تنزّله على الموبايل كأنه تطبيق.
