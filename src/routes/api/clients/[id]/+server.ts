import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { clients } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const client = await db.select().from(clients).where(eq(clients.id, params.id));
		
		if (!client.length) {
			return json({ error: 'Client not found' }, { status: 404 });
		}

		return json(client[0]);
	} catch (error) {
		console.error('Error fetching client:', error);
		return json({ error: 'Failed to fetch client' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const data = await request.json();
		
		const updatedClient = await db.update(clients)
			.set({
				name: data.name,
				email: data.email,
				phone: data.phone,
				address: data.address,
				city: data.city,
				state: data.state,
				zipCode: data.zipCode,
				country: data.country,
				taxId: data.taxId,
				notes: data.notes,
				isActive: data.isActive,
				updatedAt: new Date()
			})
			.where(eq(clients.id, params.id))
			.returning();

		if (!updatedClient.length) {
			return json({ error: 'Client not found' }, { status: 404 });
		}

		return json(updatedClient[0]);
	} catch (error) {
		console.error('Error updating client:', error);
		return json({ error: 'Failed to update client' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const deletedClient = await db.delete(clients)
			.where(eq(clients.id, params.id))
			.returning();

		if (!deletedClient.length) {
			return json({ error: 'Client not found' }, { status: 404 });
		}

		return json({ message: 'Client deleted successfully' });
	} catch (error) {
		console.error('Error deleting client:', error);
		return json({ error: 'Failed to delete client' }, { status: 500 });
	}
};