<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import AnalyticsOverview from '$lib/components/analytics-overview.svelte';
	import TopClientsTable from '$lib/components/top-clients-table.svelte';
	import LineChart from '$lib/components/charts/line-chart.svelte';
	import BarChart from '$lib/components/charts/bar-chart.svelte';
	import DonutChart from '$lib/components/charts/donut-chart.svelte';
	import { BarChart3, Calendar, Download, RefreshCw } from '@lucide/svelte';
	import type { AnalyticsData } from '$lib/server/analytics';

	interface PageData {
		analytics: AnalyticsData | null;
		dateRange: {
			startDate: string;
			endDate: string;
		};
		error?: string;
	}

	let { data }: { data: PageData } = $props();
	let isRefreshing = $state(false);

	let dateRange = $state({
		startDate: data.dateRange.startDate,
		endDate: data.dateRange.endDate
	});

	async function handleDateRangeChange() {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('startDate', dateRange.startDate);
		params.set('endDate', dateRange.endDate);
		goto(`?${params.toString()}`);
	}

	async function refreshData() {
		isRefreshing = true;
		try {
			await handleDateRangeChange();
		} finally {
			isRefreshing = false;
		}
	}

	function setQuickRange(days: number) {
		const end = new Date();
		const start = new Date();
		start.setDate(start.getDate() - days);
		
		dateRange.startDate = start.toISOString().split('T')[0];
		dateRange.endDate = end.toISOString().split('T')[0];
		handleDateRangeChange();
	}

	async function exportData() {
		try {
			const params = new URLSearchParams();
			params.set('startDate', dateRange.startDate);
			params.set('endDate', dateRange.endDate);
			params.set('format', 'csv');

			const response = await fetch(`/api/analytics/export?${params.toString()}`);
			if (!response.ok) throw new Error('Export failed');

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `analytics-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Export failed:', error);
			alert('Failed to export data. Please try again.');
		}
	}
</script>

<svelte:head>
	<title>Analytics - Invoi</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
			<p class="text-muted-foreground">Comprehensive business insights and performance metrics</p>
		</div>
		<div class="flex space-x-2">
			<Button variant="outline" onclick={exportData}>
				<Download class="mr-2 h-4 w-4" />
				Export
			</Button>
			<Button variant="outline" onclick={refreshData} disabled={isRefreshing}>
				<RefreshCw class="mr-2 h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
				Refresh
			</Button>
		</div>
	</div>

	<!-- Date Range Controls -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex flex-wrap items-end gap-4">
				<div class="space-y-2">
					<Label for="startDate">Start Date</Label>
					<Input
						id="startDate"
						type="date"
						bind:value={dateRange.startDate}
						class="w-40"
					/>
				</div>
				<div class="space-y-2">
					<Label for="endDate">End Date</Label>
					<Input
						id="endDate"
						type="date"
						bind:value={dateRange.endDate}
						class="w-40"
					/>
				</div>
				<Button onclick={handleDateRangeChange}>
					<Calendar class="mr-2 h-4 w-4" />
					Apply Range
				</Button>
				
				<!-- Quick Range Buttons -->
				<div class="flex space-x-2 ml-4">
					<Button variant="outline" size="sm" onclick={() => setQuickRange(7)}>
						Last 7 days
					</Button>
					<Button variant="outline" size="sm" onclick={() => setQuickRange(30)}>
						Last 30 days
					</Button>
					<Button variant="outline" size="sm" onclick={() => setQuickRange(90)}>
						Last 90 days
					</Button>
					<Button variant="outline" size="sm" onclick={() => setQuickRange(365)}>
						Last year
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>

	{#if data.error}
		<Card>
			<CardContent class="pt-6">
				<div class="text-center py-8">
					<BarChart3 class="mx-auto mb-4 h-12 w-12 text-red-500 opacity-50" />
					<h3 class="text-lg font-semibold text-red-600 mb-2">Error Loading Analytics</h3>
					<p class="text-muted-foreground">{data.error}</p>
					<Button class="mt-4" onclick={refreshData}>
						<RefreshCw class="mr-2 h-4 w-4" />
						Try Again
					</Button>
				</div>
			</CardContent>
		</Card>
	{:else if data.analytics}
		<!-- Overview Cards -->
		<AnalyticsOverview analytics={data.analytics} />

		<!-- Charts Section -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Revenue Trend -->
			<Card>
				<CardHeader>
					<CardTitle>Revenue Trend</CardTitle>
				</CardHeader>
				<CardContent>
					<LineChart
						data={data.analytics.revenue.monthlyRevenueData}
						title=""
						color="#10b981"
						height={300}
					/>
				</CardContent>
			</Card>

			<!-- Invoice Status Distribution -->
			<Card>
				<CardHeader>
					<CardTitle>Invoice Status Distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<DonutChart
						data={data.analytics.invoices.invoiceStatusDistribution}
						title=""
						size={300}
					/>
				</CardContent>
			</Card>
		</div>

		<!-- Additional Charts -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Monthly Invoice Status -->
			<Card>
				<CardHeader>
					<CardTitle>Invoice Status by Month</CardTitle>
				</CardHeader>
				<CardContent>
					<BarChart
						data={data.analytics.invoices.invoiceStatusDistribution}
						title=""
						height={300}
					/>
				</CardContent>
			</Card>

			<!-- Payment Methods -->
			{#if data.analytics.payments.paymentMethods.length > 0}
				<Card>
					<CardHeader>
						<CardTitle>Payment Methods</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="space-y-4">
							{#each data.analytics.payments.paymentMethods as method}
								<div class="flex items-center justify-between">
									<span class="font-medium">{method.method}</span>
									<div class="text-right">
										<div class="font-bold">${method.totalAmount.toFixed(2)}</div>
										<div class="text-sm text-muted-foreground">{method.count} payments</div>
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			{:else}
				<Card>
					<CardHeader>
						<CardTitle>Payment Methods</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="py-8 text-center text-muted-foreground">
							<p>No payment data available</p>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>

		<!-- Top Clients -->
		<TopClientsTable clients={data.analytics.clients.topClients} />

		<!-- Performance Summary -->
		<Card>
			<CardHeader>
				<CardTitle>Performance Summary</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div class="text-center p-4 border rounded-lg">
						<div class="text-2xl font-bold text-green-600">
							{((data.analytics.invoices.paidInvoices / Math.max(data.analytics.invoices.totalInvoices, 1)) * 100).toFixed(1)}%
						</div>
						<p class="text-sm text-muted-foreground">Payment Success Rate</p>
					</div>
					<div class="text-center p-4 border rounded-lg">
						<div class="text-2xl font-bold text-blue-600">
							${(data.analytics.revenue.totalRevenue / Math.max(data.analytics.clients.totalClients, 1)).toFixed(0)}
						</div>
						<p class="text-sm text-muted-foreground">Revenue per Client</p>
					</div>
					<div class="text-center p-4 border rounded-lg">
						<div class="text-2xl font-bold text-purple-600">
							{data.analytics.payments.averagePaymentTime}
						</div>
						<p class="text-sm text-muted-foreground">Avg Payment Days</p>
					</div>
				</div>
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="pt-6">
				<div class="text-center py-8">
					<BarChart3 class="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
					<h3 class="text-lg font-semibold mb-2">Loading Analytics...</h3>
					<p class="text-muted-foreground">Please wait while we gather your business insights</p>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>