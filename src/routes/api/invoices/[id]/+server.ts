import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, invoiceItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

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
		const { items: newItems, ...invoiceData } = data;

		// Update invoice
		const [updatedInvoice] = await db
			.update(invoices)
			.set({ 
				...invoiceData, 
				updatedAt: new Date().toISOString() 
			})
			.where(eq(invoices.id, params.id))
			.returning();

		// Delete existing items
		await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, params.id));

		// Insert new items
		if (newItems && newItems.length > 0) {
			await db.insert(invoiceItems).values(
				newItems.map((item: any) => ({
					invoiceId: params.id,
					date: item.date,
					description: item.description,
					quantity: item.quantity,
					hours: item.hours,
					unitPrice: item.unitPrice,
					vatPercentage: item.vatPercentage,
					vatAmount: item.vatAmount,
					total: item.total
				}))
			);
		}

		return json(updatedInvoice);
	} catch (error) {
		console.error('Failed to update invoice:', error);
		return json({ error: 'Failed to update invoice' }, { status: 500 });
	}
};
