<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from '$lib/components/ui/toast';

	let invoiceId = '';
	let amount = 0;
	let paymentMethod = 'bank_transfer';
	let paymentDate = new Date().toISOString().split('T')[0];
	let transactionId = '';
	let notes = '';

	async function recordPayment() {
		try {
			const response = await fetch('/api/payments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					invoiceId,
					amount,
					paymentMethod,
					paymentDate,
					transactionId,
					notes
				})
			});

			if (response.ok) {
				toast('Payment recorded successfully', 'success');
				goto('/payments');
			} else {
				const data = await response.json().catch(() => ({}));
				toast(data.error || 'Failed to record payment', 'error');
			}
		} catch (error) {
			console.error('Error recording payment:', error);
			toast('An unexpected error occurred', 'error');
		}
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="mb-6 text-3xl font-bold">Record Payment</h1>

	<div class="rounded-lg bg-white p-6 shadow">
		<form on:submit|preventDefault={recordPayment} class="space-y-6">
			<div>
				<label for="invoiceId" class="mb-2 block text-sm font-medium text-gray-700">
					Invoice ID
				</label>
				<input
					type="text"
					id="invoiceId"
					bind:value={invoiceId}
					required
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					placeholder="Enter invoice ID"
				/>
			</div>

			<div>
				<label for="amount" class="mb-2 block text-sm font-medium text-gray-700"> Amount </label>
				<input
					type="number"
					id="amount"
					bind:value={amount}
					required
					min="0"
					step="0.01"
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					placeholder="0.00"
				/>
			</div>

			<div>
				<label for="paymentMethod" class="mb-2 block text-sm font-medium text-gray-700">
					Payment Method
				</label>
				<select
					id="paymentMethod"
					bind:value={paymentMethod}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				>
					<option value="bank_transfer">Bank Transfer</option>
					<option value="credit_card">Credit Card</option>
					<option value="paypal">PayPal</option>
					<option value="check">Check</option>
					<option value="cash">Cash</option>
				</select>
			</div>

			<div>
				<label for="paymentDate" class="mb-2 block text-sm font-medium text-gray-700">
					Payment Date
				</label>
				<input
					type="date"
					id="paymentDate"
					bind:value={paymentDate}
					required
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="transactionId" class="mb-2 block text-sm font-medium text-gray-700">
					Transaction ID (Optional)
				</label>
				<input
					type="text"
					id="transactionId"
					bind:value={transactionId}
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					placeholder="Transaction reference"
				/>
			</div>

			<div>
				<label for="notes" class="mb-2 block text-sm font-medium text-gray-700">
					Notes (Optional)
				</label>
				<textarea
					id="notes"
					bind:value={notes}
					rows="3"
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					placeholder="Additional notes about the payment"
				></textarea>
			</div>

			<div class="flex justify-end space-x-4">
				<button
					type="button"
					on:click={() => goto('/payments')}
					class="rounded-md border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button type="submit" class="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
					Record Payment
				</button>
			</div>
		</form>
	</div>
</div>
