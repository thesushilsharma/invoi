import type { InvoiceItem } from "$lib/server/db/schema"

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100
}

export function calculateSubtotal(items: InvoiceItem[]): number {
  return Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100
}

export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * (taxRate / 100) * 100) / 100
}

export function calculateTotal(subtotal: number, taxAmount: number): number {
  return Math.round((subtotal + taxAmount) * 100) / 100
}

export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const timestamp = Date.now().toString().slice(-4)
  return `INV-${year}${month}-${timestamp}`
}

export function getNextRecurringDate(date: string, interval: "monthly" | "quarterly" | "yearly"): string {
  const currentDate = new Date(date)

  switch (interval) {
    case "monthly":
      currentDate.setMonth(currentDate.getMonth() + 1)
      break
    case "quarterly":
      currentDate.setMonth(currentDate.getMonth() + 3)
      break
    case "yearly":
      currentDate.setFullYear(currentDate.getFullYear() + 1)
      break
  }

  return currentDate.toISOString().split("T")[0]
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = now.getTime() - due.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
