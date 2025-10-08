import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  date,
  timestamp,
  integer,
  pgEnum,
  serial,
  real
} from "drizzle-orm/pg-core";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

export const recurringIntervalEnum = pgEnum("recurring_interval", [
  "monthly",
  "quarterly",
  "yearly",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "reminder",
  "overdue",
  "payment_received",
]);

// Enum for recurring interval
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientAddress: text("client_address").notNull(),
issueDate: timestamp("issue_date", { mode: "string" }).notNull(),
  dueDate: timestamp("due_date", { mode: "string" }).notNull(),
  subtotal: real("subtotal").notNull(),
  taxRate: real("tax_rate").notNull().default(0),
  taxAmount: real("tax_amount").notNull().default(0),
  total: real("total").notNull(),
  status: invoiceStatusEnum("status").notNull()
    .default("draft"),
  pdfData: text("pdf_data"),
  notes: text("notes"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringInterval: recurringIntervalEnum("recurring_interval"),
  nextRecurringDate: text("next_recurring_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const payments = pgTable("payments", {
  id:uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull(),
  transactionId: text("transaction_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),
})

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country"),
  taxId: text("tax_id"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
    sentAt: timestamp("sent_at", { mode: "string" }),
  scheduledFor: timestamp("scheduled_for", { mode: "string" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow().notNull(),

})

export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert
export type InvoiceItem = typeof invoiceItems.$inferSelect
export type NewInvoiceItem = typeof invoiceItems.$inferInsert
export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert



