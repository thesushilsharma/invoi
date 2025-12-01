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
  "AED",
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
  "CNY",
  "INR",
  "SAR",
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
  poNumber: text("po_number"),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientAddress: text("client_address").notNull(),
  clientTrn: text("client_trn"),
  department: text("department"),
  issueDate: timestamp("issue_date", { mode: "string" }).notNull(),
  dueDate: timestamp("due_date", { mode: "string" }).notNull(),
  subtotal: real("subtotal").notNull(),
  taxRate: real("tax_rate").notNull().default(5),
  taxAmount: real("tax_amount").notNull().default(0),
  total: real("total").notNull(),
  totalQuantity: real("total_quantity").default(0),
  amountInWords: text("amount_in_words"),
  currency: currencyEnum("currency").notNull().default("AED"),
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
  date: text("date"),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  hours: real("hours"),
  unitPrice: real("unit_price").notNull(),
  vatPercentage: real("vat_percentage").default(5),
  vatAmount: real("vat_amount").default(0),
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

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name"),
  companyEmail: text("company_email"),
  companyAddress: text("company_address"),
  companyPhone: text("company_phone"),
  companyWebsite: text("company_website"),
  companyLogo: text("company_logo"),
  companyStamp: text("company_stamp"),
  companySignature: text("company_signature"),
  companyCity: text("company_city").default("Dubai"),
  companyCountry: text("company_country").default("United Arab Emirates"),
  companyTaxId: text("company_tax_id"),
  defaultCurrency: text("default_currency").default("AED"),
  defaultTaxRate: real("default_tax_rate").default(5),
  invoicePrefix: text("invoice_prefix").default("INV"),
  invoiceNumberStart: real("invoice_number_start").default(1000),
  paymentTermsDays: real("payment_terms_days").default(30),
  emailNotifications: boolean("email_notifications").default(true),
  reminderDaysBeforeDue: real("reminder_days_before_due").default(3),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export type Settings = typeof settings.$inferSelect
export type NewSettings = typeof settings.$inferInsert

// Staff Management Tables
export const staffStatusEnum = pgEnum("staff_status", [
  "active",
  "on_leave",
  "terminated",
  "suspended",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "half_day",
  "late",
  "on_leave",
]);

export const leaveTypeEnum = pgEnum("leave_type", [
  "sick",
  "annual",
  "unpaid",
  "emergency",
]);

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: text("employee_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  nationality: text("nationality"),
  
  // Emirates ID & Visa Details
  emiratesId: text("emirates_id"),
  emiratesIdExpiry: text("emirates_id_expiry"),
  visaNumber: text("visa_number"),
  visaExpiry: text("visa_expiry"),
  passportNumber: text("passport_number"),
  passportExpiry: text("passport_expiry"),
  
  // Employment Details
  position: text("position").notNull(),
  department: text("department"),
  joinDate: text("join_date").notNull(),
  basicSalary: real("basic_salary").notNull(),
  allowances: real("allowances").default(0),
  
  // Bank Details
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  iban: text("iban"),
  
  // Status
  status: staffStatusEnum("status").notNull().default("active"),
  
  // Address
  address: text("address"),
  
  // Digital Signature
  signature: text("signature"),
  
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  status: attendanceStatusEnum("status").notNull().default("present"),
  checkIn: text("check_in"),
  checkOut: text("check_out"),
  hoursWorked: real("hours_worked").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const payslips = pgTable("payslips", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // Format: YYYY-MM
  year: integer("year").notNull(),
  
  // Earnings
  basicSalary: real("basic_salary").notNull(),
  allowances: real("allowances").default(0),
  overtime: real("overtime").default(0),
  bonus: real("bonus").default(0),
  
  // Deductions
  taxDeduction: real("tax_deduction").default(0),
  otherDeductions: real("other_deductions").default(0),
  
  // Totals
  grossSalary: real("gross_salary").notNull(),
  netSalary: real("net_salary").notNull(),
  
  // Working Days
  workingDays: integer("working_days").notNull(),
  presentDays: integer("present_days").notNull(),
  absentDays: integer("absent_days").default(0),
  
  // Status
  isPaid: boolean("is_paid").default(false),
  paidDate: text("paid_date"),
  
  // PDF
  pdfPath: text("pdf_path"),
  
  notes: text("notes"),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const leaves = pgTable("leaves", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffId: uuid("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", { mode: "string" }),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export type Staff = typeof staff.$inferSelect
export type NewStaff = typeof staff.$inferInsert
export type Attendance = typeof attendance.$inferSelect
export type NewAttendance = typeof attendance.$inferInsert
export type Payslip = typeof payslips.$inferSelect
export type NewPayslip = typeof payslips.$inferInsert
export type Leave = typeof leaves.$inferSelect
export type NewLeave = typeof leaves.$inferInsert



