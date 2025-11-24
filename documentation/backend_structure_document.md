# Backend Structure Document

This document outlines the backend architecture, database setup, APIs, hosting, infrastructure, and maintenance plans for the AI-powered, multi-tenant e-menu ordering system for cafes. It’s written in everyday language so that anyone—technical or not—can understand how everything fits together.

## Backend Architecture

### Overview
The backend is built on top of Next.js 15’s App Router, which lets us handle both pages and API routes in a single codebase. It follows a serverless-friendly, modular design: every feature (authentication, chat, orders, menus) lives in its own folder under `app/api` or `app/`.

### Key Design Patterns and Frameworks
- **Next.js API Routes**: Each endpoint is a self-contained function. This simplifies scaling (each route can auto-scale) and keeps code organized.
- **Dynamic Multi-tenant Routing**: We use URL segments like `/[resto-slug]` to serve different cafes without duplicating code.
- **Tool-Calling Pattern**: The AI chat route exposes functions (tools) such as `searchMenu` and `addToCart`. Gemini can call these tools to run queries or update the cart, keeping business logic separate from natural-language handling.
- **Drizzle ORM**: Provides type-safe definitions of our database schema and auto-generates SQL queries, making our code more maintainable and reducing runtime errors.

### Scalability, Maintainability, Performance
- **Scalability**: Serverless routes on Vercel (or similar) handle sudden traffic spikes. The relational database scales vertically and horizontally for read-heavy queries via replicas.
- **Maintainability**: Clear folder structure and type safety from TypeScript and Drizzle help new developers onboard quickly and catch errors early.
- **Performance**: Streaming AI responses with Vercel AI SDK, coupled with edge caching for menu data, ensures snappy interactions.

## Database Management

### Technologies Used
- PostgreSQL (relational SQL database) for reliable, ACID-compliant storage.
- Drizzle ORM for writing type-safe queries and managing migrations.
- Docker Compose for spinning up a local Postgres instance that mirrors production.

### Data Structure and Access
- **Multi-tenant Model**: Every record in tables like `menu_items`, `orders`, and `order_items` carries a `restaurant_id` foreign key to isolate data per cafe.
- **Migrations**: Drizzle scripts track schema changes, ensuring every environment (dev, staging, prod) has the same structure.
- **Indexes**: We add indexes on `restaurant_id`, `slug`, and `order_status` to speed up lookups.

## Database Schema

### Human-Readable Overview
1. **restaurants**: Stores each cafe’s details (name, slug, branding).
2. **menu_items**: Lists items each cafe offers (title, description, price, allergens).
3. **orders**: Captures one chat-driven order (total amount, status, timestamp).
4. **order_items**: Links `orders` to the specific `menu_items` in that order.
5. **users** (admins): Contains cafe admin login info (email, password hash, role).

### PostgreSQL Schema Definition
```sql
-- 1. restaurants
drop table if exists restaurants;
create table restaurants (
  id serial primary key,
  name text not null,
  slug text unique not null,
  theme jsonb default '{}' not null,
  created_at timestamptz default now()
);

-- 2. menu_items
drop table if exists menu_items;
create table menu_items (
  id serial primary key,
  restaurant_id int references restaurants(id) on delete cascade,
  title text not null,
  description text,
  price numeric(8,2) not null,
  allergens text[],
  created_at timestamptz default now()
);
create index on menu_items(restaurant_id);

-- 3. orders
drop table if exists orders;
create table orders (
  id serial primary key,
  restaurant_id int references restaurants(id) on delete cascade,
  total_amount numeric(10,2) not null,
  status text not null default 'pending',
  created_at timestamptz default now()
);
create index on orders(restaurant_id);
create index on orders(status);

-- 4. order_items
drop table if exists order_items;
create table order_items (
  id serial primary key,
  order_id int references orders(id) on delete cascade,
  menu_item_id int references menu_items(id),
  quantity int not null default 1
);

-- 5. users
drop table if exists users;
create table users (
  id serial primary key,
  email text unique not null,
  password_hash text not null,
  role text not null default 'admin',
  restaurant_id int references restaurants(id),
  created_at timestamptz default now()
);
```  

## API Design and Endpoints

We follow a REST-style approach, with clear separation of concerns for each resource.

### Authentication
- **POST /api/auth/sign-up**: Register a new admin user. Uses Better Auth under the hood.
- **POST /api/auth/login**: Sign in and receive a session token.
- **POST /api/auth/logout**: Invalidate session.

### Restaurant & Menu
- **GET /api/restaurants/[slug]/menu**: Fetch menu items for a given cafe slug.
  - Inputs: `slug` in URL.
  - Returns: List of menu items.

### AI Chat
- **POST /api/chat**: Handle incoming customer messages, stream AI responses, and perform tool calls.
  - Inputs: customer message, restaurant slug.
  - Tools available: `searchMenu`, `addToCart`, `getAllergens`.
  - Output: Streaming AI response with tool results embedded.

### Orders
- **POST /api/orders**: Create a new order based on the customer’s cart.
  - Inputs: `restaurant_slug`, `cart_items` (menu_item_id, quantity).
  - Process: Validates items, calculates total, writes to `orders` and `order_items`.
- **GET /api/orders**: List all orders for the authenticated admin’s restaurant.
- **PUT /api/orders/[orderId]**: Update an order’s status (e.g., `pending` → `completed`).

### Admin Dashboard
- **GET /api/dashboard/orders**: Alias for `GET /api/orders`, but scoped to the logged-in user.

## Hosting Solutions

### Production Environment
- **Next.js App**: Deployed on **Vercel**, which provides built-in CDN, SSL, auto-scaling, and zero-config deployments.
- **PostgreSQL Database**: Hosted on **AWS RDS** (or any managed Postgres service). Offers automated backups, failover, and vertical/horizontal scaling.

### Development Environment
- **Docker Compose**: Runs a local Postgres and Next.js instance. Mirrors production settings for consistency.

### Benefits
- **Reliability**: Managed services handle backups, failover, and updates.
- **Scalability**: Vercel auto-scales serverless functions. RDS can add read replicas.
- **Cost-Effectiveness**: Pay-as-you-go pricing and the ability to start small in early stages.

## Infrastructure Components

- **Load Balancer / Edge Network**: Provided by Vercel. Routes requests to the nearest edge location.
- **CDN**: Automatically caches static assets (JS, CSS, images) at edge locations.
- **Caching Layer**: We recommend adding a Redis cache (e.g., AWS ElastiCache) for frequent menu lookups or AI tool results to reduce database load.
- **Logging & Monitoring**: Integrated with Vercel logs, plus optional Sentry or Datadog for error tracking.
- **SSL/TLS**: Managed by Vercel, ensuring secure data in transit.

## Security Measures

- **Authentication**: Better Auth handles sign-up, login, session management with secure cookies and JWTs.
- **Authorization**: Middleware checks user roles—only admins can access dashboard routes.
- **Input Validation**: All API inputs (chat prompts, order payloads) are validated using a schema (e.g., Zod) to prevent injection attacks.
- **Rate Limiting**: Applied to `/api/chat` to prevent abuse and control AI usage costs.
- **Encryption**:
  - **In Transit**: TLS everywhere (SSL handled by Vercel).
  - **At Rest**: Encryption on RDS volumes.
- **Secrets Management**: Environment variables stored securely in Vercel or your cloud provider.

## Monitoring and Maintenance

- **Performance Monitoring**: Vercel Insights tracks function latency and error rates.
- **Error Tracking**: Sentry (or similar) captures exceptions in API routes and cron jobs.
- **Health Checks**: Automatic uptime checks for critical endpoints (e.g., `GET /api/health`).
- **Database Backups**: Automated daily snapshots and point-in-time recovery on RDS.
- **Schema Migrations**: Managed with Drizzle’s migration CLI—run in CI/CD before deploy.
- **Dependency Updates**: Use tools like Dependabot to keep libraries up to date.

## Conclusion and Overall Backend Summary

This backend is designed to be **secure**, **scalable**, and **easy to maintain**. Using Next.js API routes and serverless deployment on Vercel ensures we can handle variable traffic without manual scaling. PostgreSQL with Drizzle ORM gives us a robust, type-safe data layer that supports multi-tenant isolation. The AI tool-calling pattern powers a natural conversation interface for ordering, while built-in CI/CD, monitoring, and managed hosting guarantee reliability and quick updates.

Unique aspects:
- **Dynamic Multi-Tenant Routing** via URL slugs.
- **AI Tool Calling** for real-time chat integration.
- **Dockerized Local Setup** for consistent developer experience.

All components—from authentication to AI chat to order management—work together seamlessly to deliver a modern, AI-driven e-menu platform for cafes.