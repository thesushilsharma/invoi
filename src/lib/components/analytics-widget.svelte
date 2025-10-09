<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import LineChart from '$lib/components/charts/line-chart.svelte';
	import { BarChart3, TrendingUp } from '@lucide/svelte';
	import type { MonthlyData } from '$lib/server/analytics';

	let {
		revenueData = [],
		totalRevenue = 0,
		monthlyGrowth = 0
	} = $props<{
		revenueData: MonthlyData[];
		totalRevenue: number;
		monthlyGrowth: number;
	}>();

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function formatPercentage(value: number): string {
		return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center justify-between">
			<span>Revenue Analytics</span>
			<Button variant="outline" size="sm" href="/analytics">
				<BarChart3 class="mr-2 h-4 w-4" />
				View Full Analytics
			</Button>
		</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="space-y-4">
			<!-- Quick Stats -->
			<div class="grid grid-cols-2 gap-4">
				<div>
					<div class="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
					<p class="text-sm text-muted-foreground">Total Revenue</p>
				</div>
				<div>
					<div class="flex items-center space-x-2">
						<TrendingUp class="h-4 w-4 {monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}" />
						<span class="text-lg font-bold {monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}">
							{formatPercentage(monthlyGrowth)}
						</span>
					</div>
					<p class="text-sm text-muted-foreground">Monthly Growth</p>
				</div>
			</div>

			<!-- Mini Chart -->
			{#if revenueData.length > 0}
				<div class="h-32">
					<LineChart
						data={revenueData.slice(-6)} 
						title=""
						color="#10b981"
						height={120}
						showGrid={false}
						showLabels={false}
					/>
				</div>
			{:else}
				<div class="h-32 flex items-center justify-center text-muted-foreground">
					<p class="text-sm">No revenue data available</p>
				</div>
			{/if}
		</div>
	</CardContent>
</Card>