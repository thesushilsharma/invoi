import { json } from '@sveltejs/kit';
import { AnalyticsService } from '$lib/server/analytics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const startDateParam = url.searchParams.get('startDate');
		const endDateParam = url.searchParams.get('endDate');

		const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), 0, 1);
		const endDate = endDateParam ? new Date(endDateParam) : new Date();

		const trendsData = await AnalyticsService.getTrendAnalytics(startDate, endDate);

		return json(trendsData);
	} catch (error) {
		console.error('Error fetching trends analytics:', error);
		return json({ error: 'Failed to fetch trends analytics' }, { status: 500 });
	}
};