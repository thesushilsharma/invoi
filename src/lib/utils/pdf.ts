import type { Invoice, InvoiceItem } from "$lib/server/db/schema"
import jsPDF from "jspdf"


export interface InvoiceData extends Invoice {
  items: InvoiceItem[]
}

export function generateInvoicePDF(invoice: InvoiceData): ArrayBuffer  {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("INVOICE", 20, 30)

  // Invoice details
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 50)
  doc.text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 20, 60)
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, 70)

  // Client details
  doc.setFont("helvetica", "bold")
  doc.text("Bill To:", 20, 90)
  doc.setFont("helvetica", "normal")
  doc.text(invoice.clientName, 20, 100)
  doc.text(invoice.clientEmail, 20, 110)

  const addressLines = invoice.clientAddress.split("\n")
  addressLines.forEach((line, index) => {
    doc.text(line, 20, 120 + index * 10)
  })

  // Items table
  const startY = 160
  doc.setFont("helvetica", "bold")
  doc.text("Description", 20, startY)
  doc.text("Qty", 120, startY)
  doc.text("Price", 140, startY)
  doc.text("Total", 170, startY)

  // Draw line under headers
  doc.line(20, startY + 5, 190, startY + 5)

  let currentY = startY + 15
  doc.setFont("helvetica", "normal")

  invoice.items.forEach((item) => {
    doc.text(item.description, 20, currentY)
    doc.text(item.quantity.toString(), 120, currentY)
    doc.text(`$${item.unitPrice.toFixed(2)}`, 140, currentY)
    doc.text(`$${item.total.toFixed(2)}`, 170, currentY)
    currentY += 10
  })

  // Totals
  currentY += 10
  doc.line(120, currentY, 190, currentY)
  currentY += 10

  doc.text(`Subtotal: $${invoice.subtotal.toFixed(2)}`, 120, currentY)
  currentY += 10
  doc.text(`Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}`, 120, currentY)
  currentY += 10
  doc.setFont("helvetica", "bold")
  doc.text(`Total: $${invoice.total.toFixed(2)}`, 120, currentY)

  // Notes
  if (invoice.notes) {
    currentY += 20
    doc.setFont("helvetica", "bold")
    doc.text("Notes:", 20, currentY)
    doc.setFont("helvetica", "normal")
    currentY += 10
    const noteLines = doc.splitTextToSize(invoice.notes, 170)
    doc.text(noteLines, 20, currentY)
  }

  return doc.output("arraybuffer") as ArrayBuffer 
}

export async function parsePDFInvoice(file: File): Promise<Partial<InvoiceData>> {
  // This is a simplified parser - in a real app you'd use a proper PDF parsing library
  // For now, we'll extract basic info from the filename and return a template
  const filename = file.name
  const invoiceNumber = filename.match(/INV-(\d+)/)?.[1] || "AUTO-" + Date.now()

  return {
    invoiceNumber,
    clientName: "Extracted Client",
    clientEmail: "client@example.com",
    clientAddress: "123 Main St\nCity, State 12345",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    subtotal: 0,
    taxRate: 10,
    taxAmount: 0,
    total: 0,
    status: "draft" as const,
    items: [],
  }
}
