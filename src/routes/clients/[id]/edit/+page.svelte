<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import ClientForm from '$lib/components/client-form.svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleSuccess() {
		goto(`/clients/${data.client.id}`);
	}

	function handleCancel() {
		goto(`/clients/${data.client.id}`);
	}
</script>

<svelte:head>
	<title>Edit {data.client.name} - Clients - Invoi</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center space-x-4">
		<Button variant="ghost" size="sm" href="/clients/{data.client.id}">
			<ArrowLeft class="mr-2 h-4 w-4" />
			Back to Client
		</Button>
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Edit Client</h1>
			<p class="text-muted-foreground">Update {data.client.name}'s information</p>
		</div>
	</div>

	<ClientForm
		client={data.client}
		onclose={handleCancel}
		onsuccess={handleSuccess}
	/>
</div>