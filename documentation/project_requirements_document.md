# Project Requirements Document (PRD)

## 1. Project Overview

This project is an AI-powered, multi-tenant e-menu ordering system for cafes. Customers arrive at a unique URL for each cafe (e.g., `/starbucks-downtown`), browse the menu, and interact with an AI chat assistant to discover items, ask questions, and build their order. Behind the scenes, the system uses dynamic routing to isolate each cafe’s data, a modern Next.js frontend for user interactions, and a PostgreSQL database with Drizzle ORM for multi-tenant data modeling.

Cafe owners and staff access a protected admin dashboard to view and manage incoming orders in real time. The AI component (powered by Google Gemini via the Vercel AI SDK) provides an intuitive, conversational way to explore the menu, recommend items, and handle cart actions with custom “tool calls” (e.g., `searchMenu`, `addToCart`). This combination of multi-tenancy, AI-driven UX, and secure order management solves the dual problems of manual order taking and siloed applications for each cafe.

**Key Objectives / Success Criteria:**
- Deliver a secure, scalable multi-tenant e-menu web app.
- Provide a responsive, AI-driven chat interface that can recommend and add items.
- Enable cafe admins to authenticate, view, and update orders seamlessly.
- Keep average page load times under 200 ms and chat response latency under 300 ms.
- Maintain data isolation between tenants and adhere to basic security/compliance standards.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1):**
- Dynamic routing for multiple cafes via URL slugs (e.g., `/[resto-slug]`).
- Customer-facing e-menu page listing menu items fetched from the database.
- AI chat interface (Vercel AI SDK + Gemini) with tool calls:
  - `searchMenu(query)`: find matching menu items.
  - `addToCart(itemId)`: add an item to the shopping cart.
- Client-side cart management and UI (view/edit items, total price).
- “Place Order” flow calling an `/api/orders` endpoint to persist the order.
- Admin authentication (Better Auth) and protected `/dashboard` for order management.
- Order management table with CRUD operations on order status.
- Basic theming support per cafe (colors, logo).  
- Docker Compose setup for local PostgreSQL and Next.js environment.

**Out-of-Scope (Future Phases):**
- Payment gateway integration (Stripe, PayPal, etc.).
- Loyalty/rewards program or customer accounts.
- Multi-language support.
- Advanced analytics/dashboard (sales reports, traffic stats).
- Push notifications or SMS alerts.
- Offline mode or PWA features.
- Mobile-native apps (React Native / SwiftUI).

## 3. User Flow

**Customer Journey:**
A user visits `https://example.com/[resto-slug]`. The page loads the cafe’s branding and menu items via Drizzle queries on the server. The main view shows a chat bubble and a grid of `MenuItemCard` components built with `shadcn/ui`. The user clicks the chat input, asks, “What cold coffees do you have?” The frontend calls `/api/chat`, streaming the AI’s response. If the AI invokes `searchMenu`, the server filters menu items and returns results in the chat. The user clicks “Add Cold Brew,” triggering `addToCart`, which updates the cart widget in real time. Once satisfied, the user clicks “Place Order,” and the cart data is POSTed to `/api/orders`. A confirmation message appears.

**Admin Journey:**
A cafe staff member navigates to `/dashboard`. If not logged in, they’re redirected to an authentication page (Better Auth). After signing in, they land on a dashboard showing a table of new and in-progress orders, with columns for order ID, items, total, status, and timestamp. Each row has action buttons to mark an order as “Preparing,” “Ready,” or “Completed.” The admin can filter or search orders. Updates trigger a Drizzle mutation to update the database, and the page refreshes (or uses real-time subscriptions) to reflect changes.

## 4. Core Features

- **Multi-Tenant Routing:** Unique dynamic route segment `[resto-slug]` for each cafe.
- **Authentication:** Admin sign-up, login, and session management using Better Auth.
- **Database Schema:** Drizzle ORM models for `restaurants`, `menuItems`, `orders`, `orderItems`, all scoped by `restaurantId`.
- **Customer E-Menu UI:** Responsive menu grid, item details, and shopping cart panel.
- **AI Chat Interface:** Streaming chat powered by Vercel AI SDK and Gemini (`gemini-2.5-flash`).
- **Tool Calling:** Defined server-side functions (`searchMenu`, `addToCart`) exposed to Gemini.
- **Order Placement API:** REST endpoint `/api/orders` to create orders with validation.
- **Admin Dashboard:** Protected order table with CRUD status updates.
- **Theming & Branding:** Per-tenant color and logo configuration.
- **Containerization:** Docker Compose for local dev environment (Next.js + PostgreSQL).

## 5. Tech Stack & Tools

- **Frontend:** Next.js 15 (App Router), React, TypeScript, `shadcn/ui` component library.
- **Backend:** Next.js API routes, Node.js, TypeScript.
- **Database & ORM:** PostgreSQL, Drizzle ORM for type-safe schema definitions.
- **Authentication:** Better Auth for secure admin sign-up/login.
- **AI Integration:** Vercel AI SDK + Google Gemini (`gemini-2.5-flash`) with tool-calling.
- **Containerization:** Docker, Docker Compose for local dev.
- **State Management:** Light state hooks or optional library (Zustand/Jotai) for cart.
- **IDE & Plugins:** Visual Studio Code with official extensions for Next.js, TypeScript, Drizzle.

## 6. Non-Functional Requirements

- **Performance:** 
  - First Contentful Paint < 1 s under 3G.
  - TTFB < 200 ms for server components.
  - Chat streaming latency < 300 ms.
- **Security:** 
  - TLS/HTTPS for all endpoints.
  - CSRF protection on POST endpoints.
  - Input validation and sanitization on `/api/chat` and `/api/orders`.
  - Rate limiting on chat endpoint to prevent abuse.
- **Scalability:** 
  - Support at least 100 concurrent chat sessions per cafe.
  - Database indexing on `restaurantId`, `orderId` for fast queries.
- **Usability:** 
  - Accessible UI targeting WCAG AA.
  - Responsive design across desktop and mobile browsers.
- **Compliance:** 
  - GDPR-ready (data stored in EU region optional).
  - Encryption at rest for database credentials.

## 7. Constraints & Assumptions

- **AI Availability:** Gemini (`gemini-2.5-flash`) must be accessible via Vercel AI SDK; API quotas may apply.
- **Environment:** Node 18+, Docker support, PostgreSQL 14+.
- **Tenant Isolation:** All data models scoped by `restaurantId` to prevent cross-tenant data leaks.
- **Network Reliability:** Real-time features assume stable internet connection; no offline fallback.
- **Theming:** Cafes supply logo URL and primary color in the `restaurants` table.

## 8. Known Issues & Potential Pitfalls

- **API Rate Limits:** Gemini calls may hit usage caps. Mitigation: implement caching for repeated `searchMenu` queries and enforce rate limits per user/session.
- **Latency Spikes:** High chat concurrency may introduce delays. Mitigation: use streaming, minimize prompt size, and offload static menu data from prompts when possible.
- **Data Isolation Bugs:** Missing `restaurantId` filters could expose one cafe’s data to another. Mitigation: enforce tenant checks at ORM and API layer.
- **Database Migration Complexity:** Evolving the schema (adding tables or columns) may require careful migration scripts. Use Drizzle’s migration tooling and test on a clone of production data.
- **Cart State Sync:** Concurrent tabs may show different cart states. Consider using shared client-side state store or `localStorage` reconciliation.
- **Error Handling:** Unexpected AI or database errors can break the flow. Implement retries for transient failures, fallback messages in chat ("Sorry, something went wrong."), and centralized error logging.

---

This PRD serves as the definitive guide for an AI model (and the engineering team) to design, implement, and extend the multi-tenant, AI-driven cafe e-menu ordering system without ambiguity. Subsequent technical documents (tech stack details, UI specs, backend structure) can be generated directly from these requirements.