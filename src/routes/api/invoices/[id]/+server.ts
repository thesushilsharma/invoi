import { db } from "$lib/server/db"
import { invoiceItems, invoices } from "$lib/server/db/schema"
import { json } from "@sveltejs/kit"
import { eq } from "drizzle-orm"

export async function GET({ params }) {
  try {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, params.id))

    if (!invoice) {
      return json({ error: "Invoice not found" }, { status: 404 })
    }

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, params.id))

    return json({ ...invoice, items })
  } catch (error) {
    console.error("Failed to fetch invoice:", error)
    return json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}

export async function DELETE({ params }) {
  try {
    await db.delete(invoices).where(eq(invoices.id, params.id))
    return json({ success: true })
  } catch (error) {
    console.error("Failed to delete invoice:", error)
    return json({ error: "Failed to delete invoice" }, { status: 500 })
  }
}
