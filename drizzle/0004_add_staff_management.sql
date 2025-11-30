-- Create enums
CREATE TYPE staff_status AS ENUM ('active', 'on_leave', 'terminated', 'suspended');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'half_day', 'late', 'on_leave');
CREATE TYPE leave_type AS ENUM ('sick', 'annual', 'unpaid', 'emergency');

-- Create staff table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  date_of_birth TEXT,
  nationality TEXT,
  
  emirates_id TEXT,
  emirates_id_expiry TEXT,
  visa_number TEXT,
  visa_expiry TEXT,
  passport_number TEXT,
  passport_expiry TEXT,
  
  position TEXT NOT NULL,
  department TEXT,
  join_date TEXT NOT NULL,
  basic_salary REAL NOT NULL,
  allowances REAL DEFAULT 0,
  
  bank_name TEXT,
  account_number TEXT,
  iban TEXT,
  
  status staff_status NOT NULL DEFAULT 'active',
  address TEXT,
  signature TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  check_in TEXT,
  check_out TEXT,
  hours_worked REAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create payslips table
CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  
  basic_salary REAL NOT NULL,
  allowances REAL DEFAULT 0,
  overtime REAL DEFAULT 0,
  bonus REAL DEFAULT 0,
  
  tax_deduction REAL DEFAULT 0,
  other_deductions REAL DEFAULT 0,
  
  gross_salary REAL NOT NULL,
  net_salary REAL NOT NULL,
  
  working_days INTEGER NOT NULL,
  present_days INTEGER NOT NULL,
  absent_days INTEGER DEFAULT 0,
  
  is_paid BOOLEAN DEFAULT FALSE,
  paid_date TEXT,
  pdf_path TEXT,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create leaves table
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_staff_employee_id ON staff(employee_id);
CREATE INDEX idx_staff_status ON staff(status);
CREATE INDEX idx_attendance_staff_date ON attendance(staff_id, date);
CREATE INDEX idx_payslips_staff_month ON payslips(staff_id, month, year);
CREATE INDEX idx_leaves_staff ON leaves(staff_id);
