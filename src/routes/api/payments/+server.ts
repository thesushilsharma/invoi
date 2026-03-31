import { db } from "$lib/server/db"
import { payments, invoices } from "$lib/server/db/schema"
import { json } from "@sveltejs/kit"
import { eq, or, sum } from "drizzle-orm"
import { paymentSchema } from "$lib/schemas/invoice.js"


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
    const { invoiceId, ...paymentData } = body
    const parsedPayment = paymentSchema.safeParse(paymentData)

    if (!invoiceId) {
      return json({ error: "Invoice id or invoice number is required" }, { status: 400 })
    }

    if (!parsedPayment.success) {
      return json({ error: "Invalid payment data", details: parsedPayment.error.issues }, { status: 400 })
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(or(eq(invoices.id, invoiceId), eq(invoices.invoiceNumber, invoiceId)))
      .limit(1)

    if (!invoice) {
      return json({ error: "Invoice not found" }, { status: 404 })
    }

    const paidSoFarResult = await db
      .select({ totalPaid: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.invoiceId, invoice.id))

    const paidSoFar = Number(paidSoFarResult[0]?.totalPaid || 0)
    const newTotalPaid = paidSoFar + parsedPayment.data.amount

    if (newTotalPaid > invoice.total) {
      return json({ error: "Payment amount exceeds invoice balance" }, { status: 400 })
    }

    const [newPayment] = await db.transaction(async (tx) => {
      const [createdPayment] = await tx.insert(payments).values({
        invoiceId: invoice.id,
        ...parsedPayment.data
      }).returning()

      const nextStatus = newTotalPaid >= invoice.total ? "paid" : invoice.status === "draft" ? "sent" : invoice.status

      await tx
        .update(invoices)
        .set({
          status: nextStatus,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoice.id))

      return [createdPayment]
    })

    return json(newPayment)
  } catch (error) {
    console.error("Failed to record payment:", error)
    return json({ error: "Failed to record payment" }, { status: 500 })
  }
}
