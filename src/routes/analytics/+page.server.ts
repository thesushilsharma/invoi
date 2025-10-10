import { AnalyticsService } from '$lib/server/analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	try {
		const startDateParam = url.searchParams.get('startDate');
		const endDateParam = url.searchParams.get('endDate');

		const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), 0, 1);
		const endDate = endDateParam ? new Date(endDateParam) : new Date();

		const analyticsData = await AnalyticsService.getAnalyticsData(startDate, endDate);

		return {
			analytics: analyticsData,
			dateRange: {
				startDate: startDate.toISOString().split('T')[0],
				endDate: endDate.toISOString().split('T')[0]
			}
		};
	} catch (error) {
		console.error('Error loading analytics data:', error);
		return {
			analytics: null,
			dateRange: {
				startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
				endDate: new Date().toISOString().split('T')[0]
			},
			error: 'Failed to load analytics data'
		};
	}
};