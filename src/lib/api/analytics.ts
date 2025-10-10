import type { AnalyticsData, RevenueAnalytics, TrendAnalytics } from '$lib/server/analytics';

export class AnalyticsAPI {
	static async getAnalytics(startDate?: string, endDate?: string): Promise<AnalyticsData> {
		const params = new URLSearchParams();
		if (startDate) params.set('startDate', startDate);
		if (endDate) params.set('endDate', endDate);

		const response = await fetch(`/api/analytics?${params.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to fetch analytics data');
		}
		return response.json();
	}

	static async getRevenueAnalytics(startDate?: string, endDate?: string): Promise<RevenueAnalytics> {
		const params = new URLSearchParams();
		if (startDate) params.set('startDate', startDate);
		if (endDate) params.set('endDate', endDate);

		const response = await fetch(`/api/analytics/revenue?${params.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to fetch revenue analytics');
		}
		return response.json();
	}

	static async getTrends(startDate?: string, endDate?: string): Promise<TrendAnalytics> {
		const params = new URLSearchParams();
		if (startDate) params.set('startDate', startDate);
		if (endDate) params.set('endDate', endDate);

		const response = await fetch(`/api/analytics/trends?${params.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to fetch trends data');
		}
		return response.json();
	}

	static async exportAnalytics(startDate?: string, endDate?: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
		const params = new URLSearchParams();
		if (startDate) params.set('startDate', startDate);
		if (endDate) params.set('endDate', endDate);
		params.set('format', format);

		const response = await fetch(`/api/analytics/export?${params.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to export analytics data');
		}
		return response.blob();
	}
}