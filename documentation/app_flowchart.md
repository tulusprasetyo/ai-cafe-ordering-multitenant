flowchart TD
    A[Customer visits URL resto-slug] --> B[Fetch menu data with Drizzle]
    B --> C[Display menu and chat interface]
    C --> D[Customer asks question]
    D --> E[API chat route receives message and menu]
    E --> F[Vercel AI SDK calls Gemini]
    F --> G{AI decides to use a tool}
    G -->|searchMenu| H[searchMenu function executed]
    G -->|addToCart| I[addToCart function executed]
    H --> F
    I --> C
    F --> J[Stream AI response back to UI]
    J --> C
    C --> K[Customer adds items to cart]
    K --> L[Customer clicks Place Order]
    L --> M[API orders route receives cart data]
    M --> N[Persist order in PostgreSQL]
    N --> O[Order appears in Admin dashboard]
    P[Admin visits dashboard URL] --> Q[Admin authentication]
    Q --> R[Display order management interface]
    R --> O