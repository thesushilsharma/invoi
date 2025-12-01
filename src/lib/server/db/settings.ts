import { pgTable, uuid, text, real, boolean, timestamp } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
	id: uuid('id').primaryKey().defaultRandom(),
	companyName: text('company_name'),
	companyEmail: text('company_email'),
	companyAddress: text('company_address'),
	companyPhone: text('company_phone'),
	companyWebsite: text('company_website'),
	companyLogo: text('company_logo'),
	defaultCurrency: text('default_currency').default('USD'),
	defaultTaxRate: real('default_tax_rate').default(0),
	invoicePrefix: text('invoice_prefix').default('INV'),
	invoiceNumberStart: real('invoice_number_start').default(1000),
	paymentTermsDays: real('payment_terms_days').default(30),
	emailNotifications: boolean('email_notifications').default(true),
	reminderDaysBeforeDue: real('reminder_days_before_due').default(3),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
