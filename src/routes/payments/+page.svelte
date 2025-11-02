<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	const { payments } = data;
</script>

<div class="container mx-auto p-6">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Payments</h1>
		<a
			href="/payments/new"
			class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
		>
			Record Payment
		</a>
	</div>

	<div class="bg-white shadow rounded-lg overflow-hidden">
		{#if payments && payments.length > 0}
			<table class="min-w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Date
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Invoice
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Amount
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Method
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each payments as payment}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{new Date(payment.createdAt).toLocaleDateString()}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								<a href="/invoices/{payment.invoiceId}" class="text-blue-600 hover:underline">
									{payment.invoiceId}
								</a>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								${payment.amount.toFixed(2)}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{payment.paymentMethod}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
									Completed
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="p-6 text-center text-gray-500">
				No payments found. <a href="/payments/new" class="text-blue-600 hover:underline">Record your first payment</a>
			</div>
		{/if}
	</div>
</div>