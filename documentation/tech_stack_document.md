# AI Cafe Ordering Multi-Tenant – Tech Stack Document

This document explains, in everyday language, the technologies and services that power the AI-driven, multi-tenant e-menu ordering system for cafes. It shows how each piece fits together to deliver a secure, fast, and scalable experience for both customers and cafe administrators.

## 1. Frontend Technologies

These are the tools that run in the user’s web browser and shape what they see and interact with.

- **Next.js 15 (App Router)**
  - A React-based framework that handles page routing, data fetching, and server rendering for faster page loads.
  - Supports dynamic routes (e.g., `/[resto-slug]`) so each cafe has its own unique URL and menu.
  - Lets us use **Server Components** to fetch data on the server and send only the finished HTML to the browser for a snappier experience.

- **React (with TypeScript)**
  - React builds the interactive bits of the UI (buttons, forms, chat bubble, etc.).
  - TypeScript adds clear rules for the shape of our data, helping catch mistakes early and making the code easier to understand and maintain.

- **shadcn/ui (Tailwind-based UI Library)**
  - A ready-made collection of styled components (cards, tables, dialogs) built on Tailwind CSS.
  - Speeds up UI development and ensures a consistent look and feel across customer and admin screens.

- **Tailwind CSS**
  - A utility-first styling approach that lets us rapidly build custom designs without writing a lot of custom CSS.

- **Client-Side State Management (Zustand or Jotai)**
  - Lightweight libraries to handle the shopping cart and other transient states in a simple, predictable way.

- **Vercel AI SDK (Client)**
  - Powers the chat interface by streaming AI responses from the server to the browser in real time.

## 2. Backend Technologies

These components run on the server, handle data storage, and power the application’s logic.

- **Next.js API Routes**
  - Built-in serverless endpoints under `app/api/` that handle requests from the frontend.
  - Examples include `/api/chat` for AI conversations and `/api/orders` for submitting new orders.

- **Better Auth**
  - A secure, pre-built authentication library for sign-up, login, password resets, and session management.
  - Protects the `/dashboard` area so only authorized cafe staff can see and manage orders.

- **PostgreSQL Database**
  - A reliable SQL database to store all tenants (cafes), their menus, orders, and order items.
  - Scales easily as you add more cafes and orders.

- **Drizzle ORM**
  - A type-safe library for defining database schemas and running queries from TypeScript.
  - Enforces relationships (e.g., each `menuItem` belongs to a specific `restaurant`) and helps prevent common SQL mistakes.

- **AI Integration (Vercel AI SDK & Google Gemini)**
  - The server calls the Gemini 2.5 Flash model to power natural-language chat.
  - We define custom “tools” (functions) like `searchMenu` and `addToCart` that the AI can invoke to look up items or adjust the cart.

## 3. Infrastructure and Deployment

How we host, build, and maintain the application for reliability and ease of updates.

- **Version Control: Git & GitHub**
  - All code lives in a Git repository on GitHub, enabling collaboration, code reviews, and history tracking.

- **Containerized Development (Docker Compose)**
  - A single command brings up both the Next.js app and PostgreSQL locally in Docker containers.
  - Ensures every developer works in an identical environment, reducing “it works on my machine” issues.

- **Continuous Integration / Continuous Deployment (CI/CD)**
  - GitHub Actions (or similar) run automated tests and lint checks on every pull request.
  - Successful builds can be deployed automatically to a hosting platform.

- **Hosting: Vercel (or any cloud provider)**
  - Optimized for Next.js—automatic scaling, global content delivery, and built-in edge caching.
  - Simplifies deployments with zero-configuration builds and rollbacks.

## 4. Third-Party Integrations

External services that add key capabilities without reinventing the wheel.

- **Better Auth**
  - Handles all authentication flows securely so we don’t have to build and maintain that logic ourselves.

- **Vercel AI SDK & Google Gemini**
  - Powers the conversational AI features, enabling natural-language ordering and menu exploration.

- **Analytics (Optional)**
  - Tools like Google Analytics or Plausible can be added to track visitor behavior and conversion rates.

- **Payment Processor (Future)**
  - Stripe, PayPal, or another service can be integrated when you’re ready to handle online payments.

## 5. Security and Performance Considerations

Measures we’ve taken (or can take) to protect data and keep the app fast.

- **Authentication & Authorization**
  - Better Auth secures sign-in and protects admin routes.
  - Role checks ensure only authorized users can view or modify orders.

- **Input Validation & Rate Limiting**
  - All API endpoints validate incoming data to prevent malformed requests.
  - Rate limiting on the chat endpoint to prevent abuse of AI API calls and control costs.

- **Error Handling & Logging**
  - Centralized error handling in API routes to catch and log failures (database errors, AI timeouts).
  - Logs can be shipped to a service like LogRocket, Sentry, or Datadog for monitoring.

- **Performance Optimizations**
  - **Server Components** in Next.js reduce JavaScript sent to the browser.
  - **Database Indexing** on `restaurantId` and other foreign keys ensure menu and order queries stay fast as data grows.
  - **Caching Strategies** (EDGE cache, in-memory cache) for menu data and frequent AI prompts to reduce latency and API costs.

## 6. Conclusion and Overall Tech Stack Summary

Our multi-tenant e-menu system is built on a modern, well-integrated stack that balances speed of development with long-term maintainability:

- A **React + Next.js 15** frontend with **TypeScript** and **shadcn/ui** for a clear, component-driven UI.
- A **Node.js**-powered server using **Next.js API Routes**, **Better Auth**, and **Drizzle ORM** with **PostgreSQL** for secure, type-safe data handling.
- AI-driven chat features through the **Vercel AI SDK** and **Google Gemini**, enabling natural-language ordering and seamless tool calls.
- **Docker Compose** for a reliable local environment, **GitHub Actions** for automated testing and deployment, and **Vercel** (or similar) for scalable hosting.
- A focus on **security** (authentication, input checks, rate limits) and **performance** (server streaming, caching, indexing) to keep the experience fast and safe.

This carefully chosen tech stack ensures that each cafe gets its own branded space, that customers enjoy a conversational ordering experience, and that administrators have a secure, intuitive dashboard for managing orders. Together, these technologies form a solid foundation for launching and scaling your AI-powered e-menu platform—today and tomorrow.