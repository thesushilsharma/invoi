import { db } from '$lib/server/db';
import { invoices, payments, clients } from '$lib/server/db/schema';
import { sql, eq, gte, lte, desc, asc, and, count, sum } from 'drizzle-orm';

export interface AnalyticsData {
	revenue: RevenueAnalytics;
	invoices: InvoiceAnalytics;
	clients: ClientAnalytics;
	payments: PaymentAnalytics;
	trends: TrendAnalytics;
}

export interface RevenueAnalytics {
	totalRevenue: number;
	monthlyRevenue: number;
	yearlyRevenue: number;
	pendingRevenue: number;
	overdueRevenue: number;
	revenueGrowth: number;
	monthlyRevenueData: MonthlyData[];
}

export interface InvoiceAnalytics {
	totalInvoices: number;
	paidInvoices: number;
	pendingInvoices: number;
	overdueInvoices: number;
	draftInvoices: number;
	averageInvoiceValue: number;
	invoiceStatusDistribution: StatusDistribution[];
}

export interface ClientAnalytics {
	totalClients: number;
	activeClients: number;
	newClientsThisMonth: number;
	topClients: TopClient[];
	clientGrowth: number;
}

export interface PaymentAnalytics {
	totalPayments: number;
	averagePaymentTime: number;
	paymentMethods: PaymentMethodData[];
	monthlyPayments: MonthlyData[];
}

export interface TrendAnalytics {
	revenueByMonth: MonthlyData[];
	invoicesByStatus: MonthlyStatusData[];
	clientAcquisition: MonthlyData[];
}

export interface MonthlyData {
	month: string;
	value: number;
	label?: string;
}

export interface StatusDistribution {
	status: string;
	count: number;
	percentage: number;
}

export interface TopClient {
	id: string;
	name: string;
	email: string;
	totalRevenue: number;
	invoiceCount: number;
	averageInvoiceValue: number;
}

export interface PaymentMethodData {
	method: string;
	count: number;
	totalAmount: number;
}

export interface MonthlyStatusData {
	month: string;
	paid: number;
	pending: number;
	overdue: number;
	draft: number;
}

export class AnalyticsService {
	static async getAnalyticsData(
		startDate?: Date,
		endDate?: Date
	): Promise<AnalyticsData> {
		const start = startDate || new Date(new Date().getFullYear(), 0, 1);
		const end = endDate || new Date();

		const [
			revenue,
			invoiceStats,
			clientStats,
			paymentStats,
			trends
		] = await Promise.all([
			this.getRevenueAnalytics(start, end),
			this.getInvoiceAnalytics(start, end),
			this.getClientAnalytics(start, end),
			this.getPaymentAnalytics(start, end),
			this.getTrendAnalytics(start, end)
		]);

		return {
			revenue,
			invoices: invoiceStats,
			clients: clientStats,
			payments: paymentStats,
			trends
		};
	}

	static async getRevenueAnalytics(startDate: Date, endDate: Date): Promise<RevenueAnalytics> {
		const currentMonth = new Date();
		const currentYear = new Date();
		const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

		// Total revenue from paid invoices
		const totalRevenueResult = await db
			.select({ total: sum(invoices.total) })
			.from(invoices)
			.where(eq(invoices.status, 'paid'));

		// Monthly revenue (current month)
		const monthlyRevenueResult = await db
			.select({ total: sum(invoices.total) })
			.from(invoices)
			.where(
				and(
					eq(invoices.status, 'paid'),
					gte(invoices.createdAt, new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString()),
					lte(invoices.createdAt, new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString())
				)
			);

		// Last month revenue for growth calculation
		const lastMonthRevenueResult = await db
			.select({ total: sum(invoices.total) })
			.from(invoices)
			.where(
				and(
					eq(invoices.status, 'paid'),
					gte(invoices.createdAt, new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString()),
					lte(invoices.createdAt, new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString())
				)
			);

		// Yearly revenue
		const yearlyRevenueResult = await db
			.select({ total: sum(invoices.total) })
			.from(invoices)
			.where(
				and(
					eq(invoices.status, 'paid'),
					gte(invoices.createdAt, new Date(currentYear.getFullYear(), 0, 1).toISOString())
				)
			);

		// Pending revenue
		const pendingRevenueResult = await db
			.select({ total: sum(invoices.total) })
			.from(invoices)
			.where(eq(invoices.status, 'sent'));

		// Overdue revenue
		const overdueRevenueResult = await db
			.select({ total: sum(invoices.total) })
			.from(invoices)
			.where(eq(invoices.status, 'overdue'));

		// Monthly revenue data for charts (last 12 months)
		const monthlyData = await this.getMonthlyRevenueData();

		const totalRevenue = Number(totalRevenueResult[0]?.total || 0);
		const monthlyRevenue = Number(monthlyRevenueResult[0]?.total || 0);
		const lastMonthRevenue = Number(lastMonthRevenueResult[0]?.total || 0);
		const revenueGrowth = lastMonthRevenue > 0 
			? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
			: 0;

		return {
			totalRevenue,
			monthlyRevenue,
			yearlyRevenue: Number(yearlyRevenueResult[0]?.total || 0),
			pendingRevenue: Number(pendingRevenueResult[0]?.total || 0),
			overdueRevenue: Number(overdueRevenueResult[0]?.total || 0),
			revenueGrowth,
			monthlyRevenueData: monthlyData
		};
	}

	static async getInvoiceAnalytics(startDate: Date, endDate: Date): Promise<InvoiceAnalytics> {
		// Get invoice counts by status
		const statusCounts = await db
			.select({
				status: invoices.status,
				count: count(invoices.id),
				total: sum(invoices.total)
			})
			.from(invoices)
			.where(
				and(
					gte(invoices.createdAt, startDate.toISOString()),
					lte(invoices.createdAt, endDate.toISOString())
				)
			)
			.groupBy(invoices.status);

		const totalInvoices = statusCounts.reduce((sum, item) => sum + item.count, 0);
		const totalValue = statusCounts.reduce((sum, item) => sum + Number(item.total || 0), 0);

		const statusDistribution: StatusDistribution[] = statusCounts.map(item => ({
			status: item.status,
			count: item.count,
			percentage: totalInvoices > 0 ? (item.count / totalInvoices) * 100 : 0
		}));

		return {
			totalInvoices,
			paidInvoices: statusCounts.find(s => s.status === 'paid')?.count || 0,
			pendingInvoices: statusCounts.find(s => s.status === 'sent')?.count || 0,
			overdueInvoices: statusCounts.find(s => s.status === 'overdue')?.count || 0,
			draftInvoices: statusCounts.find(s => s.status === 'draft')?.count || 0,
			averageInvoiceValue: totalInvoices > 0 ? totalValue / totalInvoices : 0,
			invoiceStatusDistribution: statusDistribution
		};
	}

	static async getClientAnalytics(startDate: Date, endDate: Date): Promise<ClientAnalytics> {
		// Total clients
		const totalClientsResult = await db
			.select({ count: count(clients.id) })
			.from(clients);

		// Active clients
		const activeClientsResult = await db
			.select({ count: count(clients.id) })
			.from(clients)
			.where(eq(clients.isActive, true));

		// New clients this month
		const currentMonth = new Date();
		const newClientsResult = await db
			.select({ count: count(clients.id) })
			.from(clients)
			.where(
				gte(clients.createdAt, new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1))
			);

		// Last month clients for growth
		const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
		const lastMonthClientsResult = await db
			.select({ count: count(clients.id) })
			.from(clients)
			.where(
				and(
					gte(clients.createdAt, lastMonth),
					lte(clients.createdAt, new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0))
				)
			);

		// Top clients by revenue
		const topClients = await this.getTopClients();

		const newClientsThisMonth = newClientsResult[0]?.count || 0;
		const lastMonthNewClients = lastMonthClientsResult[0]?.count || 0;
		const clientGrowth = lastMonthNewClients > 0 
			? ((newClientsThisMonth - lastMonthNewClients) / lastMonthNewClients) * 100 
			: 0;

		return {
			totalClients: totalClientsResult[0]?.count || 0,
			activeClients: activeClientsResult[0]?.count || 0,
			newClientsThisMonth,
			topClients,
			clientGrowth
		};
	}

	static async getPaymentAnalytics(startDate: Date, endDate: Date): Promise<PaymentAnalytics> {
		// Total payments
		const totalPaymentsResult = await db
			.select({ count: count(payments.id) })
			.from(payments)
			.where(
				and(
					gte(payments.createdAt, startDate.toISOString()),
					lte(payments.createdAt, endDate.toISOString())
				)
			);

		// Payment methods distribution
		const paymentMethodsResult = await db
			.select({
				method: payments.paymentMethod,
				count: count(payments.id),
				total: sum(payments.amount)
			})
			.from(payments)
			.where(
				and(
					gte(payments.createdAt, startDate.toISOString()),
					lte(payments.createdAt, endDate.toISOString())
				)
			)
			.groupBy(payments.paymentMethod);

		// Monthly payments data
		const monthlyPayments = await this.getMonthlyPaymentsData();

		// Calculate average payment time (simplified - would need more complex logic for real calculation)
		const averagePaymentTime = 15; // Placeholder - would calculate from invoice due date to payment date

		return {
			totalPayments: totalPaymentsResult[0]?.count || 0,
			averagePaymentTime,
			paymentMethods: paymentMethodsResult.map(pm => ({
				method: pm.method,
				count: pm.count,
				totalAmount: Number(pm.total || 0)
			})),
			monthlyPayments
		};
	}

	static async getTrendAnalytics(startDate: Date, endDate: Date): Promise<TrendAnalytics> {
		const [revenueByMonth, invoicesByStatus, clientAcquisition] = await Promise.all([
			this.getMonthlyRevenueData(),
			this.getMonthlyInvoiceStatusData(),
			this.getMonthlyClientData()
		]);

		return {
			revenueByMonth,
			invoicesByStatus,
			clientAcquisition
		};
	}

	private static async getMonthlyRevenueData(): Promise<MonthlyData[]> {
		const months = [];
		const currentDate = new Date();
		
		for (let i = 11; i >= 0; i--) {
			const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
			const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
			
			const result = await db
				.select({ total: sum(invoices.total) })
				.from(invoices)
				.where(
					and(
						eq(invoices.status, 'paid'),
						gte(invoices.createdAt, date.toISOString()),
						lte(invoices.createdAt, nextMonth.toISOString())
					)
				);

			months.push({
				month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
				value: Number(result[0]?.total || 0)
			});
		}

		return months;
	}

	private static async getTopClients(): Promise<TopClient[]> {
		const result = await db
			.select({
				id: clients.id,
				name: clients.name,
				email: clients.email,
				totalRevenue: sum(invoices.total),
				invoiceCount: count(invoices.id)
			})
			.from(clients)
			.leftJoin(invoices, eq(clients.email, invoices.clientEmail))
			.where(eq(invoices.status, 'paid'))
			.groupBy(clients.id, clients.name, clients.email)
			.orderBy(desc(sum(invoices.total)))
			.limit(10);

		return result.map(client => ({
			id: client.id,
			name: client.name,
			email: client.email,
			totalRevenue: Number(client.totalRevenue || 0),
			invoiceCount: client.invoiceCount,
			averageInvoiceValue: client.invoiceCount > 0 
				? Number(client.totalRevenue || 0) / client.invoiceCount 
				: 0
		}));
	}

	private static async getMonthlyPaymentsData(): Promise<MonthlyData[]> {
		const months = [];
		const currentDate = new Date();
		
		for (let i = 11; i >= 0; i--) {
			const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
			const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
			
			const result = await db
				.select({ total: sum(payments.amount) })
				.from(payments)
				.where(
					and(
						gte(payments.createdAt, date.toISOString()),
						lte(payments.createdAt, nextMonth.toISOString())
					)
				);

			months.push({
				month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
				value: Number(result[0]?.total || 0)
			});
		}

		return months;
	}

	private static async getMonthlyInvoiceStatusData(): Promise<MonthlyStatusData[]> {
		const months = [];
		const currentDate = new Date();
		
		for (let i = 11; i >= 0; i--) {
			const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
			const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
			
			const result = await db
				.select({
					status: invoices.status,
					count: count(invoices.id)
				})
				.from(invoices)
				.where(
					and(
						gte(invoices.createdAt, date.toISOString()),
						lte(invoices.createdAt, nextMonth.toISOString())
					)
				)
				.groupBy(invoices.status);

			const monthData: MonthlyStatusData = {
				month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
				paid: result.find(r => r.status === 'paid')?.count || 0,
				pending: result.find(r => r.status === 'sent')?.count || 0,
				overdue: result.find(r => r.status === 'overdue')?.count || 0,
				draft: result.find(r => r.status === 'draft')?.count || 0
			};

			months.push(monthData);
		}

		return months;
	}

	private static async getMonthlyClientData(): Promise<MonthlyData[]> {
		const months = [];
		const currentDate = new Date();
		
		for (let i = 11; i >= 0; i--) {
			const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
			const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
			
			const result = await db
				.select({ count: count(clients.id) })
				.from(clients)
				.where(
					and(
						gte(clients.createdAt, date),
						lte(clients.createdAt, nextMonth)
					)
				);

			months.push({
				month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
				value: result[0]?.count || 0
			});
		}

		return months;
	}
}