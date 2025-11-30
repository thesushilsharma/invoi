-- Create enums
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
CREATE TYPE recurring_interval AS ENUM ('monthly', 'quarterly', 'yearly');
CREATE TYPE notification_type AS ENUM ('reminder', 'overdue', 'payment_received');
CREATE TYPE currency AS ENUM ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'revision_requested');
CREATE TYPE template_type AS ENUM ('standard', 'modern', 'classic', 'minimal', 'custom');

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  tax_id TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create invoice_templates table
CREATE TABLE invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type template_type NOT NULL DEFAULT 'standard',
  description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#64748b',
  font_family TEXT DEFAULT 'Inter',
  header_template TEXT,
  footer_template TEXT,
  custom_css TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_address TEXT NOT NULL,
  issue_date TIMESTAMP NOT NULL,
  due_date TIMESTAMP NOT NULL,
  subtotal REAL NOT NULL,
  tax_rate REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  currency currency NOT NULL DEFAULT 'USD',
  exchange_rate REAL DEFAULT 1,
  status invoice_status NOT NULL DEFAULT 'draft',
  approval_status approval_status DEFAULT 'pending',
  template_id UUID REFERENCES invoice_templates(id),
  pdf_path TEXT,
  pdf_data TEXT,
  notes TEXT,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval recurring_interval,
  next_recurring_date TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  sent_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create invoice_approvals table
CREATE TABLE invoice_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  approver_email TEXT NOT NULL,
  status approval_status NOT NULL DEFAULT 'pending',
  comments TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create bulk_invoice_operations table
CREATE TABLE bulk_invoice_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_items INTEGER NOT NULL,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  error_log TEXT,
  created_by TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create currency_rates table
CREATE TABLE currency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency currency NOT NULL,
  to_currency currency NOT NULL,
  rate REAL NOT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client_email ON invoices(client_email);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_notifications_invoice_id ON notifications(invoice_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_is_active ON clients(is_active);
