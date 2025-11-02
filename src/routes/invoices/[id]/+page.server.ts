import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const invoice = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, params.id))
			.limit(1);

		if (!invoice.length) {
			throw error(404, 'Invoice not found');
		}

		return {
			invoice: invoice[0]
		};
	} catch (err) {
		console.error('Error loading invoice:', err);
		throw error(500, 'Failed to load invoice');
	}
};