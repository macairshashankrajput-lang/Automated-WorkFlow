import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Columns use camelCase to match both database fields and generated types.
 */
export const userRoleEnum = pgEnum("user_role", ["customer", "vendor", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "pending"]);

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Supabase Auth ID (UUID string)
  openId: varchar("open_id", { length: 255 }).unique(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").default("customer").notNull(),
  status: userStatusEnum("status").default("active").notNull(),
  referralCode: varchar("referral_code", { length: 50 }).unique(),
  pointsBalance: integer("points_balance").default(0).notNull(),
  deliveryLocation: jsonb("delivery_location"), // { address: string, latitude: number, longitude: number }
  pushToken: text("push_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export const foodTypeEnum = pgEnum("food_type", ["veg", "non-veg"]);

export const menu = pgTable("menu", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  vendorId: varchar("vendor_id", { length: 255 }).references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  type: foodTypeEnum("type").default("veg"),
  price: integer("price").notNull(), // in paise/cents
  image: text("image"),
  ingredients: text("ingredients"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderTypeEnum = pgEnum("order_type", ["chakna", "tiffin", "catering"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "cooking", "out_for_delivery", "delivered", "cancelled"]);
export const deliveryTimeEnum = pgEnum("delivery_time", ["10m", "20m", "30m", "45m"]);

export const orders = pgTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(), // UserID_Timestamp format
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  vendorId: varchar("vendor_id", { length: 255 }).references(() => users.id),
  type: orderTypeEnum("type").notNull(),
  subtotal: integer("subtotal").default(0).notNull(),
  tax: integer("tax").default(0).notNull(),
  deliveryFee: integer("delivery_fee").default(0).notNull(),
  totalPrice: integer("total_price").notNull(),
  deliveryTime: deliveryTimeEnum("delivery_time"),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  receiptImage: text("receipt_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: varchar("order_id", { length: 255 }).references(() => orders.id).notNull(),
  menuId: integer("menu_id").references(() => menu.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  notes: text("notes"), // Added notes field as seen in checkout code
});

export const payments = pgTable("payments", {
  id: varchar("id", { length: 255 }).primaryKey(), // UserID_Timestamp_PAY
  orderId: varchar("order_id", { length: 255 }).references(() => orders.id).notNull(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  method: varchar("method", { length: 50 }).notNull(), // cod, upi, wallet
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  transactionId: varchar("transaction_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bills = pgTable("bills", {
  id: varchar("id", { length: 255 }).primaryKey(), // UserID_Timestamp_BILL
  orderId: varchar("order_id", { length: 255 }).references(() => orders.id).notNull(),
  billNumber: varchar("bill_number", { length: 100 }).unique().notNull(),
  details: jsonb("details"), // breakdown of items and taxes
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const cateringRequests = pgTable("catering_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  eventDate: timestamp("event_date").notNull(),
  guestCount: integer("guest_count").notNull(),
  location: text("location").notNull(),
  budget: integer("budget"),
  menuPreferences: text("menu_preferences"),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tiffinSubscriptions = pgTable("tiffin_subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  vendorId: varchar("vendor_id", { length: 255 }).references(() => users.id),
  frequency: integer("frequency").default(1).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalPoints: integer("total_points").notNull(),
  remainingPoints: integer("remaining_points").notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
});

export const mealTypeEnum = pgEnum("meal_type", ["breakfast", "lunch", "dinner"]);

export const tiffinShiftEnum = pgEnum("tiffin_shift", ["morning", "afternoon", "night"]);

export const tiffinSchedule = pgTable("tiffin_schedule", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  subscriptionId: integer("subscription_id").references(() => tiffinSubscriptions.id).notNull(),
  date: timestamp("date").notNull(),
  shift: tiffinShiftEnum("shift"),
  menuId: integer("menu_id").references(() => menu.id),
  editableUntil: timestamp("editable_until"),
  isChanged: boolean("is_changed").default(false),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
});

export const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  orderId: varchar("order_id", { length: 255 }).references(() => orders.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: varchar("user_id", { length: 255 }).references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("info"), // info, order, promo
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: varchar("id", { length: 255 }).primaryKey(),
  customerId: varchar("customer_id", { length: 255 }).references(() => users.id).notNull(),
  vendorId: varchar("vendor_id", { length: 255 }).references(() => users.id).notNull(),
  lastMessage: text("last_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chatId: varchar("chat_id", { length: 255 }).references(() => chats.id).notNull(),
  senderId: varchar("sender_id", { length: 255 }).references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Consolidated types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MenuItem = typeof menu.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type TiffinSubscription = typeof tiffinSubscriptions.$inferSelect;
export type TiffinSchedule = typeof tiffinSchedule.$inferSelect;
export type CateringRequest = typeof cateringRequests.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Bill = typeof bills.$inferSelect;
