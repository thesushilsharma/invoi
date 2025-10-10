import { json } from '@sveltejs/kit';
import { AnalyticsService } from '$lib/server/analytics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const startDateParam = url.searchParams.get('startDate');
		const endDateParam = url.searchParams.get('endDate');

		const startDate = startDateParam ? new Date(startDateParam) : undefined;
		const endDate = endDateParam ? new Date(endDateParam) : undefined;

		const analyticsData = await AnalyticsService.getAnalyticsData(startDate, endDate);

		return json(analyticsData);
	} catch (error) {
		console.error('Error fetching analytics data:', error);
		return json({ error: 'Failed to fetch analytics data' }, { status: 500 });
	}
};