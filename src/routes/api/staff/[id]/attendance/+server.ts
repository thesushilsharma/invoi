import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { attendance } from '$lib/server/db/schema';
import { getAttendanceForMonth } from '$lib/server/payroll';
import type { RequestHandler } from './$types';

function getDefaultMonth() {
	return new Date().toISOString().slice(0, 7);
}

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const month = url.searchParams.get('month') || getDefaultMonth();
		const result = await getAttendanceForMonth(params.id, month);
		return json(result);
	} catch (error) {
		console.error('Failed to fetch attendance:', error);
		return json({ error: 'Failed to fetch attendance' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const payload = await request.json();
		const date = payload.date;

		if (!date) {
			return json({ error: 'Attendance date is required' }, { status: 400 });
		}

		const [existing] = await db
			.select()
			.from(attendance)
			.where(and(eq(attendance.staffId, params.id), eq(attendance.date, date)));

		const values = {
			staffId: params.id,
			date,
			status: payload.status || 'present',
			checkIn: payload.checkIn || null,
			checkOut: payload.checkOut || null,
			hoursWorked: Number(payload.hoursWorked || 0),
			notes: payload.notes || null
		};

		const [record] = existing
			? await db.update(attendance).set(values).where(eq(attendance.id, existing.id)).returning()
			: await db.insert(attendance).values(values).returning();

		return json(record, { status: existing ? 200 : 201 });
	} catch (error) {
		console.error('Failed to save attendance:', error);
		return json({ error: 'Failed to save attendance' }, { status: 500 });
	}
};
