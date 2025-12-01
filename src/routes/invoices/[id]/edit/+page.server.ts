import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, invoiceItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [invoice] = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, params.id))
			.limit(1);

		if (!invoice) {
			throw error(404, 'Invoice not found');
		}

		const items = await db
			.select()
			.from(invoiceItems)
			.where(eq(invoiceItems.invoiceId, params.id));

		return {
			invoice,
			items
		};
	} catch (err) {
		console.error('Error loading invoice for edit:', err);
		throw error(500, 'Failed to load invoice');
	}
};