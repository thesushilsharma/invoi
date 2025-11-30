-- Add new fields to invoices table
ALTER TABLE invoices ADD COLUMN client_trn TEXT;
ALTER TABLE invoices ADD COLUMN department TEXT;
ALTER TABLE invoices ADD COLUMN total_quantity REAL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN amount_in_words TEXT;

-- Add new fields to invoice_items table
ALTER TABLE invoice_items ADD COLUMN date TEXT;
ALTER TABLE invoice_items ADD COLUMN hours REAL;
ALTER TABLE invoice_items ADD COLUMN vat_percentage REAL DEFAULT 5;
ALTER TABLE invoice_items ADD COLUMN vat_amount REAL DEFAULT 0;

-- Add stamp and signature fields to settings table
ALTER TABLE settings ADD COLUMN company_stamp TEXT;
ALTER TABLE settings ADD COLUMN company_signature TEXT;
