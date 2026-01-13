import { db } from "$lib/server/db"
import { payments, invoices } from "$lib/server/db/schema"
import { json } from "@sveltejs/kit"
import { eq } from "drizzle-orm"


export async function GET() {
  try {
    const allPayments = await db.select().from(payments).orderBy(payments.createdAt)
    return json(allPayments)
  } catch (error) {
    console.error("Failed to fetch payments:", error)
    return json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json()
    const { invoiceId, amount, paymentMethod, paymentDate, transactionId, notes } = body

    // Find the invoice first to get the UUID
    // We assume the user might input the invoice number (e.g. "INV-001")
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceId))
      .limit(1)

    if (!invoice) {
      return json({ error: "Invoice not found" }, { status: 404 })
    }

    const [newPayment] = await db.insert(payments).values({
      invoiceId: invoice.id,
      amount,
      paymentMethod,
      paymentDate,
      transactionId,
      notes
    }).returning()

    return json(newPayment)
  } catch (error) {
    console.error("Failed to record payment:", error)
    return json({ error: "Failed to record payment" }, { status: 500 })
  }
}
