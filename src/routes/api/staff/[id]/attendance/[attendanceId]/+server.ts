import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { attendance } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const [deleted] = await db
			.delete(attendance)
			.where(eq(attendance.id, params.attendanceId))
			.returning();

		if (!deleted) {
			return json({ error: 'Attendance record not found' }, { status: 404 });
		}

		return json(deleted);
	} catch (error) {
		console.error('Failed to delete attendance:', error);
		return json({ error: 'Failed to delete attendance' }, { status: 500 });
	}
};
