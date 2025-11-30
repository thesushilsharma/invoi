-- Add settings table
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT,
  company_email TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_website TEXT,
  company_logo TEXT,
  default_currency TEXT DEFAULT 'USD',
  default_tax_rate REAL DEFAULT 0,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_number_start REAL DEFAULT 1000,
  payment_terms_days REAL DEFAULT 30,
  email_notifications BOOLEAN DEFAULT true,
  reminder_days_before_due REAL DEFAULT 3,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
