# Mayumi Commerce Backend — Design Spec

**Date:** 2026-06-11
**Project:** mayumi-luxe (Mayumi Fine Jewels)
**Status:** Approved design, pending implementation plan

## Goal

Turn the Mayumi Fine Jewels landing page into a working e-commerce system with a Supabase-backed catalog, real checkout that records orders, and a POS/ERP/CRM-style admin portal (recycled from the Balcony Solar CRM) for managing products, inventory, orders, fulfillment, customers, and staff.

## Summary of Decisions

- **Catalog + inventory source:** Full product catalog lives in Supabase, managed through the admin portal like a POS/ERP. Price and stock changes reflect live on the storefront.
- **Checkout:** Saves real orders to Supabase. COD supported. Customer receives an order confirmation email.
- **Email:** Sent via n8n webhook (app POSTs JSON → n8n → Gmail), same pattern as Balcony Solar.
- **Admin access:** Full user management recycled from Balcony Solar — Supabase login, admin gating (pending/blocked), Users page with invites + roles.
- **Fulfillment:** Order list has a per-order Fulfill/Ship button; marking it shipped fires a delivery notification email to the customer.
- **Customers:** Every buyer is recorded as a customer (deduped); admin has a Customers page with purchase history (CRM).
- **Architecture:** Single Next.js app — admin portal lives inside `mayumi-luxe` under `/admin`.

## Architecture

One Next.js 16 app (existing `mayumi-luxe`). Add Supabase via `@supabase/ssr` + `@supabase/supabase-js`.

Three Supabase clients recycled from `BalconySolarPH/lib`:
- `lib/supabase-browser.ts` — client components (anon key)
- `lib/supabase-server.ts` — server components / route handlers (cookie-aware, anon key)
- `lib/supabase-admin.ts` — service-role key, server-only (privileged writes)

```
app/
  (store)/                  storefront at "/" (current landing, reads products from DB)
  admin/
    layout.tsx              portal shell + sidebar (recycled, rebranded Mayumi)
    page.tsx                Dashboard
    login/                  Supabase login (recycled)
    set-password/           invite flow (recycled)
    orders/                 order list + detail + fulfill
    customers/              customer list + detail (purchase history)
    products/               POS/ERP inventory management
    users/                  staff management (recycled)
  api/
    orders/route.ts                 POST create order (checkout)
    orders/[id]/fulfill/route.ts    POST mark fulfilled/shipped
    products/route.ts               admin CRUD
    products/[id]/route.ts          admin update/delete
    customers/route.ts              admin read
    users/...                       recycled
middleware.ts               Supabase session refresh + protect /admin
```

## Data Model (Supabase / Postgres)

### products
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| slug | text unique | |
| name | text | |
| category | text | Rings / Necklaces / Earrings |
| price | numeric | PHP |
| description | text | |
| primary_image | text | path under /mayumi-assets |
| images | jsonb | carousel array of paths |
| specs | jsonb | array of {label, value} |
| stock | integer | current quantity |
| low_stock_threshold | integer | default 3 |
| active | boolean | default true (hidden from store if false) |
| created_at, updated_at | timestamptz | |

### orders
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| order_number | text unique | human-friendly, e.g. MJ-20260611-0001 |
| customer_id | uuid fk → customers | |
| customer_name | text | snapshot |
| mobile | text | |
| email | text | |
| address_barangay, address_city, address_province | text | |
| address_full | text | |
| payment_method | text | GCash / Bank Transfer / COD |
| status | text | pending → confirmed → fulfilled → shipped → cancelled |
| subtotal, shipping_fee, total | numeric | |
| notes | text | |
| created_at, updated_at | timestamptz | |

### order_items
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| order_id | uuid fk → orders | cascade delete |
| product_id | uuid fk → products | |
| name | text | snapshot at purchase |
| price | numeric | snapshot at purchase |
| qty | integer | |

### customers
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| name | text | |
| email | text | dedupe key (lowercased) |
| mobile | text | secondary dedupe key |
| address_barangay, address_city, address_province, address_full | text | latest known |
| total_orders | integer | maintained on order create |
| total_spent | numeric | maintained on order create |
| first_order_at, last_order_at | timestamptz | |
| created_at, updated_at | timestamptz | |

### profiles (recycled from Balcony Solar)
| Column | Type | Notes |
|---|---|---|
| id | uuid pk = auth.users.id | |
| email | text | |
| role | text | owner / staff |
| status | text | pending / active / blocked |
| created_at | timestamptz | |

### inventory_log
| Column | Type | Notes |
|---|---|---|
| id | uuid pk | |
| product_id | uuid fk → products | |
| change | integer | negative for sale, positive for restock |
| reason | text | sale / restock / adjust |
| order_id | uuid fk → orders | nullable |
| created_at | timestamptz | |

## Storefront

- A server component fetches active products from Supabase (replaces hardcoded `lib/products.ts`). The `Product` TS type is kept and mapped from DB rows.
- The existing 5 products + their carousel image paths are **seeded** into the DB (SQL seed). Images stay in `/public/mayumi-assets`.
- Live price + stock. When `stock <= 0`, product shows "Sold out" and Add-to-Cart is disabled.

## Checkout → Order

`POST /api/orders` (server route, service-role):
1. Receive cart (product ids + qty) + customer form fields.
2. **Re-fetch products from DB**; validate each line is active and `stock >= qty`. Reject with a clear error if any line is out of stock.
3. **Recompute** subtotal, shipping fee (free ≥ ₱2000 else ₱100), and total server-side. Never trust client totals.
4. In a Postgres function / transaction:
   - Upsert customer (dedupe by lowercased email, fallback mobile); update `total_orders`, `total_spent`, `last_order_at` (set `first_order_at` if new).
   - Insert `orders` row (status `pending` for COD) + `order_items` snapshots.
   - Decrement `products.stock` per line with a guard (`stock = stock - qty WHERE stock >= qty`); abort if guard fails (prevents overselling).
   - Insert `inventory_log` rows (reason `sale`).
5. Fire n8n `order.created` webhook with order payload (best-effort; failure logged, does not roll back the order).
6. Return `{ order_number }`. Thank-you view displays it.

## Admin Portal (recycled from Balcony Solar CRM)

- **Auth:** Supabase email/password login; admin gating via `profiles.status` (pending/blocked screens recycled); Users page to invite staff, set role, block. Recycle `lib/admin-auth.ts`, `app/admin/login`, `set-password`, `users`.
- **Layout:** Sidebar recycled from `BalconySolarPH/components/crm/sidebar.tsx`, rebranded Mayumi. Nav: **Dashboard · Orders · Customers · Products/Inventory · Users**.
- **Dashboard:** today's sales total, pending orders count, low-stock count, new-vs-returning customers today, recent orders list.
- **Orders:** filterable by status; row → detail (customer, items, address, payment, notes). **Fulfill/Ship button** updates status → fires n8n `order.fulfilled` webhook (delivery notification).
- **Customers:** list (name, contact, # orders, total spent, last order); click → detail with contact info + full purchase history. Search/filter recycled from CRM leads list.
- **Products/Inventory (POS/ERP):** table to add/edit/delete products, set price, set stock, set low-stock threshold, toggle active, manual restock (writes `inventory_log` reason `restock`). Image paths referenced from existing assets (uploads are out of scope for v1).

## Email (n8n webhooks)

- Outbound JSON POST to webhook URL(s) in env: `N8N_ORDER_WEBHOOK_URL`.
- Events:
  - `order.created` → customer order confirmation (order number, items, total, address).
  - `order.fulfilled` → customer delivery notification.
- The n8n→Gmail workflow is maintained outside the app (user-owned), same as Balcony Solar. App responsibility ends at the webhook POST.

## Security

- **RLS** on all tables:
  - `products`: SELECT for anon (active only); INSERT/UPDATE/DELETE for authenticated admins.
  - `orders` / `order_items` / `customers`: INSERT allowed for the checkout path via server route (service-role bypasses RLS); SELECT/UPDATE for admins only. No anon read.
  - `profiles`: user can read own row; admins manage all.
- Service-role key used **only** in server API routes, never shipped to the client.
- `/admin/*` protected by `middleware.ts` (session) + server-side `profiles.status = active` check.
- Server-side price/stock validation on checkout (authoritative totals).
- Secrets (`SUPABASE_SERVICE_ROLE_KEY`, `N8N_ORDER_WEBHOOK_URL`) stored in Vercel env + `.env.local` (gitignored), never committed.

## Build Order (Phases)

1. **Supabase foundation** — install deps, three clients, schema migration (all tables + RLS + stock-decrement function), seed current 5 products, storefront reads from DB.
2. **Checkout → orders** — `POST /api/orders` with server validation, transactional order + customer upsert + stock decrement + inventory log, `order.created` webhook, thank-you order number.
3. **Admin auth + shell** — recycle Supabase auth, admin gating, login, set-password, Users page, sidebar layout, Dashboard skeleton.
4. **Orders + Customers + fulfillment** — Orders list/detail, Fulfill/Ship → status + `order.fulfilled` webhook; Customers list/detail with purchase history.
5. **Products/Inventory management** — POS/ERP CRUD, stock adjust, low-stock flags, wire Dashboard stats.

## Testing

- The project has no test runner today. Because order creation and stock decrement involve money and overselling risk, add **Vitest** for that business logic: order total recomputation, shipping-fee rule, stock-decrement guard (rejects when `qty > stock`), and customer dedupe/upsert.
- Everything else verified per-phase: production build clean, asset/route HTTP 200, manual browser walkthrough.

## Out of Scope (v1)

- Online payment gateway integration (GCash/card APIs) — payment methods are recorded, not processed.
- Image uploads in the admin (paths referenced from existing assets).
- Returns/refunds workflow.
- Multi-warehouse / variants (size/color) inventory.
