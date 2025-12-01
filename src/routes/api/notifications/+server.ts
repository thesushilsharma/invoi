import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { notifications } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const allNotifications = await db
			.select()
			.from(notifications)
			.orderBy(desc(notifications.createdAt))
			.limit(50);

		return json(allNotifications);
	} catch (error) {
		console.error('Failed to fetch notifications:', error);
		return json({ error: 'Failed to fetch notifications' }, { status: 500 });
	}
};
