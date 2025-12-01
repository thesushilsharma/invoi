<script lang="ts">
	import EnhancedInvoiceForm from '$lib/components/enhanced-invoice-form-new.svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Prepare initial data with items
	const initialData = {
		...data.invoice,
		items: data.items.map(item => ({
			date: item.date || new Date().toISOString().split('T')[0],
			description: item.description,
			quantity: item.quantity,
			hours: item.hours || 0,
			unitPrice: item.unitPrice,
			vatPercentage: item.vatPercentage || 5,
			vatAmount: item.vatAmount || 0,
			total: item.total
		}))
	};

	async function handleSubmit(formData: any) {
		try {
			const response = await fetch(`/api/invoices/${data.invoice.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				goto(`/invoices/${data.invoice.id}`);
			} else {
				throw new Error('Failed to update invoice');
			}
		} catch (error) {
			console.error('Failed to update invoice:', error);
			alert('Failed to update invoice');
		}
	}
</script>

<svelte:head>
	<title>Edit Invoice - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Edit Invoice</h1>
		<p class="text-muted-foreground">Update invoice details</p>
	</div>

	<EnhancedInvoiceForm onSubmit={handleSubmit} initialData={initialData} />
</div>