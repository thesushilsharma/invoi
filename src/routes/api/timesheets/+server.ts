import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTeamTimesheetData } from '$lib/server/payroll';

function getDefaultMonth() {
	return new Date().toISOString().slice(0, 7);
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const month = url.searchParams.get('month') || getDefaultMonth();
		const data = await getTeamTimesheetData(month);
		return json(data);
	} catch (error) {
		console.error('Failed to fetch timesheets:', error);
		return json({ error: 'Failed to fetch timesheets' }, { status: 500 });
	}
};
