<script lang="ts">
	let companyName = '';
	let companyEmail = '';
	let companyAddress = '';
	let currency = 'USD';
	let taxRate = 0;

	function saveSettings() {
		// TODO: Implement settings save functionality
		alert('Settings saved successfully!');
	}
</script>

<div class="container mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">Settings</h1>

	<div class="bg-white shadow rounded-lg p-6">
		<form on:submit|preventDefault={saveSettings} class="space-y-6">
			<div>
				<label for="companyName" class="block text-sm font-medium text-gray-700 mb-2">
					Company Name
				</label>
				<input
					type="text"
					id="companyName"
					bind:value={companyName}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="Your Company Name"
				/>
			</div>

			<div>
				<label for="companyEmail" class="block text-sm font-medium text-gray-700 mb-2">
					Company Email
				</label>
				<input
					type="email"
					id="companyEmail"
					bind:value={companyEmail}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="company@example.com"
				/>
			</div>

			<div>
				<label for="companyAddress" class="block text-sm font-medium text-gray-700 mb-2">
					Company Address
				</label>
				<textarea
					id="companyAddress"
					bind:value={companyAddress}
					rows="3"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="123 Business St, City, State 12345"
				></textarea>
			</div>

			<div>
				<label for="currency" class="block text-sm font-medium text-gray-700 mb-2">
					Default Currency
				</label>
				<select
					id="currency"
					bind:value={currency}
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="USD">USD - US Dollar</option>
					<option value="EUR">EUR - Euro</option>
					<option value="GBP">GBP - British Pound</option>
					<option value="CAD">CAD - Canadian Dollar</option>
				</select>
			</div>

			<div>
				<label for="taxRate" class="block text-sm font-medium text-gray-700 mb-2">
					Default Tax Rate (%)
				</label>
				<input
					type="number"
					id="taxRate"
					bind:value={taxRate}
					min="0"
					max="100"
					step="0.01"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder="0.00"
				/>
			</div>

			<div class="flex justify-end">
				<button
					type="submit"
					class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					Save Settings
				</button>
			</div>
		</form>
	</div>
</div>