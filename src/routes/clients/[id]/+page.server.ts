import { db } from '$lib/server/db';
import { clients, invoices } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Get client details
		const client = await db.select().from(clients).where(eq(clients.id, params.id));
		
		if (!client.length) {
			throw error(404, 'Client not found');
		}

		// Get client's invoices
		const clientInvoices = await db
			.select()
			.from(invoices)
			.where(eq(invoices.clientEmail, client[0].email))
			.orderBy(desc(invoices.createdAt));

		return {
			client: client[0],
			invoices: clientInvoices
		};
	} catch (err) {
		console.error('Error loading client:', err);
		throw error(500, 'Failed to load client');
	}
};