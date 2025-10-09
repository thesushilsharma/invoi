<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		DollarSign, 
		FileText, 
		Users, 
		TrendingUp, 
		TrendingDown,
		Clock,
		AlertTriangle
	} from '@lucide/svelte';
	import type { AnalyticsData } from '$lib/server/analytics';

	let { analytics } = $props<{ analytics: AnalyticsData }>();

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatPercentage(value: number): string {
		return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
	}

	function getGrowthColor(growth: number): string {
		return growth >= 0 ? 'text-green-600' : 'text-red-600';
	}

	function getGrowthIcon(growth: number) {
		return growth >= 0 ? TrendingUp : TrendingDown;
	}
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
	<!-- Total Revenue -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
			<DollarSign class="h-4 w-4 text-muted-foreground" />
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{formatCurrency(analytics.revenue.totalRevenue)}</div>
			<div class="flex items-center space-x-2 text-xs text-muted-foreground">
				<span>Monthly: {formatCurrency(analytics.revenue.monthlyRevenue)}</span>
				{#if analytics.revenue.revenueGrowth !== 0}
					{@const GrowthIcon = getGrowthIcon(analytics.revenue.revenueGrowth)}
					<div class="flex items-center space-x-1 {getGrowthColor(analytics.revenue.revenueGrowth)}">
						<GrowthIcon class="h-3 w-3" />
						<span>{formatPercentage(analytics.revenue.revenueGrowth)}</span>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Pending Revenue -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Pending Revenue</CardTitle>
			<Clock class="h-4 w-4 text-muted-foreground" />
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold text-orange-600">
				{formatCurrency(analytics.revenue.pendingRevenue)}
			</div>
			<p class="text-xs text-muted-foreground">
				{analytics.invoices.pendingInvoices} pending invoices
			</p>
		</CardContent>
	</Card>

	<!-- Total Invoices -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Total Invoices</CardTitle>
			<FileText class="h-4 w-4 text-muted-foreground" />
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{analytics.invoices.totalInvoices}</div>
			<div class="flex items-center space-x-2 text-xs">
				<Badge variant="default" class="text-xs">
					{analytics.invoices.paidInvoices} Paid
				</Badge>
				{#if analytics.invoices.overdueInvoices > 0}
					<Badge variant="destructive" class="text-xs">
						{analytics.invoices.overdueInvoices} Overdue
					</Badge>
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Total Clients -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Total Clients</CardTitle>
			<Users class="h-4 w-4 text-muted-foreground" />
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{analytics.clients.totalClients}</div>
			<div class="flex items-center space-x-2 text-xs text-muted-foreground">
				<span>{analytics.clients.activeClients} active</span>
				{#if analytics.clients.clientGrowth !== 0}
					{@const GrowthIcon = getGrowthIcon(analytics.clients.clientGrowth)}
					<div class="flex items-center space-x-1 {getGrowthColor(analytics.clients.clientGrowth)}">
						<GrowthIcon class="h-3 w-3" />
						<span>{formatPercentage(analytics.clients.clientGrowth)}</span>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Average Invoice Value -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Avg Invoice Value</CardTitle>
			<DollarSign class="h-4 w-4 text-muted-foreground" />
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">
				{formatCurrency(analytics.invoices.averageInvoiceValue)}
			</div>
			<p class="text-xs text-muted-foreground">
				Per invoice average
			</p>
		</CardContent>
	</Card>

	<!-- Overdue Amount -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Overdue Amount</CardTitle>
			<AlertTriangle class="h-4 w-4 text-muted-foreground" />
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold text-red-600">
				{formatCurrency(analytics.revenue.overdueRevenue)}
			</div>
			<p class="text-xs text-muted-foreground">
				{analytics.invoices.overdueInvoices} overdue invoices
			</p>
		</CardContent>
	</Card>

	<!-- Payment Performance -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">Avg Payment Time</CardTitle>
			<Clock class="h-4 w-4 text-muted-foreground" />
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{analytics.payments.averagePaymentTime} days</div>
			<p class="text-xs text-muted-foreground">
				Average time to payment
			</p>
		</CardContent>
	</Card>

	<!-- New Clients This Month -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
			<CardTitle class="text-sm font-medium">New Clients</CardTitle>
			<Users class="h-4 w-4 text-muted-foreground" />
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold text-blue-600">
				{analytics.clients.newClientsThisMonth}
			</div>
			<p class="text-xs text-muted-foreground">
				This month
			</p>
		</CardContent>
	</Card>
</div>