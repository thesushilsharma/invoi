import { db } from '$lib/server/db';
import { clients } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const client = await db.select().from(clients).where(eq(clients.id, params.id));
		
		if (!client.length) {
			throw error(404, 'Client not found');
		}

		return {
			client: client[0]
		};
	} catch (err) {
		console.error('Error loading client:', err);
		throw error(500, 'Failed to load client');
	}
};