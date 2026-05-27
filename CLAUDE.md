# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

---

## Project Overview

**MUNDOSUBS** is a Peruvian digital subscription marketplace where users can browse and purchase services such as streaming, games, licenses, and productivity tools — all priced in soles (PEN) without needing an international credit card.

Payment is handled manually: users upload a bank transfer voucher (comprobante de pago), an admin reviews and approves it, and the system activates access automatically.

Users accumulate purchase history and can receive loyalty discounts assigned by the admin. Support is offered via WhatsApp deep links (no API required) — the conversation happens directly in WhatsApp outside the web.

**Stack:** Next.js 14 · Supabase · Vercel · Resend · TypeScript · Tailwind CSS · shadcn/ui

---

## Running the Project

```bash
npm install
npm run dev          # http://localhost:3000

npm run build        # production build
npm run lint         # ESLint
```

Environment variables required (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_WHATSAPP_NUMBER=   # e.g. 51987654321 (no + sign, no spaces)
```

---

## Architecture

### File / Folder Map

```
/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (fonts, providers, theme)
│   ├── page.tsx                      # Storefront: catalog, filters, search
│   ├── auth/
│   │   ├── login/page.tsx            # Login page
│   │   └── register/page.tsx         # Register page
│   ├── checkout/
│   │   └── [orderId]/page.tsx        # Voucher upload form
│   ├── dashboard/
│   │   ├── page.tsx                  # Active subscriptions + discount badge
│   │   └── history/page.tsx          # Full purchase history
│   └── admin/
│       ├── page.tsx                  # Admin home: stats + quick actions
│       ├── vouchers/
│       │   ├── page.tsx              # Pending voucher queue
│       │   └── [orderId]/page.tsx    # Voucher review detail
│       ├── products/
│       │   ├── page.tsx              # Product list
│       │   └── [productId]/page.tsx  # Create / edit product
│       ├── users/
│       │   ├── page.tsx              # User list with purchase stats
│       │   └── [userId]/page.tsx     # User profile + assign discount
│       ├── orders/page.tsx           # All orders with filters
│       ├── discounts/page.tsx        # Discount rules management
│       └── settings/page.tsx         # Site settings (WhatsApp number, etc.)
│
├── components/
│   ├── ui/                           # shadcn/ui primitives (Button, Card, Badge…)
│   ├── ProductCard.tsx               # Product display card (shows discount if eligible)
│   ├── ProductModal.tsx              # Product detail modal
│   ├── CartDrawer.tsx                # Slide-in cart (applies active discounts)
│   ├── VoucherUpload.tsx             # Comprobante upload form
│   ├── VoucherReview.tsx             # Admin approve/reject UI
│   ├── SubscriptionStatus.tsx        # Active/expired access badge
│   ├── PurchaseHistory.tsx           # User order history table
│   ├── DiscountBadge.tsx             # Shows discount % and reason to user
│   ├── WhatsAppButton.tsx            # Floating support button
│   └── ThemeToggle.tsx               # Dark/light switch
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server-side Supabase client (cookies)
│   │   └── middleware.ts             # Auth session refresh
│   ├── discounts.ts                  # Loyalty discount resolution logic
│   ├── whatsapp.ts                   # WhatsApp deep link builder
│   ├── email.ts                      # Resend email helpers
│   ├── storage.ts                    # Supabase Storage signed URL helpers
│   └── utils.ts                      # cn(), formatPEN(), etc.
│
├── app/api/
│   ├── orders/route.ts               # POST: create order
│   ├── vouchers/route.ts             # POST: upload voucher metadata
│   └── admin/
│       ├── review/route.ts           # POST: approve or reject voucher
│       ├── products/route.ts         # POST/PUT/DELETE: manage products
│       ├── discounts/route.ts        # POST/PUT/DELETE: manage discount rules
│       └── users/
│           └── [userId]/
│               └── discount/route.ts # POST: assign manual discount to user
│
├── supabase/
│   ├── migrations/                   # SQL migration files
│   └── functions/
│       └── notify-voucher/           # Edge Function: email admin on new voucher
│
├── styles/
│   └── globals.css                   # Tailwind base + CSS custom properties
│
├── middleware.ts                     # Protects /dashboard and /admin routes
└── CLAUDE.md
```

---

## Data Model (Supabase / PostgreSQL)

### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | e.g. "Netflix Premium" |
| `category` | text | `streaming` \| `game` \| `license` \| `software` \| `music` |
| `price` | numeric | Base price in PEN |
| `duration_days` | int | Access duration after approval |
| `features` | text[] | Bullet list shown in modal |
| `active` | bool | Visible in catalog |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `orders`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | |
| `product_id` | uuid FK → products | |
| `amount` | numeric | Final price paid (after discount) |
| `original_amount` | numeric | Base price before discount |
| `discount_id` | uuid FK → discounts (nullable) | Applied discount snapshot |
| `discount_pct` | numeric | % applied at purchase time (0 if none) |
| `status` | text | `pending` \| `approved` \| `rejected` |
| `admin_note` | text | Optional rejection reason |
| `created_at` | timestamptz | |
| `reviewed_at` | timestamptz | Set when admin acts |

### `vouchers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `order_id` | uuid FK → orders | |
| `file_url` | text | Path in Supabase Storage |
| `operation_number` | text | Bank transaction number |
| `bank` | text | Bank name entered by user |
| `uploaded_at` | timestamptz | |

### `subscriptions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | |
| `product_id` | uuid FK → products | |
| `order_id` | uuid FK → orders | |
| `starts_at` | timestamptz | Set on approval |
| `expires_at` | timestamptz | `starts_at + duration_days` |

### `discounts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `label` | text | Admin-facing name, e.g. "Cliente frecuente - Netflix" |
| `type` | text | `loyalty` \| `manual` |
| `pct` | numeric | Discount percentage (e.g. 15 = 15%) |
| `min_purchases` | int (nullable) | For `loyalty`: minimum approved orders to qualify |
| `product_id` | uuid FK → products (nullable) | Restrict to a specific product (null = any) |
| `category` | text (nullable) | Restrict to a category (null = any) |
| `active` | bool | |
| `created_at` | timestamptz | |

### `user_discounts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | |
| `discount_id` | uuid FK → discounts | |
| `assigned_by` | uuid FK → auth.users | Admin who assigned it |
| `assigned_at` | timestamptz | |
| `expires_at` | timestamptz (nullable) | null = permanent |
| `used_at` | timestamptz (nullable) | Set when applied to an order |
| `note` | text (nullable) | Admin note for context |

### `settings`
| Column | Type | Notes |
|---|---|---|
| `key` | text PK | e.g. `whatsapp_number`, `business_name`, `contact_email` |
| `value` | text | |
| `updated_at` | timestamptz | |

**Row Level Security rules:**
- Users can only read their own `orders`, `vouchers`, `subscriptions`, and `user_discounts`.
- `subscriptions` and `user_discounts` are written only via the service role key (API routes).
- Admin role (`user_metadata.role = 'admin'`) can read and write all rows across all tables.
- `discounts` is readable by all authenticated users (to show eligible discounts at checkout).
- `settings` is readable by all; writable only by admin.

---

## Discount System

### Loyalty discounts (automatic)
Defined in `discounts` with `type = 'loyalty'` and a `min_purchases` threshold. Eligibility is resolved at checkout by counting the user's approved orders. Rules can be scoped to a `product_id`, a `category`, or left global (null = applies to any purchase).

Resolution logic lives in `lib/discounts.ts`:

```ts
// Pseudocode
getEligibleDiscounts(userId) {
  approvedCount = count of orders where user_id = userId and status = 'approved'
  manualDiscounts = user_discounts where user_id = userId and used_at IS NULL
                    and (expires_at IS NULL or expires_at > now())
  loyaltyDiscounts = discounts where type = 'loyalty'
                     and min_purchases <= approvedCount and active = true
  return merge(manualDiscounts, loyaltyDiscounts)
  // per product: the highest applicable % wins
}
```

The resolved discount is shown in `ProductCard`, `ProductModal`, and `CartDrawer`. It is snapshotted into `orders.discount_pct` and `orders.discount_id` at order creation — changing a rule later never mutates historical records.

### Manual discounts (admin-assigned)
Admin goes to `/admin/users/[userId]` and assigns a discount from the `discounts` table (or creates a one-off entry first in `/admin/discounts`). This inserts a `user_discounts` row with an optional expiry and note. Once the discount is used in an order, `used_at` is set and it cannot be reused.

Admin can also send an email notification to the user when assigning a discount (template: `discount-assigned`).

---

## Purchase History (User)

Route: `/dashboard/history`

Shows all orders in reverse chronological order. Each row displays: product name, category, original price, discount applied (%), final amount paid, voucher status, and subscription expiry date (if approved).

Data is a single query joining `orders`, `products`, `vouchers`, and `subscriptions` filtered by `user_id`. No separate history table — `orders` is the source of truth.

User-facing filters: by status (`pending` / `approved` / `rejected`), by category, and by date range.

---

## Admin Panel

Accessible only to users with `user_metadata.role = 'admin'`. Middleware enforces this at the route level.

### Sections

| Route | Purpose |
|---|---|
| `/admin` | Dashboard: total revenue, pending vouchers count, new users this month, active subscriptions |
| `/admin/vouchers` | Queue of pending vouchers sorted by upload date; bulk approve/reject |
| `/admin/vouchers/[orderId]` | Full detail: signed voucher image URL, user info, order amount, approve/reject form with optional note |
| `/admin/products` | List all products with active toggle |
| `/admin/products/[productId]` | Create or edit a product (name, category, price, duration, features list) |
| `/admin/users` | User list: name, email, total approved purchases, total spent, active subscriptions, loyalty tier label |
| `/admin/users/[userId]` | User profile: full order history, active subscriptions, assigned discounts, form to assign a new discount |
| `/admin/orders` | All orders with filters by status, date range, product, user |
| `/admin/discounts` | Create and manage loyalty rules (threshold + %) and view all active manual discounts |
| `/admin/settings` | Edit site settings: WhatsApp support number, business name, contact email |

### Admin capabilities summary
- Approve or reject any pending voucher with an optional note to the user.
- Create, edit, and deactivate/activate products and their details.
- View any user's full purchase history and total spending.
- Assign a discount (manual or from a loyalty rule) to a specific user, with optional expiry and note.
- Create and manage loyalty discount rules with purchase thresholds, product/category scope, and percentages.
- See site-wide revenue and subscription stats from the dashboard.
- Update the WhatsApp support number and other site settings without redeploying.

---

## WhatsApp Support

Support chat happens directly in WhatsApp — no API, no chatbot, no webhook. The web only generates a deep link that opens WhatsApp with a pre-filled message. The conversation continues entirely in the WhatsApp app between the user and the business number.

### Implementation

`lib/whatsapp.ts`:

```ts
export function buildWhatsAppLink(message?: string): string {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER; // e.g. "51987654321"
  const text = encodeURIComponent(message ?? 'Hola, necesito ayuda con MUNDOSUBS.');
  return `https://wa.me/${number}?text=${text}`;
}
```

`WhatsAppButton.tsx` is a floating button (bottom-right corner) rendered in `app/layout.tsx` for all authenticated pages. It opens the deep link in a new tab.

Pre-filled messages are contextual:
- Default: `"Hola, necesito ayuda con MUNDOSUBS."`
- From checkout page: `"Hola, tengo una consulta sobre mi pedido #[orderId]."`
- From dashboard: `"Hola, quiero consultar sobre mi suscripción a [productName]."`

The WhatsApp number is read from `NEXT_PUBLIC_WHATSAPP_NUMBER` (env var) and also from the `settings` table key `whatsapp_number` (editable by admin in `/admin/settings`). The `settings` table value takes precedence at runtime; the env var is the build-time fallback.

**Important:** Always use `https://wa.me/` links. Never use `https://api.whatsapp.com/` — that requires the paid WhatsApp Business API.

---

## Payment Flow (Comprobante)

```
1. User selects product → eligible discounts resolved → discounted price shown
2. User confirms → POST /api/orders → creates order with amount and discount_pct snapshot
3. User uploads voucher → Supabase Storage (private bucket: vouchers/)
                        → POST /api/vouchers → saves metadata
4. Supabase DB Webhook → Edge Function notify-voucher → Resend email to admin
5. Admin opens /admin/vouchers → reviews signed image URL, amount, operation number
6. Admin clicks Aprobar → POST /api/admin/review { action: 'approve' }
        → orders.status = 'approved'
        → inserts into subscriptions (expires_at = now() + duration_days)
        → sets user_discounts.used_at if a manual discount was applied
        → sends order-approved email to user via Resend
   Admin clicks Rechazar → POST /api/admin/review { action: 'reject', note: '...' }
        → orders.status = 'rejected'
        → sends order-rejected email with admin_note to user
7. User dashboard shows updated active subscriptions and purchase history
8. Next purchase: loyalty eligibility re-evaluated (approved order count increases by 1)
```

**Voucher storage path:** `vouchers/{user_id}/{order_id}.{ext}`
Bucket is private. Images served only via server-generated signed URLs (1-hour expiry).

---

## Authentication

Supabase Auth handles all identity. Supported providers: Email/Password (default), Google OAuth (optional).

- `middleware.ts` redirects unauthenticated users away from `/dashboard` and `/admin`.
- Admin access gated by `user.user_metadata.role === 'admin'` — set via Supabase Dashboard or service role.
- Session refreshed automatically via `lib/supabase/middleware.ts` on every request.

---

## Email (Resend)

All transactional emails sent via `lib/email.ts` wrapping the Resend SDK.

| Trigger | Recipient | Template |
|---|---|---|
| New voucher uploaded | Admin | `voucher-received` |
| Order approved | User | `order-approved` (product info + expiry date) |
| Order rejected | User | `order-rejected` (includes admin_note) |
| Manual discount assigned | User | `discount-assigned` (shows % and optional expiry) |

Edge Function `notify-voucher` handles the admin notification. All user-facing emails are sent from API routes directly.

---

## Frontend State

| Concern | Tool |
|---|---|
| Server state / fetching | React Query (`@tanstack/react-query`) |
| UI / client state | React `useState` + Zustand (cart) |
| Theme | CSS custom properties + `localStorage` key `theme` |
| Cart | Zustand store, persisted to `localStorage` key `cart` |
| Forms | React Hook Form + Zod validation |

**Cart behavior:** Discount eligibility is resolved server-side when the cart opens. The cart stores the resolved `discount_pct` per item. An `order` record is created only when the user confirms at checkout — not when items are added.

---

## Theming

`globals.css` defines CSS custom properties (`--bg`, `--surface`, `--accent`, etc.). Tailwind `darkMode: 'class'` is used. The `<html>` element receives class `dark` (default) or no class for light mode.

Dark theme accent: `#6d44c8`. Light theme accent: `#5c35b0`.

---

## Deployment (Vercel)

- Connected to GitHub — every push to `main` deploys to production.
- Preview deployments on every PR.
- Environment variables set in Vercel Dashboard (never committed).
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never exposed to the client bundle.

**Supabase:** Production project on Supabase cloud. Migrations run via `supabase db push`. Storage bucket `vouchers` set to private.

---

## Key Conventions

- All monetary values stored and computed in **PEN (soles)** as `numeric` — never `float`.
- `formatPEN(amount)` in `lib/utils.ts` formats display output as `S/ 29.90`.
- Discount percentages are plain numbers (`15` = 15%). Applied as `amount * (1 - pct / 100)`.
- Discount state is always snapshotted at order creation — changing a rule never mutates historical orders.
- API routes validate all input with Zod before touching the database.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client components or `NEXT_PUBLIC_` variables.
- Signed URLs for voucher images are generated server-side and never stored long-term.
- Use `supabase/server.ts` (cookie-based client) in Server Components and API Routes. Use `supabase/client.ts` only in Client Components.
- WhatsApp links always use `https://wa.me/`. Never use `https://api.whatsapp.com/` (requires Business API).