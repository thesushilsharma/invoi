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

export const currencyEnum = pgEnum("currency", [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "CNY",
  "INR",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "revision_requested",
]);

export const templateTypeEnum = pgEnum("template_type", [
  "standard",
  "modern",
  "classic",
  "minimal",
  "custom",
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
  currency: currencyEnum("currency").notNull().default("USD"),
  exchangeRate: real("exchange_rate").default(1),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  approvalStatus: approvalStatusEnum("approval_status").default("pending"),
  templateId: uuid("template_id"),
  pdfPath: text("pdf_path"),
  pdfData: text("pdf_data"),
  notes: text("notes"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurringInterval: recurringIntervalEnum("recurring_interval"),
  nextRecurringDate: text("next_recurring_date"),
  createdBy: text("created_by"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
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
export const invoiceTemplates = pgTable("invoice_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: templateTypeEnum("type").notNull().default("standard"),
  description: text("description"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#3b82f6"),
  secondaryColor: text("secondary_color").default("#64748b"),
  fontFamily: text("font_family").default("Inter"),
  headerTemplate: text("header_template"),
  footerTemplate: text("footer_template"),
  customCss: text("custom_css"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceApprovals = pgTable("invoice_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  approverEmail: text("approver_email").notNull(),
  status: approvalStatusEnum("status").notNull().default("pending"),
  comments: text("comments"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bulkInvoiceOperations = pgTable("bulk_invoice_operations", {
  id: uuid("id").primaryKey().defaultRandom(),
  operationType: text("operation_type").notNull(), // 'create', 'send', 'approve'
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  totalItems: integer("total_items").notNull(),
  processedItems: integer("processed_items").default(0),
  failedItems: integer("failed_items").default(0),
  errorLog: text("error_log"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const currencyRates = pgTable("currency_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromCurrency: currencyEnum("from_currency").notNull(),
  toCurrency: currencyEnum("to_currency").notNull(),
  rate: real("rate").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect
export type NewInvoiceTemplate = typeof invoiceTemplates.$inferInsert
export type InvoiceApproval = typeof invoiceApprovals.$inferSelect
export type NewInvoiceApproval = typeof invoiceApprovals.$inferInsert
export type BulkInvoiceOperation = typeof bulkInvoiceOperations.$inferSelect
export type NewBulkInvoiceOperation = typeof bulkInvoiceOperations.$inferInsert
export type CurrencyRate = typeof currencyRates.$inferSelect
export type NewCurrencyRate = typeof currencyRates.$inferInsert



