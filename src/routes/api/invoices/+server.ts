import { json } from "@sveltejs/kit"
import { invoiceSchema } from "$lib/schemas/invoice.js"
import type { z } from "zod"
import {
  calculateItemTotal,
  calculateSubtotal,
  calculateTaxAmount,
  calculateTotal,
  getNextRecurringDate,
} from "$lib/utils/calculations.js"
import { db } from "$lib/server/db"
import { invoiceItems, invoices } from "$lib/server/db/schema"

type InvoicePayload = z.infer<typeof invoiceSchema>
type InvoiceItemPayload = InvoicePayload["items"][number]

export async function GET() {
  try {
    const allInvoices = await db.select().from(invoices).orderBy(invoices.createdAt)
    return json(allInvoices)
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}

function normalizeInvoiceItem(item: InvoiceItemPayload, invoiceTaxRate: number) {
  const lineSubtotal = calculateItemTotal(item.quantity, item.unitPrice)
  const vatPercentage = item.vatPercentage ?? invoiceTaxRate
  const vatAmount = Math.round(lineSubtotal * (vatPercentage / 100) * 100) / 100

  return {
    date: item.date ?? null,
    description: item.description,
    quantity: item.quantity,
    hours: item.hours ?? null,
    unitPrice: item.unitPrice,
    vatPercentage,
    vatAmount,
    total: lineSubtotal,
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

    const itemsWithTotals = items.map((item) => normalizeInvoiceItem(item, invoiceData.taxRate))
    const subtotal = calculateSubtotal(itemsWithTotals)
    const taxAmount = calculateTaxAmount(subtotal, invoiceData.taxRate)
    const total = calculateTotal(subtotal, taxAmount)
    const totalQuantity = Math.round(itemsWithTotals.reduce((sum, item) => sum + item.quantity, 0) * 100) / 100

    const { newInvoice, newItems } = await db.transaction(async (tx) => {
      const [createdInvoice] = await tx
        .insert(invoices)
        .values({
          ...invoiceData,
          subtotal,
          taxAmount,
          total,
          totalQuantity,
          amountInWords: invoiceData.amountInWords ?? null,
          currency: invoiceData.currency ?? "AED",
          status: invoiceData.status ?? "draft",
          nextRecurringDate:
            invoiceData.isRecurring && invoiceData.recurringInterval
              ? getNextRecurringDate(invoiceData.issueDate, invoiceData.recurringInterval)
              : null,
        })
        .returning()

      const createdItems = await tx
        .insert(invoiceItems)
        .values(
          itemsWithTotals.map((item) => ({
            ...item,
            invoiceId: createdInvoice.id,
          })),
        )
        .returning()

      return { newInvoice: createdInvoice, newItems: createdItems }
    })

    return json({ ...newInvoice, items: newItems })
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
