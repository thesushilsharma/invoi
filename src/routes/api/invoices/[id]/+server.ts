import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, invoiceItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { invoiceSchema } from '$lib/schemas/invoice.js';
import type { z } from 'zod';
import {
	calculateItemTotal,
	calculateSubtotal,
	calculateTaxAmount,
	calculateTotal,
	getNextRecurringDate
} from '$lib/utils/calculations.js';

type InvoicePayload = z.infer<typeof invoiceSchema>;
type InvoiceItemPayload = InvoicePayload['items'][number];

function normalizeInvoiceItem(item: InvoiceItemPayload, invoiceTaxRate: number) {
	const lineSubtotal = calculateItemTotal(item.quantity, item.unitPrice);
	const vatPercentage = item.vatPercentage ?? invoiceTaxRate;
	const vatAmount = Math.round(lineSubtotal * (vatPercentage / 100) * 100) / 100;

	return {
		date: item.date ?? null,
		description: item.description,
		quantity: item.quantity,
		hours: item.hours ?? null,
		unitPrice: item.unitPrice,
		vatPercentage,
		vatAmount,
		total: lineSubtotal
	};
}

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [invoice] = await db.select().from(invoices).where(eq(invoices.id, params.id));

		if (!invoice) {
			return json({ error: 'Invoice not found' }, { status: 404 });
		}

		const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, params.id));

		return json({ invoice, items });
	} catch (error) {
		console.error('Failed to fetch invoice:', error);
		return json({ error: 'Failed to fetch invoice' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await db.delete(invoices).where(eq(invoices.id, params.id));
		return json({ success: true });
	} catch (error) {
		console.error('Failed to delete invoice:', error);
		return json({ error: 'Failed to delete invoice' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const data = await request.json();

		const [updatedInvoice] = await db
			.update(invoices)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(invoices.id, params.id))
			.returning();

		return json(updatedInvoice);
	} catch (error) {
		console.error('Failed to update invoice:', error);
		return json({ error: 'Failed to update invoice' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const data = await request.json();
		const result = invoiceSchema.safeParse(data);

		if (!result.success) {
			return json({ error: 'Invalid invoice data', details: result.error.issues }, { status: 400 });
		}

		const { items: newItems, ...invoiceData } = result.data;
		const itemsWithTotals = newItems.map((item) => normalizeInvoiceItem(item, invoiceData.taxRate));
		const subtotal = calculateSubtotal(itemsWithTotals);
		const taxAmount = calculateTaxAmount(subtotal, invoiceData.taxRate);
		const total = calculateTotal(subtotal, taxAmount);
		const totalQuantity =
			Math.round(itemsWithTotals.reduce((sum, item) => sum + item.quantity, 0) * 100) / 100;

		const updatedInvoice = await db.transaction(async (tx) => {
			const [invoice] = await tx
				.update(invoices)
				.set({
					...invoiceData,
					subtotal,
					taxAmount,
					total,
					totalQuantity,
					nextRecurringDate:
						invoiceData.isRecurring && invoiceData.recurringInterval
							? getNextRecurringDate(invoiceData.issueDate, invoiceData.recurringInterval)
							: null,
					updatedAt: new Date()
				})
				.where(eq(invoices.id, params.id))
				.returning();

			await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, params.id));

			await tx.insert(invoiceItems).values(
				itemsWithTotals.map((item) => ({
					invoiceId: params.id,
					...item
				}))
			);

			return invoice;
		});

		return json(updatedInvoice);
	} catch (error) {
		console.error('Failed to update invoice:', error);
		return json({ error: 'Failed to update invoice' }, { status: 500 });
	}
};
