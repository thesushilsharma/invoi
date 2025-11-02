<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Progress } from '$lib/components/ui/progress';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		Upload, 
		FileText, 
		Download, 
		Plus, 
		Trash2, 
		AlertCircle,
		CheckCircle,
		Clock
	} from '@lucide/svelte';
	import CurrencySelector from './currency-selector.svelte';
	import type { BulkInvoiceData } from '$lib/server/bulk-operations';

	let {
		onclose,
		onsuccess
	} = $props<{
		onclose: () => void;
		onsuccess: (result: any) => void;
	}>();

	let mode = $state<'manual' | 'csv'>('manual');
	let isProcessing = $state(false);
	let progress = $state(0);
	let operationId = $state<string | null>(null);
	let results = $state<any>(null);

	// Manual entry data
	let invoicesData = $state<BulkInvoiceData[]>([
		{
			clientName: '',
			clientEmail: '',
			clientAddress: '',
			currency: 'USD',
			taxRate: 10,
			items: [{ description: '', quantity: 1, unitPrice: 0 }],
			notes: '',
			dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
		}
	]);

	// CSV data
	let csvFile = $state<File | null>(null);
	let csvData = $state('');

	function addInvoice() {
		invoicesData.push({
			clientName: '',
			clientEmail: '',
			clientAddress: '',
			currency: 'USD',
			taxRate: 10,
			items: [{ description: '', quantity: 1, unitPrice: 0 }],
			notes: '',
			dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
		});
	}

	function removeInvoice(index: number) {
		if (invoicesData.length > 1) {
			invoicesData.splice(index, 1);
		}
	}

	function addItem(invoiceIndex: number) {
		invoicesData[invoiceIndex].items.push({
			description: '',
			quantity: 1,
			unitPrice: 0
		});
	}

	function removeItem(invoiceIndex: number, itemIndex: number) {
		if (invoicesData[invoiceIndex].items.length > 1) {
			invoicesData[invoiceIndex].items.splice(itemIndex, 1);
		}
	}

	async function handleCSVUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			csvFile = file;
			const text = await file.text();
			csvData = text;
		}
	}

	async function processBulkInvoices() {
		isProcessing = true;
		progress = 0;
		results = null;

		try {
			let response;

			if (mode === 'csv' && csvData) {
				response = await fetch('/api/bulk-operations', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						operation: 'import_csv',
						data: csvData,
						options: {
							generatePDF: true,
							autoSend: false
						}
					})
				});
			} else {
				response = await fetch('/api/bulk-operations', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						operation: 'create_invoices',
						data: invoicesData,
						options: {
							generatePDF: true,
							autoSend: false
						}
					})
				});
			}

			if (!response.ok) {
				throw new Error('Failed to process bulk invoices');
			}

			const result = await response.json();
			operationId = result.operationId;

			// Poll for progress
			await pollProgress();

			results = result;
			onsuccess(result);
		} catch (error) {
			console.error('Error processing bulk invoices:', error);
			alert('Failed to process bulk invoices. Please try again.');
		} finally {
			isProcessing = false;
		}
	}

	async function pollProgress() {
		if (!operationId) return;

		const pollInterval = setInterval(async () => {
			try {
				const response = await fetch(`/api/bulk-operations/${operationId}`);
				const data = await response.json();
				
				if (data.operation) {
					const op = data.operation;
					progress = op.totalItems > 0 ? (op.processedItems / op.totalItems) * 100 : 0;

					if (op.status === 'completed' || op.status === 'failed') {
						clearInterval(pollInterval);
						isProcessing = false;
					}
				}
			} catch (error) {
				console.error('Error polling progress:', error);
				clearInterval(pollInterval);
			}
		}, 1000);
	}

	function downloadCSVTemplate() {
		const csvTemplate = [
			'clientName,clientEmail,clientAddress,currency,taxRate,itemDescription,quantity,unitPrice,notes,dueDate',
			'John Doe,john@example.com,"123 Main St, City, State",USD,10,"Web Development",1,1000,"Payment terms: Net 30",2024-02-15',
			'Jane Smith,jane@example.com,"456 Oak Ave, City, State",EUR,20,"Consulting Services",5,200,"Monthly retainer",2024-02-20'
		].join('\n');

		const blob = new Blob([csvTemplate], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'bulk-invoice-template.csv';
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	}
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<Card class="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
		<CardHeader>
			<CardTitle class="flex items-center justify-between">
				<span>Bulk Invoice Creator</span>
				<Button variant="ghost" size="sm" onclick={onclose}>×</Button>
			</CardTitle>
		</CardHeader>

		<CardContent class="space-y-6">
			{#if !isProcessing && !results}
				<!-- Mode Selection -->
				<div class="flex space-x-4">
					<Button 
						variant={mode === 'manual' ? 'default' : 'outline'}
						onclick={() => mode = 'manual'}
					>
						<Plus class="mr-2 h-4 w-4" />
						Manual Entry
					</Button>
					<Button 
						variant={mode === 'csv' ? 'default' : 'outline'}
						onclick={() => mode = 'csv'}
					>
						<Upload class="mr-2 h-4 w-4" />
						CSV Import
					</Button>
				</div>

				{#if mode === 'manual'}
					<!-- Manual Entry Mode -->
					<div class="space-y-4">
						{#each invoicesData as invoice, invoiceIndex}
							<Card>
								<CardHeader class="pb-3">
									<div class="flex items-center justify-between">
										<CardTitle class="text-base">Invoice {invoiceIndex + 1}</CardTitle>
										{#if invoicesData.length > 1}
											<Button 
												variant="ghost" 
												size="sm"
												onclick={() => removeInvoice(invoiceIndex)}
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										{/if}
									</div>
								</CardHeader>
								<CardContent class="space-y-4">
									<!-- Client Info -->
									<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
										<div>
											<Label>Client Name *</Label>
											<Input bind:value={invoice.clientName} placeholder="Client name" />
										</div>
										<div>
											<Label>Client Email *</Label>
											<Input bind:value={invoice.clientEmail} placeholder="client@example.com" />
										</div>
									</div>

									<div>
										<Label>Client Address</Label>
										<Textarea bind:value={invoice.clientAddress} placeholder="Client address" rows={2} />
									</div>

									<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
										<div>
											<Label>Currency</Label>
											<CurrencySelector 
												selectedCurrency={invoice.currency}
												onchange={(currency) => invoice.currency = currency}
											/>
										</div>
										<div>
											<Label>Tax Rate (%)</Label>
											<Input 
												type="number" 
												bind:value={invoice.taxRate} 
												min="0" 
												max="100" 
												step="0.01"
											/>
										</div>
										<div>
											<Label>Due Date</Label>
											<Input type="date" bind:value={invoice.dueDate} />
										</div>
									</div>

									<!-- Items -->
									<div class="space-y-2">
										<div class="flex items-center justify-between">
											<Label>Items</Label>
											<Button 
												variant="outline" 
												size="sm"
												onclick={() => addItem(invoiceIndex)}
											>
												<Plus class="mr-2 h-3 w-3" />
												Add Item
											</Button>
										</div>

										{#each invoice.items as item, itemIndex}
											<div class="grid grid-cols-1 gap-2 md:grid-cols-4 p-3 border rounded">
												<Input 
													bind:value={item.description} 
													placeholder="Description" 
													class="md:col-span-2"
												/>
												<Input 
													type="number" 
													bind:value={item.quantity} 
													placeholder="Qty" 
													min="0.01" 
													step="0.01"
												/>
												<div class="flex space-x-2">
													<Input 
														type="number" 
														bind:value={item.unitPrice} 
														placeholder="Price" 
														min="0" 
														step="0.01"
													/>
													{#if invoice.items.length > 1}
														<Button 
															variant="ghost" 
															size="sm"
															onclick={() => removeItem(invoiceIndex, itemIndex)}
														>
															<Trash2 class="h-4 w-4" />
														</Button>
													{/if}
												</div>
											</div>
										{/each}
									</div>

									<!-- Notes -->
									<div>
										<Label>Notes</Label>
										<Textarea bind:value={invoice.notes} placeholder="Additional notes..." rows={2} />
									</div>
								</CardContent>
							</Card>
						{/each}

						<Button variant="outline" onclick={addInvoice} class="w-full">
							<Plus class="mr-2 h-4 w-4" />
							Add Another Invoice
						</Button>
					</div>
				{:else}
					<!-- CSV Import Mode -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="text-lg font-semibold">CSV Import</h3>
							<Button variant="outline" onclick={downloadCSVTemplate}>
								<Download class="mr-2 h-4 w-4" />
								Download Template
							</Button>
						</div>

						<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
							<Upload class="mx-auto mb-4 h-12 w-12 text-gray-400" />
							<div class="space-y-2">
								<p class="text-lg font-medium">Upload CSV File</p>
								<p class="text-sm text-muted-foreground">
									Choose a CSV file with invoice data or drag and drop it here
								</p>
								<Input 
									type="file" 
									accept=".csv" 
									onchange={handleCSVUpload}
									class="max-w-xs mx-auto"
								/>
							</div>
						</div>

						{#if csvFile}
							<div class="p-4 bg-green-50 border border-green-200 rounded-lg">
								<div class="flex items-center space-x-2">
									<CheckCircle class="h-5 w-5 text-green-600" />
									<span class="font-medium">File uploaded: {csvFile.name}</span>
								</div>
								<p class="text-sm text-muted-foreground mt-1">
									Ready to process {csvData.split('\n').length - 1} invoices
								</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex justify-end space-x-2 pt-4 border-t">
					<Button variant="outline" onclick={onclose}>Cancel</Button>
					<Button 
						onclick={processBulkInvoices}
						disabled={mode === 'csv' ? !csvFile : invoicesData.some(inv => !inv.clientName || !inv.clientEmail)}
					>
						<FileText class="mr-2 h-4 w-4" />
						Create Invoices
					</Button>
				</div>
			{:else if isProcessing}
				<!-- Processing State -->
				<div class="text-center space-y-4">
					<Clock class="mx-auto h-12 w-12 text-blue-600 animate-spin" />
					<h3 class="text-lg font-semibold">Processing Invoices...</h3>
					<Progress value={progress} class="w-full" />
					<p class="text-sm text-muted-foreground">
						{progress.toFixed(0)}% complete
					</p>
				</div>
			{:else if results}
				<!-- Results State -->
				<div class="space-y-4">
					<div class="text-center">
						{#if results.status === 'completed'}
							<CheckCircle class="mx-auto mb-4 h-12 w-12 text-green-600" />
							<h3 class="text-lg font-semibold text-green-600">Bulk Operation Completed!</h3>
						{:else}
							<AlertCircle class="mx-auto mb-4 h-12 w-12 text-red-600" />
							<h3 class="text-lg font-semibold text-red-600">Operation Failed</h3>
						{/if}
					</div>

					<div class="grid grid-cols-3 gap-4 text-center">
						<div>
							<div class="text-2xl font-bold">{results.totalItems}</div>
							<div class="text-sm text-muted-foreground">Total</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-green-600">{results.processedItems}</div>
							<div class="text-sm text-muted-foreground">Success</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-red-600">{results.failedItems}</div>
							<div class="text-sm text-muted-foreground">Failed</div>
						</div>
					</div>

					{#if results.errors && results.errors.length > 0}
						<div class="p-4 bg-red-50 border border-red-200 rounded-lg">
							<h4 class="font-medium text-red-800 mb-2">Errors:</h4>
							<ul class="text-sm text-red-700 space-y-1">
								{#each results.errors as error}
									<li>• {error}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<div class="flex justify-end space-x-2">
						<Button variant="outline" onclick={onclose}>Close</Button>
						<Button href="/invoices">View Invoices</Button>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>