import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { clients } from '$lib/server/db/schema';
import { eq, ilike, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const search = url.searchParams.get('search');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		let query = db.select().from(clients).orderBy(desc(clients.createdAt));

		if (search) {
			query = query.where(
				ilike(clients.name, `%${search}%`)
			);
		}

		const result = await query.limit(limit).offset(offset);

		return json({
			clients: result,
			total: result.length
		});
	} catch (error) {
		console.error('Error fetching clients:', error);
		return json({ error: 'Failed to fetch clients' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();

		const newClient = await db.insert(clients).values({
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
			isActive: data.isActive ?? true
		}).returning();

		return json(newClient[0], { status: 201 });
	} catch (error) {
		console.error('Error creating client:', error);
		return json({ error: 'Failed to create client' }, { status: 500 });
	}
};