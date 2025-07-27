<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Plus, DollarSign, Calendar } from '@lucide/svelte';
	import type { Invoice, Payment } from '$lib/db/schema.js';
	import { paymentSchema, type PaymentFormData } from '$lib/schemas/invoice.js';

	let {
		invoice,
		payments = [],
		onAddPayment
	} = $props<{
		invoice: Invoice;
		payments: Payment[];
		onAddPayment: (payment: PaymentFormData) => Promise<void>;
	}>();

	let showPaymentForm = $state(false);
	let isSubmitting = $state(false);
	let errors = $state<Record<string, string>>({});

	let paymentForm = $state<PaymentFormData>({
		amount: 0,
		paymentDate: new Date().toISOString().split('T')[0],
		paymentMethod: '',
		transactionId: '',
		notes: ''
	});

	// Payment method options
	const paymentMethods = [
		{ value: 'cash', label: 'Cash' },
		{ value: 'check', label: 'Check' },
		{ value: 'credit card', label: 'Credit Card' },
		{ value: 'bank transfer', label: 'Bank Transfer' },
		{ value: 'paypal', label: 'PayPal' },
		{ value: 'other', label: 'Other' }
	];

	// Get the label for the selected payment method
	const selectedPaymentMethodLabel = $derived(
		paymentForm.paymentMethod 
			? paymentMethods.find(method => method.value === paymentForm.paymentMethod)?.label || paymentForm.paymentMethod
			: 'Select payment method'
	);

	const totalPaid = $derived(payments.reduce((sum, payment) => sum + payment.amount, 0));
	const remainingBalance = $derived(invoice.total - totalPaid);
	const paymentProgress = $derived((totalPaid / invoice.total) * 100);

	function resetForm() {
		paymentForm = {
			amount: remainingBalance > 0 ? remainingBalance : 0,
			paymentDate: new Date().toISOString().split('T')[0],
			paymentMethod: '',
			transactionId: '',
			notes: ''
		};
		errors = {};
	}

	async function handleAddPayment(event: Event) {
		event.preventDefault();
		try {
			isSubmitting = true;
			errors = {};

			const result = paymentSchema.safeParse(paymentForm);
			if (!result.success) {
				result.error.errors.forEach((error) => {
					errors[error.path.join('.')] = error.message;
				});
				return;
			}

			if (result.data.amount > remainingBalance) {
				errors.amount = 'Payment amount cannot exceed remaining balance';
				return;
			}

			await onAddPayment(result.data);
			showPaymentForm = false;
			resetForm();
		} catch (error) {
			console.error('Payment submission error:', error);
			errors.general = 'Failed to add payment. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	function getPaymentMethodColor(method: string) {
		switch (method.toLowerCase()) {
			case 'cash':
				return 'bg-green-100 text-green-800';
			case 'check':
				return 'bg-blue-100 text-blue-800';
			case 'credit card':
				return 'bg-purple-100 text-purple-800';
			case 'bank transfer':
				return 'bg-orange-100 text-orange-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div class="space-y-6">
	<!-- Payment Summary -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center justify-between">
				Payment Summary
				<Badge
					class={invoice.status === 'paid'
						? 'bg-green-100 text-green-800'
						: 'bg-yellow-100 text-yellow-800'}
				>
					{invoice.status}
				</Badge>
			</CardTitle>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div class="rounded-lg bg-blue-50 p-4 text-center">
					<DollarSign class="mx-auto mb-2 h-8 w-8 text-blue-600" />
					<p class="text-sm text-muted-foreground">Invoice Total</p>
					<p class="text-2xl font-bold">${invoice.total.toFixed(2)}</p>
				</div>

				<div class="rounded-lg bg-green-50 p-4 text-center">
					<DollarSign class="mx-auto mb-2 h-8 w-8 text-green-600" />
					<p class="text-sm text-muted-foreground">Total Paid</p>
					<p class="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
				</div>

				<div class="rounded-lg bg-orange-50 p-4 text-center">
					<DollarSign class="mx-auto mb-2 h-8 w-8 text-orange-600" />
					<p class="text-sm text-muted-foreground">Remaining</p>
					<p class="text-2xl font-bold text-orange-600">${remainingBalance.toFixed(2)}</p>
				</div>
			</div>

			<!-- Payment Progress -->
			<div class="space-y-2">
				<div class="flex justify-between text-sm">
					<span>Payment Progress</span>
					<span>{paymentProgress.toFixed(1)}%</span>
				</div>
				<div class="h-2 w-full rounded-full bg-gray-200">
					<div
						class="h-2 rounded-full bg-green-600 transition-all duration-300"
						style="width: {Math.min(paymentProgress, 100)}%"
					></div>
				</div>
			</div>

			{#if remainingBalance > 0}
				<Button
					onclick={() => {
						showPaymentForm = true;
						resetForm();
					}}
					class="w-full"
				>
					<Plus class="mr-2 h-4 w-4" />
					Add Payment
				</Button>
			{/if}
		</CardContent>
	</Card>

	<!-- Add Payment Form -->
	{#if showPaymentForm}
		<Card>
			<CardHeader>
				<CardTitle>Add Payment</CardTitle>
			</CardHeader>
			<CardContent>
				<form onsubmit={handleAddPayment} class="space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<Label for="amount">Payment Amount</Label>
							<Input
								id="amount"
								type="number"
								step="0.01"
								min="0.01"
								max={remainingBalance}
								bind:value={paymentForm.amount}
								class={errors.amount ? 'border-red-500' : ''}
							/>
							{#if errors.amount}
								<p class="mt-1 text-sm text-red-500">{errors.amount}</p>
							{/if}
						</div>

						<div>
							<Label for="paymentDate">Payment Date</Label>
							<Input
								id="paymentDate"
								type="date"
								bind:value={paymentForm.paymentDate}
								class={errors.paymentDate ? 'border-red-500' : ''}
							/>
							{#if errors.paymentDate}
								<p class="mt-1 text-sm text-red-500">{errors.paymentDate}</p>
							{/if}
						</div>

						<div>
							<Label for="paymentMethod">Payment Method</Label>
							<Select bind:value={paymentForm.paymentMethod}>
								<SelectTrigger class={errors.paymentMethod ? 'border-red-500' : ''}>
									{selectedPaymentMethodLabel}
								</SelectTrigger>
								<SelectContent>
									{#each paymentMethods as method}
										<SelectItem value={method.value}>{method.label}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
							{#if errors.paymentMethod}
								<p class="mt-1 text-sm text-red-500">{errors.paymentMethod}</p>
							{/if}
						</div>

						<div>
							<Label for="transactionId">Transaction ID (Optional)</Label>
							<Input
								id="transactionId"
								bind:value={paymentForm.transactionId}
								placeholder="Transaction reference"
							/>
						</div>
					</div>

					<div>
						<Label for="notes">Notes (Optional)</Label>
						<Textarea
							id="notes"
							bind:value={paymentForm.notes}
							placeholder="Additional payment notes..."
							rows={2}
						/>
					</div>

					{#if errors.general}
						<div class="rounded-md border border-red-200 bg-red-50 p-4">
							<p class="text-red-700">{errors.general}</p>
						</div>
					{/if}

					<div class="flex gap-4">
						<Button type="submit" disabled={isSubmitting} class="flex-1">
							{isSubmitting ? 'Adding...' : 'Add Payment'}
						</Button>
						<Button type="button" variant="outline" onclick={() => (showPaymentForm = false)}>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	{/if}

	<!-- Payment History -->
	<Card>
		<CardHeader>
			<CardTitle>Payment History</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each payments as payment}
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="flex items-center space-x-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
								<DollarSign class="h-5 w-5 text-green-600" />
							</div>
							<div>
								<p class="font-medium">${payment.amount.toFixed(2)}</p>
								<p class="text-sm text-muted-foreground">
									{new Date(payment.paymentDate).toLocaleDateString()}
								</p>
							</div>
						</div>

						<div class="flex items-center space-x-4">
							<div class="text-right">
								<Badge class={getPaymentMethodColor(payment.paymentMethod)}>
									{payment.paymentMethod}
								</Badge>
								{#if payment.transactionId}
									<p class="mt-1 text-xs text-muted-foreground">
										ID: {payment.transactionId}
									</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}

				{#if payments.length === 0}
					<div class="py-8 text-center text-muted-foreground">
						<Calendar class="mx-auto mb-4 h-12 w-12 opacity-50" />
						<p>No payments recorded</p>
						<p class="text-sm">Add the first payment to track progress</p>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>