<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Users, Mail, Phone, Plus } from '@lucide/svelte';
	import type { Client } from '$lib/server/db/schema';

	let {
		clients = [],
		showHeader = true,
		limit = 5
	} = $props<{
		clients: Client[];
		showHeader?: boolean;
		limit?: number;
	}>();

	const displayClients = $derived(clients.slice(0, limit));
</script>

<Card>
	{#if showHeader}
		<CardHeader>
			<CardTitle class="flex items-center justify-between">
				<span>Recent Clients</span>
				<Button variant="outline" size="sm" href="/clients">
					View All
				</Button>
			</CardTitle>
		</CardHeader>
	{/if}
	
	<CardContent class={showHeader ? '' : 'pt-6'}>
		<div class="space-y-4">
			{#each displayClients as client}
				<div class="flex items-center justify-between rounded-lg border p-3">
					<div class="flex items-center space-x-3">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
							<Users class="h-4 w-4 text-blue-600" />
						</div>
						<div>
							<p class="font-medium text-sm">{client.name}</p>
							<div class="flex items-center space-x-2 text-xs text-muted-foreground">
								<Mail class="h-3 w-3" />
								<span>{client.email}</span>
							</div>
						</div>
					</div>

					<div class="flex items-center space-x-2">
						<Badge variant={client.isActive ? 'default' : 'secondary'} class="text-xs">
							{client.isActive ? 'Active' : 'Inactive'}
						</Badge>
						<Button variant="ghost" size="sm" href="/clients/{client.id}">
							View
						</Button>
					</div>
				</div>
			{/each}

			{#if displayClients.length === 0}
				<div class="py-6 text-center text-muted-foreground">
					<Users class="mx-auto mb-3 h-8 w-8 opacity-50" />
					<p class="text-sm">No clients yet</p>
					<Button size="sm" class="mt-2" href="/clients">
						<Plus class="mr-2 h-3 w-3" />
						Add Client
					</Button>
				</div>
			{/if}
		</div>
	</CardContent>
</Card>