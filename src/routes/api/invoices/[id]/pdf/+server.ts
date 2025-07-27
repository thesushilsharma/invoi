import { eq } from "drizzle-orm"
import { generateInvoicePDF } from "$lib/utils/pdf.js"
import { db } from "$lib/server/db"
import {invoices,invoiceItems } from "$lib/server/db/schema"

export async function GET({ params }) {
  try {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, params.id))

    if (!invoice) {
      return new Response("Invoice not found", { status: 404 })
    }

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, params.id))

    const pdfData = generateInvoicePDF({ ...invoice, items })

    return new Response(pdfData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    return new Response("Failed to generate PDF", { status: 500 })
  }
}
