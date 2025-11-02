<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import TemplateSelector from './template-selector.svelte';
	import CurrencySelector from './currency-selector.svelte';
	import ClientSelector from './client-selector.svelte';
	import { 
		FileText, 
		Palette, 
		DollarSign, 
		Plus, 
		Trash2,
		Download,
		Send,
		Save,
		Eye
	} from '@lucide/svelte';
	import type { InvoiceTemplate, Client } from '$lib/server/db/schema';

	let {
		initialData = null,
		templates = [],
		onSubmit,
		onSaveDraft,
		onPreview
	} = $props<{
		initialData?: any;
		templates: InvoiceTemplate[];
		onSubmit: (data: any) => Promise<void>;
		onSaveDraft?: (data: any) => Promise<void>;
		onPreview?: (data: any) => void;
	}>();

	let formData = $state({
		invoiceNumber: initialData?.invoiceNumber || generateInvoiceNumber(),
		clientName: initialData?.clientName || '',
		clientEmail: initialData?.clientEmail || '',
		clientAddress: initialData?.clientAddress || '',
		issueDate: initialData?.issueDate || new Date().toISOString().split('T')[0],
		dueDate: initialData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		currency: initialData?.currency || 'USD',
		exchangeRate: initialData?.exchangeRate || 1,
		taxRate: initialData?.taxRate || 10,
		items: initialData?.items || [{ description: '', quantity: 1, unitPrice: 0 }],
		notes: initialData?.notes || '',
		templateId: initialData?.templateId || null,
		isRecurring: initialData?.isRecurring || false,
		recurringInterval: initialData?.recurringInterval || 'monthly'
	});

	let selectedTemplate = $state<InvoiceTemplate | null>(null);
	let selectedClient = $state<Client | null>(null);
	let showTemplateSelector = $state(false);
	let isSubmitting = $state(false);
	let errors = $state<Record<string, string>>({});

	// Calculated values
	const subtotal = $derived(
		formData.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
	);
	const taxAmount = $derived(subtotal * (formData.taxRate / 100));
	const total = $derived(subtotal + taxAmount);

	function generateInvoiceNumber(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
		return `INV-${year}${month}-${random}`;
	}

	function addItem() {
		formData.items.push({ description: '', quantity: 1, unitPrice: 0 });
	}

	function removeItem(index: number) {
		if (formData.items.length > 1) {
			formData.items.splice(index, 1);
		}
	}

	function handleClientSelect(client: Client) {
		selectedClient = client;
		formData.clientName = client.name;
		formData.clientEmail = client.email;
		formData.clientAddress = client.address || '';
	}

	function handleTemplateSelect(template: InvoiceTemplate) {
		selectedTemplate = template;
		formData.templateId = template.id;
		showTemplateSelector = false;
	}

	function handleCurrencyChange(currency: string) {
		formData.currency = currency;
		// In real app, fetch exchange rate here
	}

	async function handleSubmit(action: 'draft' | 'send' | 'preview') {
		errors = {};
		
		// Validation
		if (!formData.clientName) errors.clientName = 'Client name is required';
		if (!formData.clientEmail) errors.clientEmail = 'Client email is required';
		if (formData.items.some((item: any) => !item.description)) {
			errors.items = 'All items must have descriptions';
		}

		if (Object.keys(errors).length > 0) return;

		const invoiceData = {
			...formData,
			subtotal,
			taxAmount,
			total,
			status: action === 'draft' ? 'draft' : 'sent'
		};

		isSubmitting = true;
		try {
			if (action === 'preview' && onPreview) {
				onPreview(invoiceData);
			} else if (action === 'draft' && onSaveDraft) {
				await onSaveDraft(invoiceData);
			} else {
				await onSubmit(invoiceData);
			}
		} catch (error) {
			console.error('Error submitting invoice:', error);
			errors.general = 'Failed to save invoice. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}

	async function downloadPDF() {
		if (!formData.invoiceNumber) return;
		
		try {
			const response = await fetch(`/api/invoices/${formData.invoiceNumber}/pdf?download=true&template=${formData.templateId || ''}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `invoice-${formData.invoiceNumber}.pdf`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}
		} catch (error) {
			console.error('Error downloading PDF:', error);
		}
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-2xl font-bold">
				{initialData ? 'Edit Invoice' : 'Create New Invoice'}
			</h2>
			<p class="text-muted-foreground">
				{initialData ? 'Update invoice details' : 'Fill in the details to create a new invoice'}
			</p>
		</div>
		
		<div class="flex space-x-2">
			{#if selectedTemplate}
				<Badge variant="outline" class="flex items-center space-x-1">
					<Palette class="h-3 w-3" />
					<span>{selectedTemplate.name}</span>
				</Badge>
			{/if}
			<Button variant="outline" onclick={() => showTemplateSelector = true}>
				<Palette class="mr-2 h-4 w-4" />
				Template
			</Button>
		</div>
	</div>

	<!-- Template Selector Modal -->
	{#if showTemplateSelector}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg p-6">
				<TemplateSelector
					{templates}
					{selectedTemplate}
					onselect={handleTemplateSelect}
				/>
				<div class="flex justify-end mt-4">
					<Button variant="outline" onclick={() => showTemplateSelector = false}>
						Close
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<form class="space-y-6">
		<!-- Invoice Details -->
		<Card>
			<CardHeader>
				<CardTitle>Invoice Details</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div>
						<Label for="invoiceNumber">Invoice Number</Label>
						<Input
							id="invoiceNumber"
							bind:value={formData.invoiceNumber}
							class={errors.invoiceNumber ? 'border-red-500' : ''}
						/>
						{#if errors.invoiceNumber}
							<p class="text-sm text-red-500 mt-1">{errors.invoiceNumber}</p>
						{/if}
					</div>
					
					<div>
						<Label for="issueDate">Issue Date</Label>
						<Input
							id="issueDate"
							type="date"
							bind:value={formData.issueDate}
						/>
					</div>
					
					<div>
						<Label for="dueDate">Due Date</Label>
						<Input
							id="dueDate"
							type="date"
							bind:value={formData.dueDate}
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<Label>Currency</Label>
						<CurrencySelector 
							selectedCurrency={formData.currency}
							onchange={handleCurrencyChange}
							showExchangeRate={formData.currency !== 'USD'}
							baseCurrency="USD"
						/>
					</div>
					
					<div>
						<Label for="taxRate">Tax Rate (%)</Label>
						<Input
							id="taxRate"
							type="number"
							step="0.01"
							min="0"
							max="100"
							bind:value={formData.taxRate}
						/>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Client Information -->
		<Card>
			<CardHeader>
				<CardTitle>Client Information</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<Label>Select Client</Label>
					<ClientSelector
						selectedClient={selectedClient}
						onselect={handleClientSelect}
					/>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<Label for="clientName">Client Name</Label>
						<Input
							id="clientName"
							bind:value={formData.clientName}
							class={errors.clientName ? 'border-red-500' : ''}
						/>
						{#if errors.clientName}
							<p class="text-sm text-red-500 mt-1">{errors.clientName}</p>
						{/if}
					</div>
					
					<div>
						<Label for="clientEmail">Client Email</Label>
						<Input
							id="clientEmail"
							type="email"
							bind:value={formData.clientEmail}
							class={errors.clientEmail ? 'border-red-500' : ''}
						/>
						{#if errors.clientEmail}
							<p class="text-sm text-red-500 mt-1">{errors.clientEmail}</p>
						{/if}
					</div>
				</div>

				<div>
					<Label for="clientAddress">Client Address</Label>
					<Textarea
						id="clientAddress"
						bind:value={formData.clientAddress}
						rows={3}
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Invoice Items -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center justify-between">
					Invoice Items
					<Button type="button" variant="outline" size="sm" onclick={addItem}>
						<Plus class="w-4 h-4 mr-2" />
						Add Item
					</Button>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#each formData.items as item, index}
						<div class="grid grid-cols-1 gap-4 p-4 border rounded-lg md:grid-cols-5">
							<div class="md:col-span-2">
								<Label>Description</Label>
								<Input
									bind:value={item.description}
									placeholder="Item description"
								/>
							</div>
							
							<div>
								<Label>Quantity</Label>
								<Input
									type="number"
									step="0.01"
									min="0.01"
									bind:value={item.quantity}
								/>
							</div>
							
							<div>
								<Label>Unit Price ({formData.currency})</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									bind:value={item.unitPrice}
								/>
							</div>
							
							<div class="flex items-end gap-2">
								<div class="flex-1">
									<Label>Total</Label>
									<div class="h-10 px-3 py-2 border rounded-md bg-muted">
										{(item.quantity * item.unitPrice).toFixed(2)} {formData.currency}
									</div>
								</div>
								{#if formData.items.length > 1}
									<Button
										type="button"
										variant="outline"
										size="icon"
										onclick={() => removeItem(index)}
									>
										<Trash2 class="w-4 h-4" />
									</Button>
								{/if}
							</div>
						</div>
					{/each}

					{#if errors.items}
						<p class="text-sm text-red-500">{errors.items}</p>
					{/if}
				</div>

				<!-- Totals -->
				<div class="mt-6 space-y-2 text-right">
					<div class="flex justify-between">
						<span>Subtotal:</span>
						<span>{subtotal.toFixed(2)} {formData.currency}</span>
					</div>
					<div class="flex justify-between">
						<span>Tax ({formData.taxRate}%):</span>
						<span>{taxAmount.toFixed(2)} {formData.currency}</span>
					</div>
					<div class="flex justify-between text-lg font-bold border-t pt-2">
						<span>Total:</span>
						<span>{total.toFixed(2)} {formData.currency}</span>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Additional Options -->
		<Card>
			<CardHeader>
				<CardTitle>Additional Options</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div>
					<Label for="notes">Notes</Label>
					<Textarea
						id="notes"
						bind:value={formData.notes}
						placeholder="Additional notes or terms..."
						rows={3}
					/>
				</div>

				<div class="flex items-center space-x-2">
					<input
						id="isRecurring"
						type="checkbox"
						bind:checked={formData.isRecurring}
						class="rounded border-gray-300"
					/>
					<Label for="isRecurring">Make this a recurring invoice</Label>
				</div>

				{#if formData.isRecurring}
					<div>
						<Label for="recurringInterval">Recurring Interval</Label>
						<select bind:value={formData.recurringInterval} class="w-full p-2 border rounded">
							<option value="monthly">Monthly</option>
							<option value="quarterly">Quarterly</option>
							<option value="yearly">Yearly</option>
						</select>
					</div>
				{/if}
			</CardContent>
		</Card>

		{#if errors.general}
			<div class="p-4 bg-red-50 border border-red-200 rounded-md">
				<p class="text-red-700">{errors.general}</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex flex-wrap gap-4">
			<Button 
				type="button"
				onclick={() => handleSubmit('send')}
				disabled={isSubmitting}
				class="flex-1 md:flex-none"
			>
				<Send class="mr-2 h-4 w-4" />
				{isSubmitting ? 'Sending...' : 'Send Invoice'}
			</Button>
			
			{#if onSaveDraft}
				<Button 
					type="button"
					variant="outline"
					onclick={() => handleSubmit('draft')}
					disabled={isSubmitting}
				>
					<Save class="mr-2 h-4 w-4" />
					Save Draft
				</Button>
			{/if}
			
			{#if onPreview}
				<Button 
					type="button"
					variant="outline"
					onclick={() => handleSubmit('preview')}
				>
					<Eye class="mr-2 h-4 w-4" />
					Preview
				</Button>
			{/if}
			
			<Button 
				type="button"
				variant="outline"
				onclick={downloadPDF}
			>
				<Download class="mr-2 h-4 w-4" />
				Download PDF
			</Button>
		</div>
	</form>
</div>