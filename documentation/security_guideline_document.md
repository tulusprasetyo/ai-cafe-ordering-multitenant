# Security Guidelines for ai-cafe-ordering-multitenant

This document presents a set of security guidelines and best practices tailored to the **AI-powered, multi-tenant e-menu ordering system for cafes** built with Next.js 15, Drizzle ORM, PostgreSQL, the Vercel AI SDK, and Docker Compose. Adhering to these guidelines will help ensure the application is secure by design, resilient, and trustworthy.

---

## 1. Authentication & Access Control

### 1.1 Robust Authentication
- Use **Better Auth** for admin authentication. Enforce:
  - Strong password policies: minimum 12 characters, mixed case, numbers, and symbols.
  - Unique, per-user salts and **Argon2** or **bcrypt** for password hashing.
  - Account lockout after repeated failed attempts (e.g., 5 tries in 15 minutes).
  - Optional Multi-Factor Authentication (MFA) via TOTP or SMS for administrators.

### 1.2 Secure Session Management
- Issue unpredictable session tokens; store in an `HttpOnly`, `Secure`, and `SameSite=Strict` cookie.
- Enforce both idle (15 min) and absolute (12 h) timeouts. On logout, revoke tokens server-side.
- Protect against session fixation by regenerating session IDs on login.

### 1.3 Role-Based Access Control (RBAC)
- Define at least two roles: `admin` (cafe staff) and `customer` (public users).
- Perform server-side authorization checks on every endpoint:
  - `/dashboard/*`, order-management APIs → `admin` only.
  - `/api/orders` (placing orders) → authenticated or public, depending on design.
- Validate the tenant slug against the user’s allowed restaurants to prevent horizontal privilege escalation.

---

## 2. Input Handling & Output Encoding

### 2.1 Input Validation
- On every API and form handler (e.g., `/api/chat`, `/api/orders`):
  - Validate JSON schema using a library like **Zod** or **Yup**.
  - Enforce type, length, format (e.g., slug pattern `/^[a-z0-9-]+$/`).
  - Reject unknown or extra fields.

### 2.2 Prevent Injection Attacks
- Use **Drizzle ORM** prepared statements or parameterized queries—never string-concatenate SQL.
- Sanitize any dynamic file paths or command invocations (if used).

### 2.3 Output Encoding & XSS Mitigation
- In React components, rely on automatic JSX escaping. For any `dangerouslySetInnerHTML`, sanitize with **DOMPurify**.
- Implement a **Content Security Policy (CSP)** (see Section 6).

### 2.4 CSRF Protection
- For state-changing endpoints (e.g., `/api/orders`), require anti-CSRF tokens (Synchronizer Token Pattern) or use **SameSite** cookies combined with stateless CSRF tokens.

---

## 3. Data Protection & Privacy

### 3.1 Encryption in Transit & At Rest
- Enforce HTTPS/TLS 1.2+ for all inbound traffic. Redirect HTTP → HTTPS with **HSTS** header.
- Encrypt database storage at rest (e.g., AWS RDS encryption).

### 3.2 Secret Management
- Do **not** store API keys, DB passwords, or JWT secrets in source code or `.env` files in version control.
- Use a secrets management service (e.g., AWS Secrets Manager, HashiCorp Vault) and inject at runtime.

### 3.3 Sensitive Data Handling
- Mask or redact PII in logs (e.g., customer names, emails).
- Store only necessary PII. Enforce data retention and deletion policies per GDPR/CCPA.

---

## 4. API & Service Security

### 4.1 Endpoint Security
- Require authentication middleware on protected routes.
- Validate JWTs (if used) with proper signature algorithm (avoid `none`), check `exp` claim.

### 4.2 Rate Limiting & Throttling
- On `/api/chat` (Gemini usage) and `/api/auth`, enforce a rate limit (e.g., 50 requests per 5 minutes per IP or user) to prevent abuse.
- Return HTTP 429 on limit exceed.

### 4.3 CORS Configuration
- Restrict CORS to known origins (e.g., your frontend domains). Avoid wildcard (`*`).

### 4.4 API Versioning & Method Enforcement
- Prefix endpoints with `/api/v1/...` for future evolution.
- Use appropriate HTTP verbs: GET for reading, POST for creation, PUT/PATCH for updates, DELETE for removals.

---

## 5. Web Application Security Hygiene

### 5.1 Security Headers
- Content-Security-Policy: restrict scripts/styles to self and vetted CDNs; enable `frame-ancestors` iframes only from trusted domains.
- X-Frame-Options: `DENY` or `SAMEORIGIN`.
- X-Content-Type-Options: `nosniff`.
- Referrer-Policy: `strict-origin-when-cross-origin`.
- Strict-Transport-Security: `max-age=63072000; includeSubDomains; preload`.

### 5.2 Secure Cookies
- As noted above: `HttpOnly`, `Secure`, `SameSite=Strict`.

### 5.3 Third-Party Integrity
- When loading external scripts (e.g., shadcn/ui from CDN), use **Subresource Integrity (SRI)** hashes.

---

## 6. Infrastructure & Configuration Management

### 6.1 Docker & Environment
- Run containers with non-root users. Set restrictive file permissions (chmod 640) on volumes.
- Avoid mounting the host Docker socket inside application containers.

### 6.2 Server & Database Hardening
- Disable default or unused OS services.
- Limit exposed ports to only 80/443 (Next.js) and, if needed, the DB port on an internal network.
- Rotate administrative credentials regularly; remove all default passwords.

### 6.3 TLS Configuration
- Use modern cipher suites; disable SSLv3, TLS 1.0/1.1.

### 6.4 Continuous Patching
- Subscribe to security bulletins for Next.js, Node.js, Drizzle, and your Linux distribution.
- Automate OS and dependency updates in staging before production rollout.

---

## 7. Dependency Management

- Maintain lockfiles (`package-lock.json`) and commit them to version control.
- Perform regular scans with SCA tools (e.g., Snyk, Dependabot) to detect and remediate vulnerable packages.
- Remove unused libraries to minimize attack surface.
- Pin direct dependencies to specific, audited versions.

---

## 8. Monitoring, Logging & Incident Response

- Centralize logs (e.g., ELK stack) with secure transport and RBAC.
- Mask PII in logs; avoid logging raw request bodies containing sensitive data.
- Monitor unusual patterns: repeated 401s/429s, spike in `/api/chat` usage.
- Define an incident response plan: alert on critical thresholds, rotate secrets compromised in an incident, and maintain an audit trail.

---

## 9. Developer Guidelines & Secure Defaults

- Enforce pre-commit linters and formatters (ESLint, Prettier) with security plugins.
- Require code reviews with a focus on security for critical changes (auth, data access, AI prompt logic).
- Disable debug and verbose error messages in production. Expose only generic error responses to users.
- Integrate CI/CD security checks: static code analysis, SAST, secret scanning.

---

By integrating these security measures from design through deployment, the **ai-cafe-ordering-multitenant** application will achieve a robust, defense-in-depth posture, protecting both business and user data across all layers of the stack.