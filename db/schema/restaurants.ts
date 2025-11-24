import {
  pgTable,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  varchar,
  pgEnum
} from "drizzle-orm/pg-core";

export const restaurantStatus = pgEnum("restaurant_status", ["active", "inactive", "suspended"]);
export const orderStatus = pgEnum("order_status", ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]);

export const restaurant = pgTable("restaurant", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  coverImage: text("cover_image"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  status: restaurantStatus("status").default("active").notNull(),
  settings: jsonb("settings").$type<{
    currency?: string;
    taxRate?: number;
    deliveryEnabled?: boolean;
    takeawayEnabled?: boolean;
    dineInEnabled?: boolean;
  }>(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const category = pgTable("category", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurant_id").notNull().references(() => restaurant.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const menuItem = pgTable("menu_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurant_id").notNull().references(() => restaurant.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => category.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  images: jsonb("images").$type<string[]>(),
  ingredients: text("ingredients"),
  allergens: text("allergens"),
  nutritionInfo: jsonb("nutrition_info").$type<{
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }>(),
  spicyLevel: integer("spicy_level").default(0), // 0-5 scale
  isVegetarian: boolean("is_vegetarian").default(false),
  isVegan: boolean("is_vegan").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isAvailable: boolean("is_available").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  preparationTime: integer("preparation_time"), // in minutes
  tags: jsonb("tags").$type<string[]>(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const order = pgTable("order", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  restaurantId: text("restaurant_id").notNull().references(() => restaurant.id, { onDelete: "cascade" }),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  tableNumber: text("table_number"),
  orderType: text("order_type").notNull(), // 'dine-in', 'takeaway', 'delivery'
  status: orderStatus("status").default("pending").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text("special_instructions"),
  estimatedTime: integer("estimated_time"), // in minutes
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const orderItem = pgTable("order_item", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => order.id, { onDelete: "cascade" }),
  menuItemId: text("menu_item_id").notNull().references(() => menuItem.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// Note: Indexes should be created using drizzle-kit's migration system
// For now, we'll rely on PostgreSQL's default indexing and can add custom indexes later