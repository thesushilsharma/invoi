import { json } from "@sveltejs/kit"
import { invoiceSchema } from "$lib/schemas/invoice.js"
import {
  calculateItemTotal,
  calculateSubtotal,
  calculateTaxAmount,
  calculateTotal,
  getNextRecurringDate,
} from "$lib/utils/calculations.js"
import { db } from "$lib/server/db"
import { invoiceItems, invoices } from "$lib/server/db/schema"

export async function GET() {
  try {
    const allInvoices = await db.select().from(invoices).orderBy(invoices.createdAt)
    return json(allInvoices)
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

export async function POST({ request }) {
  try {
    const data = await request.json()
    const result = invoiceSchema.safeParse(data)

    if (!result.success) {
      return json({ error: "Invalid invoice data", details: result.error.issues }, { status: 400 })
    }

    const { items, ...invoiceData } = result.data

    // Calculate totals
    const itemsWithTotals = items.map((item) => ({
      ...item,
      total: calculateItemTotal(item.quantity, item.unitPrice),
    }))

    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = calculateTaxAmount(subtotal, invoiceData.taxRate)
    const total = calculateTotal(subtotal, taxAmount)

    // Create invoice
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        ...invoiceData,
        subtotal,
        taxAmount,
        total,
        nextRecurringDate:
          invoiceData.isRecurring && invoiceData.recurringInterval
            ? getNextRecurringDate(invoiceData.issueDate, invoiceData.recurringInterval)
            : null,
      })
      .returning()

    // Create invoice items
    const newItems = await db
      .insert(invoiceItems)
      .values(
        itemsWithTotals.map((item) => ({
          ...item,
          invoiceId: newInvoice.id,
        })),
      )
      .returning()

    return json({ ...newInvoice, items: newItems })
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
