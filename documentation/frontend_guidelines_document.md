# Frontend Guideline Document

This document covers the frontend setup for the ai-cafe-ordering-multitenant project. It explains the architecture, design principles, styling, components, state, routing, performance, testing, and a summary to help everyone understand how the frontend is built and why.

## 1. Frontend Architecture

Our frontend is built with **Next.js 15** using the **App Router**. We use **TypeScript** for type safety, **Tailwind CSS** for styling, and **shadcn/ui** as our base component library. Here's how this setup supports our goals:

- **Scalability**: Next.js’s dynamic routes (`app/[resto-slug]/page.tsx`) let us serve multiple tenants (cafes) from a single codebase. Adding a new cafe is as simple as giving it a new slug.
- **Maintainability**: We organize code into clear folders (`app/`, `components/`, `lib/`, `db/`). Reusable UI pieces come from shadcn/ui, and custom components live in `components/`. Typescript ensures we catch errors early.
- **Performance**: Next.js offers server components, code-splitting, and built-in optimizations for fast page loads. We also use Docker Compose for a consistent development environment.

## 2. Design Principles

We follow three core design principles:

1. **Usability**: Interfaces are clean and intuitive. Customers can chat with the AI, browse menus, and place orders in just a few clicks. Admins see only the tools they need for order management.
2. **Accessibility**: We build with semantic HTML and ensure components have proper labels, focus states, and keyboard support. Colors meet contrast standards for readability.
3. **Responsiveness**: The layout and components adapt to mobile, tablet, and desktop screens. We use Tailwind’s responsive utilities to ensure every user has a smooth experience, no matter the device.

These principles guide how we design pages, buttons, forms, modals, and the chat interface. For example, chat bubbles resize properly on small screens, and the menu grid wraps neatly on mobile.

## 3. Styling and Theming

### Styling Approach
- We use **Tailwind CSS** (utility-first) combined with **CSS variables** for any custom properties.
- **shadcn/ui** sits on top of Tailwind, giving us a set of accessible, customizable components out of the box.
- We follow a **flat, modern design** style: clean lines, minimal shadows, and a focus on content.

### Theming
- Global theme colors live in `tailwind.config.ts` under the `theme.extend.colors` section.
- Each tenant (cafe) can override primary and accent colors via CSS variables in a layout wrapper or per-tenant CSS file.
- We store theme values (colors, logo URLs) in the database and load them at build or run time.

### Color Palette (Example)
- Primary: `#1F2937` (dark gray)
- Secondary/Accent: `#F59E0B` (amber)
- Background: `#F3F4F6` (light gray)
- Text Primary: `#111827` (almost black)
- Text Secondary: `#6B7280` (gray)
- Success: `#10B981` (green)
- Warning: `#F97316` (orange)
- Danger: `#EF4444` (red)

### Typography
- Base font: **Inter**, a modern, highly readable sans-serif.
- Fallback: `system-ui, -apple-system, BlinkMacSystemFont, sans-serif`.
- Font weights: 400 (normal), 500 (medium), 600 (semi-bold).
- Headings use a slightly heavier weight and larger size for clear hierarchy.

## 4. Component Structure

We follow a **component-driven** approach:

- **`app/` folder**: Defines the page structure and layouts. Dynamic routes (`[resto-slug]`) appear here. Server components fetch data directly from the database.
- **`components/` folder**: Houses reusable React components, organized by feature:
  - `ChatInterface.tsx` – customer chat window
  - `MenuItemCard.tsx` – displays a menu item with image, name, and price
  - `ShoppingCart.tsx` – slide-over or modal showing cart contents
  - `OrderTable.tsx` – admin dashboard table for orders
  - `ui/` – wrappers for shadcn/ui components for consistency
- Components are **self-contained**: each has its own styles (via Tailwind) and props.
- We aim for **small, focused** components that do one thing well. This makes testing and reusing them easier.

## 5. State Management

We separate global and local state:

- **Global State**: We use **Zustand** for the shopping cart. It’s lightweight and lets us share cart data across the chat, menu, and checkout components without prop drilling.
- **Session State**: Better Auth (our authentication library) provides a React hook (`useAuth`) to get the current admin user in protected pages (`/dashboard`). No extra state library is needed for auth.
- **Local State**: Individual components manage their own form inputs or UI toggles (e.g., chat input text) with React’s built-in `useState`.

This mix keeps our code simple while ensuring the cart is always in sync.

## 6. Routing and Navigation

We rely on **Next.js App Router**:

- **Dynamic Routes**: `app/[resto-slug]/page.tsx` renders a customer-facing menu and chat for each cafe. The slug drives data fetching via Drizzle.
- **Protected Routes**: `app/dashboard/page.tsx` is guarded by Better Auth. Unauthenticated users redirect to `/login`.
- **API Routes**: Located in `app/api/`:
  - `auth/[...route]` – admin login/signup
  - `chat/route.ts` – handles AI chat requests, tool calls
  - `orders/route.ts` – receives new orders from customers
- **Navigation**:
  - Customers use simple links and buttons to move between chat and cart.
  - Admins have a sidebar or top nav in the dashboard for Orders, Settings.
  - We use `next/link` and `useRouter` for client-side transitions.

## 7. Performance Optimization

To keep the app fast and responsive:

- **Server Components**: Fetch menu data on the server to reduce bundle size.
- **Code Splitting**: Next.js automatically splits code; we also use `dynamic()` for heavy components like the chat interface if needed.
- **Image Optimization**: Use Next.js `<Image>` for menu item photos with automatic resizing and format selection.
- **Lazy Loading**: Defer non-critical components (e.g., admin charts or large modals) until they’re needed.
- **Caching**:
  - Database queries via Drizzle can be cached at the edge or in-memory on the server.
  - We implement short-term caching for repeated menu fetches.
- **Tailwind Purge**: Unused CSS classes are removed in production, keeping CSS bundles small.

## 8. Testing and Quality Assurance

We ensure reliability with three levels of tests:

1. **Unit Tests** (Jest + React Testing Library):
   - Test small functions (cart calculations, AI prompt builders).
   - Test simple components (MenuItemCard, button variants).
2. **Integration Tests** (Jest + Testing Library):
   - API routes (`app/api/chat`, `app/api/orders`) to confirm they handle requests and responses correctly.
   - Drizzle queries return expected data structures.
3. **End-to-End Tests** (Playwright or Cypress):
   - Simulate a customer journey: visit a cafe slug, chat with AI, add to cart, place an order.
   - Simulate an admin journey: log in, view new order, update status.

We also use **ESLint** and **Prettier** to keep code style consistent and avoid simple errors.

## 9. Conclusion and Frontend Summary

This frontend setup balances modern tools with a clear structure:

- **Next.js 15 + TypeScript** for scalable, maintainable pages and API routes.
- **Tailwind CSS** and **shadcn/ui** for a consistent, accessible UI.
- **Dynamic routing** for multi-tenancy, **Better Auth** for secure admin access.
- **Drizzle ORM** for reliable, type-safe data fetching.
- **Vercel AI SDK & Gemini model** for an AI-powered chat experience with tool-calling.
- **Zustand** for an easy-to-manage shopping cart state.
- **Docker Compose** for a one-command development environment.
- **Robust testing** at unit, integration, and end-to-end levels.

The result is a fast, flexible, and extendable frontend that supports multi-tenant e-menu ordering with AI assistance. Whether you’re adding new cafes, tweaking the chat logic, or refining the design, this architecture keeps everything organized and easy to work with.