<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { X, Save, User } from '@lucide/svelte';
	import type { Client } from '$lib/server/db/schema';

	let {
		client = null,
		onclose,
		onsuccess
	} = $props<{
		client?: Client | null;
		onclose: () => void;
		onsuccess: () => void;
	}>();

	let formData = $state({
		name: client?.name || '',
		email: client?.email || '',
		phone: client?.phone || '',
		address: client?.address || '',
		city: client?.city || '',
		state: client?.state || '',
		zipCode: client?.zipCode || '',
		country: client?.country || '',
		taxId: client?.taxId || '',
		notes: client?.notes || '',
		isActive: client?.isActive ?? true
	});

	let isSubmitting = $state(false);
	let error = $state('');

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!formData.name || !formData.email) {
			error = 'Name and email are required';
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const url = client ? `/api/clients/${client.id}` : '/api/clients';
			const method = client ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to save client');
			}

			onsuccess();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<Card class="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
		<CardHeader class="flex flex-row items-center justify-between">
			<div class="flex items-center space-x-2">
				<User class="h-5 w-5" />
				<CardTitle>{client ? 'Edit Client' : 'Add New Client'}</CardTitle>
			</div>
			<Button variant="ghost" size="sm" onclick={onclose}>
				<X class="h-4 w-4" />
			</Button>
		</CardHeader>

		<CardContent class="space-y-6">
			{#if error}
				<div class="rounded-md bg-red-50 p-4 text-sm text-red-800">
					{error}
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Basic Information -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="name">Name *</Label>
						<Input
							id="name"
							bind:value={formData.name}
							placeholder="Client name"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="email">Email *</Label>
						<Input
							id="email"
							type="email"
							bind:value={formData.email}
							placeholder="client@example.com"
							required
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="phone">Phone</Label>
						<Input
							id="phone"
							bind:value={formData.phone}
							placeholder="+1 (555) 123-4567"
						/>
					</div>

					<div class="space-y-2">
						<Label for="taxId">Tax ID</Label>
						<Input
							id="taxId"
							bind:value={formData.taxId}
							placeholder="Tax identification number"
						/>
					</div>
				</div>

				<!-- Address Information -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold">Address Information</h3>
					
					<div class="space-y-2">
						<Label for="address">Address</Label>
						<Input
							id="address"
							bind:value={formData.address}
							placeholder="Street address"
						/>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div class="space-y-2">
							<Label for="city">City</Label>
							<Input
								id="city"
								bind:value={formData.city}
								placeholder="City"
							/>
						</div>

						<div class="space-y-2">
							<Label for="state">State/Province</Label>
							<Input
								id="state"
								bind:value={formData.state}
								placeholder="State or Province"
							/>
						</div>

						<div class="space-y-2">
							<Label for="zipCode">ZIP/Postal Code</Label>
							<Input
								id="zipCode"
								bind:value={formData.zipCode}
								placeholder="ZIP or Postal Code"
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="country">Country</Label>
						<Input
							id="country"
							bind:value={formData.country}
							placeholder="Country"
						/>
					</div>
				</div>

				<!-- Additional Information -->
				<div class="space-y-2">
					<Label for="notes">Notes</Label>
					<Textarea
						id="notes"
						bind:value={formData.notes}
						placeholder="Additional notes about this client..."
						rows={3}
					/>
				</div>

				<div class="flex items-center space-x-2">
					<input
						id="isActive"
						type="checkbox"
						bind:checked={formData.isActive}
						class="rounded border-gray-300"
					/>
					<Label for="isActive">Active client</Label>
				</div>

				<!-- Actions -->
				<div class="flex justify-end space-x-2 pt-4">
					<Button type="button" variant="outline" onclick={onclose}>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{#if isSubmitting}
							Saving...
						{:else}
							<Save class="mr-2 h-4 w-4" />
							{client ? 'Update Client' : 'Create Client'}
						{/if}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>