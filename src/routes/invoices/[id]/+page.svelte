<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	export let data: PageData;

	const { invoice } = data;

	function editInvoice() {
		goto(`/invoices/${invoice.id}/edit`);
	}

	function deleteInvoice() {
		if (confirm('Are you sure you want to delete this invoice?')) {
			// TODO: Implement delete functionality
			goto('/invoices');
		}
	}
</script>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Invoice #{invoice.number}</h1>
		<div class="flex gap-2">
			<button
				on:click={editInvoice}
				class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
			>
				Edit
			</button>
			<button
				on:click={deleteInvoice}
				class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
			>
				Delete
			</button>
		</div>
	</div>

	<div class="bg-white shadow rounded-lg p-6">
		<div class="grid grid-cols-2 gap-6 mb-6">
			<div>
				<h3 class="text-lg font-semibold mb-2">Invoice Details</h3>
				<p><strong>Status:</strong> {invoice.status}</p>
				<p><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
				<p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
				<p><strong>Total:</strong> ${invoice.total.toFixed(2)}</p>
			</div>
			<div>
				<h3 class="text-lg font-semibold mb-2">Client Information</h3>
				<p><strong>Email:</strong> {invoice.clientEmail}</p>
			</div>
		</div>

		{#if invoice.items && invoice.items.length > 0}
			<div>
				<h3 class="text-lg font-semibold mb-4">Items</h3>
				<div class="overflow-x-auto">
					<table class="min-w-full table-auto">
						<thead>
							<tr class="bg-gray-50">
								<th class="px-4 py-2 text-left">Description</th>
								<th class="px-4 py-2 text-right">Quantity</th>
								<th class="px-4 py-2 text-right">Rate</th>
								<th class="px-4 py-2 text-right">Amount</th>
							</tr>
						</thead>
						<tbody>
							{#each invoice.items as item}
								<tr>
									<td class="px-4 py-2">{item.description}</td>
									<td class="px-4 py-2 text-right">{item.quantity}</td>
									<td class="px-4 py-2 text-right">${item.rate.toFixed(2)}</td>
									<td class="px-4 py-2 text-right">${(item.quantity * item.rate).toFixed(2)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</div>