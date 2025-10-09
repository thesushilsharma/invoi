<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, Mail, FileText, DollarSign } from '@lucide/svelte';
	import type { TopClient } from '$lib/server/analytics';

	let { clients = [] } = $props<{ clients: TopClient[] }>();

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center justify-between">
			<span>Top Clients by Revenue</span>
			<Button variant="outline" size="sm" href="/clients">
				View All Clients
			</Button>
		</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="space-y-4">
			{#each clients as client, index}
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div class="flex items-center space-x-4">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
							<span class="text-sm font-bold text-blue-600">#{index + 1}</span>
						</div>
						<div>
							<h3 class="font-semibold">{client.name}</h3>
							<div class="flex items-center space-x-2 text-sm text-muted-foreground">
								<Mail class="h-3 w-3" />
								<span>{client.email}</span>
							</div>
						</div>
					</div>

					<div class="text-right space-y-1">
						<div class="flex items-center space-x-2">
							<DollarSign class="h-4 w-4 text-green-600" />
							<span class="font-bold text-green-600">
								{formatCurrency(client.totalRevenue)}
							</span>
						</div>
						<div class="flex items-center space-x-4 text-xs text-muted-foreground">
							<div class="flex items-center space-x-1">
								<FileText class="h-3 w-3" />
								<span>{client.invoiceCount} invoices</span>
							</div>
							<div>
								Avg: {formatCurrency(client.averageInvoiceValue)}
							</div>
						</div>
					</div>

					<Button variant="outline" size="sm" href="/clients/{client.id}">
						View
					</Button>
				</div>
			{/each}

			{#if clients.length === 0}
				<div class="py-8 text-center text-muted-foreground">
					<Users class="mx-auto mb-4 h-12 w-12 opacity-50" />
					<p>No client data available</p>
					<p class="text-sm">Client revenue data will appear here once you have paid invoices</p>
				</div>
			{/if}
		</div>
	</CardContent>
</Card>