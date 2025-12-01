import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { clients } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const [client] = await db.select().from(clients).where(eq(clients.id, params.id));

		if (!client) {
			return json({ error: 'Client not found' }, { status: 404 });
		}

		return json(client);
	} catch (error) {
		console.error('Failed to fetch client:', error);
		return json({ error: 'Failed to fetch client' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await db.delete(clients).where(eq(clients.id, params.id));
		return json({ success: true });
	} catch (error) {
		console.error('Failed to delete client:', error);
		return json({ error: 'Failed to delete client' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const data = await request.json();

		const [updatedClient] = await db
			.update(clients)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(clients.id, params.id))
			.returning();

		return json(updatedClient);
	} catch (error) {
		console.error('Failed to update client:', error);
		return json({ error: 'Failed to update client' }, { status: 500 });
	}
};
