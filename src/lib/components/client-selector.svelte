<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Search, Users, Plus, Check } from '@lucide/svelte';
	import { ClientAPI } from '$lib/api/clients';
	import type { Client } from '$lib/server/db/schema';

	let {
		selectedClient = null,
		onselect,
		onclose
	} = $props<{
		selectedClient?: Client | null;
		onselect: (client: Client) => void;
		onclose?: () => void;
	}>();

	let searchQuery = $state('');
	let clients = $state<Client[]>([]);
	let isLoading = $state(false);
	let showResults = $state(false);

	async function searchClients() {
		if (!searchQuery.trim()) {
			clients = [];
			showResults = false;
			return;
		}

		isLoading = true;
		try {
			const result = await ClientAPI.getAll({ search: searchQuery, limit: 10 });
			clients = result.clients;
			showResults = true;
		} catch (error) {
			console.error('Error searching clients:', error);
			clients = [];
		} finally {
			isLoading = false;
		}
	}

	function handleSelect(client: Client) {
		onselect(client);
		searchQuery = client.name;
		showResults = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			searchClients();
		} else if (event.key === 'Escape') {
			showResults = false;
		}
	}

	// Search when query changes
	$effect(() => {
		if (searchQuery) {
			const timeoutId = setTimeout(searchClients, 300);
			return () => clearTimeout(timeoutId);
		} else {
			clients = [];
			showResults = false;
		}
	});
</script>

<div class="relative">
	<div class="relative">
		<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			bind:value={searchQuery}
			onkeydown={handleKeydown}
			onfocus={() => searchQuery && (showResults = true)}
			placeholder="Search clients or type to add new..."
			class="pl-10 pr-10"
		/>
		{#if selectedClient}
			<Check class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
		{/if}
	</div>

	{#if showResults && (clients.length > 0 || isLoading)}
		<Card class="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
			<CardContent class="p-2">
				{#if isLoading}
					<div class="p-4 text-center text-sm text-muted-foreground">
						Searching clients...
					</div>
				{:else}
					<div class="space-y-1">
						{#each clients as client}
							<button
								onclick={() => handleSelect(client)}
								class="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted text-left"
							>
								<div class="flex items-center space-x-3">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
										<Users class="h-4 w-4 text-blue-600" />
									</div>
									<div>
										<p class="font-medium text-sm">{client.name}</p>
										<p class="text-xs text-muted-foreground">{client.email}</p>
									</div>
								</div>
								<Badge variant={client.isActive ? 'default' : 'secondary'} class="text-xs">
									{client.isActive ? 'Active' : 'Inactive'}
								</Badge>
							</button>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}

	{#if showResults && !isLoading && clients.length === 0 && searchQuery.trim()}
		<Card class="absolute top-full left-0 right-0 z-50 mt-1">
			<CardContent class="p-4 text-center">
				<Users class="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
				<p class="text-sm text-muted-foreground mb-3">No clients found for "{searchQuery}"</p>
				<Button size="sm" href="/clients?prefill={encodeURIComponent(searchQuery)}">
					<Plus class="mr-2 h-3 w-3" />
					Add New Client
				</Button>
			</CardContent>
		</Card>
	{/if}
</div>

<!-- Backdrop to close dropdown -->
{#if showResults}
	<div 
		class="fixed inset-0 z-40" 
		onclick={() => showResults = false}
		onkeydown={(e) => e.key === 'Escape' && (showResults = false)}
		role="button"
		tabindex="-1"
		aria-label="Close dropdown"
	></div>
{/if}