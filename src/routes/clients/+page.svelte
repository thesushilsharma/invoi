<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import ClientForm from '$lib/components/client-form.svelte';
	import { Users, Plus, Search, Mail, Phone, MapPin } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let showCreateForm = $state(false);
	let searchQuery = $state(data.search);

	function handleSearch() {
		const params = new URLSearchParams($page.url.searchParams);
		if (searchQuery) {
			params.set('search', searchQuery);
		} else {
			params.delete('search');
		}
		params.delete('page');
		goto(`?${params.toString()}`);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}
</script>

<svelte:head>
	<title>Clients - Invoi</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Clients</h1>
			<p class="text-muted-foreground">Manage your client information and contacts</p>
		</div>
		<Button onclick={() => showCreateForm = true}>
			<Plus class="mr-2 h-4 w-4" />
			Add Client
		</Button>
	</div>

	<!-- Search -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex gap-4">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						bind:value={searchQuery}
						onkeydown={handleKeydown}
						placeholder="Search clients..."
						class="pl-10"
					/>
				</div>
				<Button onclick={handleSearch}>Search</Button>
			</div>
		</CardContent>
	</Card>

	<!-- Stats -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Clients</CardTitle>
				<Users class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.pagination.total}</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Active Clients</CardTitle>
				<Users class="h-4 w-4 text-green-600" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-green-600">
					{data.clients.filter(c => c.isActive).length}
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Inactive Clients</CardTitle>
				<Users class="h-4 w-4 text-red-600" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-red-600">
					{data.clients.filter(c => !c.isActive).length}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Clients List -->
	<Card>
		<CardHeader>
			<CardTitle>All Clients</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each data.clients as client}
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="flex items-center space-x-4">
							<div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
								<Users class="h-6 w-6 text-blue-600" />
							</div>
							<div class="space-y-1">
								<div class="flex items-center gap-2">
									<h3 class="font-semibold">{client.name}</h3>
									<Badge variant={client.isActive ? 'default' : 'secondary'}>
										{client.isActive ? 'Active' : 'Inactive'}
									</Badge>
								</div>
								<div class="flex items-center gap-4 text-sm text-muted-foreground">
									{#if client.email}
										<div class="flex items-center gap-1">
											<Mail class="h-3 w-3" />
											{client.email}
										</div>
									{/if}
									{#if client.phone}
										<div class="flex items-center gap-1">
											<Phone class="h-3 w-3" />
											{client.phone}
										</div>
									{/if}
									{#if client.city}
										<div class="flex items-center gap-1">
											<MapPin class="h-3 w-3" />
											{client.city}
										</div>
									{/if}
								</div>
							</div>
						</div>

						<div class="flex items-center space-x-2">
							<Button variant="outline" size="sm" href="/clients/{client.id}">
								View
							</Button>
							<Button variant="outline" size="sm" href="/clients/{client.id}/edit">
								Edit
							</Button>
						</div>
					</div>
				{/each}

				{#if data.clients.length === 0}
					<div class="py-12 text-center">
						<Users class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
						<h3 class="mb-2 text-lg font-semibold">No clients found</h3>
						<p class="text-muted-foreground mb-4">
							{data.search ? 'No clients match your search criteria.' : 'Get started by adding your first client.'}
						</p>
						{#if !data.search}
							<Button onclick={() => showCreateForm = true}>
								<Plus class="mr-2 h-4 w-4" />
								Add Your First Client
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="flex justify-center space-x-2">
			{#each Array(data.pagination.totalPages) as _, i}
				<Button
					variant={data.pagination.page === i + 1 ? 'default' : 'outline'}
					size="sm"
					href="?page={i + 1}{data.search ? `&search=${data.search}` : ''}"
				>
					{i + 1}
				</Button>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Client Modal -->
{#if showCreateForm}
	<ClientForm
		onclose={() => showCreateForm = false}
		onsuccess={() => {
			showCreateForm = false;
			window.location.reload();
		}}
	/>
{/if}