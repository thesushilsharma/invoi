import { eq, and, lte } from "drizzle-orm"
import { getDaysOverdue } from "./calculations"
import { invoices, notifications } from "$lib/server/db/schema"
import { db } from "$lib/server/db/index"

export async function schedulePaymentReminder(invoiceId: string, daysBeforeDue = 3) {
  try {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId))

    if (!invoice) return

    const reminderDate = new Date(invoice.dueDate)
    reminderDate.setDate(reminderDate.getDate() - daysBeforeDue)

    await db.insert(notifications).values({
      invoiceId,
      type: "reminder",
      scheduledFor: reminderDate.toISOString(),
      message: `Payment reminder: Invoice ${invoice.invoiceNumber} is due in ${daysBeforeDue} days`,
    })
  } catch (error) {
    console.error("Failed to schedule payment reminder:", error)
  }
}

export async function checkOverdueInvoices() {
  try {
    const overdueInvoices = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.status, "sent"), lte(invoices.dueDate, new Date().toISOString().split("T")[0])))

    for (const invoice of overdueInvoices) {
      // Update invoice status to overdue
      await db
        .update(invoices)
        .set({ status: "overdue", updatedAt: new Date() })
        .where(eq(invoices.id, invoice.id))

      // Create overdue notification
      const daysOverdue = getDaysOverdue(invoice.dueDate)
      await db.insert(notifications).values({
        invoiceId: invoice.id,
        type: "overdue",
        scheduledFor: new Date().toISOString(),
        message: `Invoice ${invoice.invoiceNumber} is ${daysOverdue} days overdue`,
      })
    }

    return overdueInvoices.length
  } catch (error) {
    console.error("Failed to check overdue invoices:", error)
    return 0
  }
}

export async function processRecurringInvoices() {
  try {
    const today = new Date().toISOString().split("T")[0]

    const recurringInvoices = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.isRecurring, true), lte(invoices.nextRecurringDate, today)))

    for (const invoice of recurringInvoices) {
      if (!invoice.recurringInterval) continue

      // Create new invoice based on the recurring template
      const newInvoiceNumber = `${invoice.invoiceNumber}-R${Date.now().toString().slice(-4)}`
      const newIssueDate = today
      const newDueDate = new Date()
      newDueDate.setDate(newDueDate.getDate() + 30) // 30 days from now

      const [newInvoice] = await db
        .insert(invoices)
        .values({
          invoiceNumber: newInvoiceNumber,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          clientAddress: invoice.clientAddress,
          issueDate: newIssueDate,
          dueDate: newDueDate.toISOString().split("T")[0],
          subtotal: invoice.subtotal,
          taxRate: invoice.taxRate,
          taxAmount: invoice.taxAmount,
          total: invoice.total,
          status: "draft",
          notes: invoice.notes,
          isRecurring: true,
          recurringInterval: invoice.recurringInterval,
          nextRecurringDate: getNextRecurringDate(newIssueDate, invoice.recurringInterval),
        })
        .returning()

      // Update the original invoice's next recurring date
      await db
        .update(invoices)
        .set({
          nextRecurringDate: getNextRecurringDate(today, invoice.recurringInterval),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoice.id))
    }

    return recurringInvoices.length
  } catch (error) {
    console.error("Failed to process recurring invoices:", error)
    return 0
  }
}

function getNextRecurringDate(date: string, interval: "monthly" | "quarterly" | "yearly"): string {
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
