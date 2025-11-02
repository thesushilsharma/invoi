<script lang="ts">
	import { goto } from '$app/navigation';

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
				goto('/payments');
			} else {
				alert('Failed to record payment');
			}
		} catch (error) {
			console.error('Error recording payment:', error);
			alert('Failed to record payment');
		}
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">Record Payment</h1>

	<div class="bg-white shadow rounded-lg p-6">
		<form on:submit|preventDefault={recordPayment} class="space-y-6">
			<div>
				<label for="invoiceId" class="block text-sm font-medium text-gray-700 mb-2">
					Invoice ID
				</label>
				<input
					type="text"
					id="invoiceId"
					bind:value={invoiceId}
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Enter invoice ID"
				/>
			</div>

			<div>
				<label for="amount" class="block text-sm font-medium text-gray-700 mb-2">
					Amount
				</label>
				<input
					type="number"
					id="amount"
					bind:value={amount}
					required
					min="0"
					step="0.01"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="0.00"
				/>
			</div>

			<div>
				<label for="paymentMethod" class="block text-sm font-medium text-gray-700 mb-2">
					Payment Method
				</label>
				<select
					id="paymentMethod"
					bind:value={paymentMethod}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="bank_transfer">Bank Transfer</option>
					<option value="credit_card">Credit Card</option>
					<option value="paypal">PayPal</option>
					<option value="check">Check</option>
					<option value="cash">Cash</option>
				</select>
			</div>

			<div>
				<label for="paymentDate" class="block text-sm font-medium text-gray-700 mb-2">
					Payment Date
				</label>
				<input
					type="date"
					id="paymentDate"
					bind:value={paymentDate}
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div>
				<label for="transactionId" class="block text-sm font-medium text-gray-700 mb-2">
					Transaction ID (Optional)
				</label>
				<input
					type="text"
					id="transactionId"
					bind:value={transactionId}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Transaction reference"
				/>
			</div>

			<div>
				<label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
					Notes (Optional)
				</label>
				<textarea
					id="notes"
					bind:value={notes}
					rows="3"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Additional notes about the payment"
				></textarea>
			</div>

			<div class="flex justify-end space-x-4">
				<button
					type="button"
					on:click={() => goto('/payments')}
					class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					Record Payment
				</button>
			</div>
		</form>
	</div>
</div>