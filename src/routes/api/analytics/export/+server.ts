import { AnalyticsService } from '$lib/server/analytics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const startDateParam = url.searchParams.get('startDate');
		const endDateParam = url.searchParams.get('endDate');
		const format = url.searchParams.get('format') || 'csv';

		const startDate = startDateParam ? new Date(startDateParam) : new Date(new Date().getFullYear(), 0, 1);
		const endDate = endDateParam ? new Date(endDateParam) : new Date();

		const analyticsData = await AnalyticsService.getAnalyticsData(startDate, endDate);

		if (format === 'json') {
			return new Response(JSON.stringify(analyticsData, null, 2), {
				headers: {
					'Content-Type': 'application/json',
					'Content-Disposition': `attachment; filename="analytics-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.json"`
				}
			});
		}

		// CSV format
		const csvData = [
			// Header
			'Metric,Value,Period',
			// Revenue data
			`Total Revenue,${analyticsData.revenue.totalRevenue},All Time`,
			`Monthly Revenue,${analyticsData.revenue.monthlyRevenue},Current Month`,
			`Yearly Revenue,${analyticsData.revenue.yearlyRevenue},Current Year`,
			`Pending Revenue,${analyticsData.revenue.pendingRevenue},Current`,
			`Overdue Revenue,${analyticsData.revenue.overdueRevenue},Current`,
			`Revenue Growth,${analyticsData.revenue.revenueGrowth}%,Month over Month`,
			// Invoice data
			`Total Invoices,${analyticsData.invoices.totalInvoices},Period`,
			`Paid Invoices,${analyticsData.invoices.paidInvoices},Period`,
			`Pending Invoices,${analyticsData.invoices.pendingInvoices},Period`,
			`Overdue Invoices,${analyticsData.invoices.overdueInvoices},Period`,
			`Draft Invoices,${analyticsData.invoices.draftInvoices},Period`,
			`Average Invoice Value,${analyticsData.invoices.averageInvoiceValue},Period`,
			// Client data
			`Total Clients,${analyticsData.clients.totalClients},Current`,
			`Active Clients,${analyticsData.clients.activeClients},Current`,
			`New Clients This Month,${analyticsData.clients.newClientsThisMonth},Current Month`,
			`Client Growth,${analyticsData.clients.clientGrowth}%,Month over Month`,
			// Payment data
			`Total Payments,${analyticsData.payments.totalPayments},Period`,
			`Average Payment Time,${analyticsData.payments.averagePaymentTime} days,Period`
		].join('\n');

		return new Response(csvData, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': `attachment; filename="analytics-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`
			}
		});
	} catch (error) {
		console.error('Error exporting analytics data:', error);
		return new Response(JSON.stringify({ error: 'Failed to export analytics data' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};