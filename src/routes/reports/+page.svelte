<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { BarChart3, TrendingUp, DollarSign, FileText, Calendar } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Reports - Invoi</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Reports</h1>
		<p class="text-muted-foreground">Analyze your business performance and trends</p>
	</div>

	<!-- Coming Soon -->
	<Card>
		<CardContent class="pt-6">
			<div class="py-12 text-center">
				<BarChart3 class="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
				<h3 class="mb-2 text-xl font-semibold">Reports Coming Soon</h3>
				<p class="text-muted-foreground mb-6 max-w-md mx-auto">
					We're working on comprehensive reporting features including revenue analytics, 
					client insights, and payment trends.
				</p>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-2xl mx-auto">
					<div class="p-4 border rounded-lg">
						<TrendingUp class="h-8 w-8 mx-auto mb-2 text-blue-600" />
						<h4 class="font-medium">Revenue Trends</h4>
						<p class="text-sm text-muted-foreground">Monthly & yearly analysis</p>
					</div>
					<div class="p-4 border rounded-lg">
						<DollarSign class="h-8 w-8 mx-auto mb-2 text-green-600" />
						<h4 class="font-medium">Payment Analytics</h4>
						<p class="text-sm text-muted-foreground">Payment patterns & timing</p>
					</div>
					<div class="p-4 border rounded-lg">
						<FileText class="h-8 w-8 mx-auto mb-2 text-purple-600" />
						<h4 class="font-medium">Invoice Reports</h4>
						<p class="text-sm text-muted-foreground">Status & performance metrics</p>
					</div>
					<div class="p-4 border rounded-lg">
						<Calendar class="h-8 w-8 mx-auto mb-2 text-orange-600" />
						<h4 class="font-medium">Time Analysis</h4>
						<p class="text-sm text-muted-foreground">Seasonal trends & forecasts</p>
					</div>
				</div>
				<Button class="mt-6" href="/">
					Back to Dashboard
				</Button>
			</div>
		</CardContent>
	</Card>
</div>