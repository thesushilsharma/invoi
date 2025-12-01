import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { staff } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const allStaff = await db.select().from(staff).orderBy(staff.createdAt);
		return json(allStaff);
	} catch (error) {
		console.error('Failed to fetch staff:', error);
		return json({ error: 'Failed to fetch staff' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const [newStaff] = await db.insert(staff).values(data).returning();
		return json(newStaff);
	} catch (error) {
		console.error('Failed to create staff:', error);
		return json({ error: 'Failed to create staff' }, { status: 500 });
	}
};
