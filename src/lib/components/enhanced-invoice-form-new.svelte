<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import InvoiceTemplatePreview from '$lib/components/InvoiceTemplatePreview.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';

	interface InvoiceItem {
		date?: string;
		description: string;
		quantity: number;
		hours?: number;
		unitPrice: number;
		vatPercentage?: number;
		vatAmount?: number;
		total: number;
	}

	interface Props {
		onSubmit: (data: any) => Promise<void>;
		initialData?: any;
	}

	let { onSubmit, initialData = null }: Props = $props();

	// Determine template type based on initial data
	const hasEnhancedFields = initialData?.items?.some(
		(item: any) => item.date || item.hours || item.vatPercentage
	);

	let templateType = $state<'basic' | 'enhanced'>(hasEnhancedFields ? 'enhanced' : 'enhanced');
	let invoiceNumber = $state(initialData?.invoiceNumber || `INV-${Date.now()}`);
	let poNumber = $state(initialData?.poNumber || '');
	let clientName = $state(initialData?.clientName || '');
	let clientEmail = $state(initialData?.clientEmail || '');
	let clientAddress = $state(initialData?.clientAddress || '');
	let clientTrn = $state(initialData?.clientTrn || '');
	let department = $state(initialData?.department || '');
	let issueDate = $state(
		initialData?.issueDate
			? typeof initialData.issueDate === 'string'
				? initialData.issueDate.split('T')[0]
				: new Date(initialData.issueDate).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0]
	);
	let dueDate = $state(
		initialData?.dueDate
			? typeof initialData.dueDate === 'string'
				? initialData.dueDate.split('T')[0]
				: new Date(initialData.dueDate).toISOString().split('T')[0]
			: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
	);
	let taxRate = $state(initialData?.taxRate || 5);
	let notes = $state(initialData?.notes || '');
	let isSubmitting = $state(false);

	// Settings for preview
	let companySettings = $state<any>(null);

	onMount(async () => {
		try {
			const response = await fetch('/api/settings');
			if (response.ok) {
				companySettings = await response.json();
			}
		} catch (error) {
			console.error('Failed to load settings:', error);
		}
	});

	let items = $state<InvoiceItem[]>(
		initialData?.items && initialData.items.length > 0
			? initialData.items.map((item: any) => ({
					date: item.date || new Date().toISOString().split('T')[0],
					description: item.description || '',
					quantity: item.quantity || 1,
					hours: item.hours || 0,
					unitPrice: item.unitPrice || 0,
					vatPercentage: item.vatPercentage || 5,
					vatAmount: item.vatAmount || 0,
					total: item.total || 0
				}))
			: [
					{
						date: new Date().toISOString().split('T')[0],
						description: '',
						quantity: 1,
						hours: 0,
						unitPrice: 0,
						vatPercentage: 5,
						vatAmount: 0,
						total: 0
					}
				]
	);

	const subtotal = $derived(items.reduce((sum, item) => sum + (item.total || 0), 0));
	const totalVat = $derived(items.reduce((sum, item) => sum + (item.vatAmount || 0), 0));
	const totalQuantity = $derived(items.reduce((sum, item) => sum + item.quantity, 0));
	const total = $derived(subtotal + totalVat);

	function calculateItemTotal(item: InvoiceItem) {
		const baseAmount = item.quantity * item.unitPrice;
		item.vatAmount = baseAmount * ((item.vatPercentage || 0) / 100);
		item.total = baseAmount;
	}

	function addItem() {
		items.push({
			date: new Date().toISOString().split('T')[0],
			description: '',
			quantity: 1,
			hours: 0,
			unitPrice: 0,
			vatPercentage: 5,
			vatAmount: 0,
			total: 0
		});
	}

	function removeItem(index: number) {
		if (items.length > 1) {
			items.splice(index, 1);
		}
	}

	function numberToWords(num: number): string {
		const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
		const tens = [
			'',
			'',
			'TWENTY',
			'THIRTY',
			'FORTY',
			'FIFTY',
			'SIXTY',
			'SEVENTY',
			'EIGHTY',
			'NINETY'
		];
		const teens = [
			'TEN',
			'ELEVEN',
			'TWELVE',
			'THIRTEEN',
			'FOURTEEN',
			'FIFTEEN',
			'SIXTEEN',
			'SEVENTEEN',
			'EIGHTEEN',
			'NINETEEN'
		];

		if (num === 0) return 'ZERO DIRHAMS ONLY';

		const convert = (n: number): string => {
			if (n < 10) return ones[n];
			if (n < 20) return teens[n - 10];
			if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
			if (n < 1000)
				return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convert(n % 100) : '');
			if (n < 1000000)
				return (
					convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '')
				);
			return (
				convert(Math.floor(n / 1000000)) +
				' MILLION' +
				(n % 1000000 ? ' ' + convert(n % 1000000) : '')
			);
		};

		const [whole, decimal] = num.toFixed(2).split('.');
		let result = convert(parseInt(whole)) + ' DIRHAMS';

		if (parseInt(decimal) > 0) {
			result += ' AND ' + convert(parseInt(decimal)) + ' FILS';
		} else {
			result += ' ONLY';
		}

		return result;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

		try {
			const data = {
				invoiceNumber,
				poNumber: poNumber || undefined,
				clientName,
				clientEmail,
				clientAddress,
				clientTrn: templateType === 'enhanced' ? clientTrn : undefined,
				department: templateType === 'enhanced' ? department : undefined,
				issueDate,
				dueDate,
				subtotal,
				taxRate,
				taxAmount: totalVat,
				total,
				totalQuantity: templateType === 'enhanced' ? totalQuantity : undefined,
				amountInWords: templateType === 'enhanced' ? numberToWords(total) : undefined,
				currency: 'AED',
				status: 'draft',
				notes,
				items: items.map((item) => ({
					date: templateType === 'enhanced' ? item.date : undefined,
					description: item.description,
					quantity: item.quantity,
					hours: templateType === 'enhanced' ? item.hours : undefined,
					unitPrice: item.unitPrice,
					vatPercentage: templateType === 'enhanced' ? item.vatPercentage : undefined,
					vatAmount: templateType === 'enhanced' ? item.vatAmount : undefined,
					total: item.total
				}))
			};

			await onSubmit(data);
		} catch (error) {
			console.error('Failed to submit invoice:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit}>
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Form Section -->
		<div class="space-y-6">
			<!-- Template Selection -->
			<Card>
				<CardHeader>
					<CardTitle>Invoice Template</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="flex gap-4">
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="radio"
								name="template"
								value="basic"
								bind:group={templateType}
								class="h-4 w-4"
							/>
							<span>Basic Template</span>
						</label>
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="radio"
								name="template"
								value="enhanced"
								bind:group={templateType}
								class="h-4 w-4"
							/>
							<span>Enhanced Template (with Hours, VAT breakdown)</span>
						</label>
					</div>
				</CardContent>
			</Card>

			<!-- Invoice Details -->
			<Card>
				<CardHeader>
					<CardTitle>Invoice Details</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="invoiceNumber">Invoice Number</Label>
							<Input id="invoiceNumber" bind:value={invoiceNumber} required />
						</div>

						<div class="space-y-2">
							<Label for="poNumber">PO Number (Optional)</Label>
							<Input id="poNumber" bind:value={poNumber} placeholder="Purchase Order Number" />
						</div>

						{#if templateType === 'enhanced'}
							<div class="space-y-2">
								<Label for="department">Department</Label>
								<Input id="department" bind:value={department} placeholder="e.g., BQT, Sales" />
							</div>
						{/if}

						<div class="space-y-2">
							<Label for="issueDate">Issue Date</Label>
							<Input id="issueDate" type="date" bind:value={issueDate} required />
						</div>

						<div class="space-y-2">
							<Label for="dueDate">Due Date</Label>
							<Input id="dueDate" type="date" bind:value={dueDate} required />
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
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="clientName">Client Name</Label>
							<Input id="clientName" bind:value={clientName} required />
						</div>

						<div class="space-y-2">
							<Label for="clientEmail">Client Email</Label>
							<Input id="clientEmail" type="email" bind:value={clientEmail} required />
						</div>
					</div>

					<div class="space-y-2">
						<Label for="clientAddress">Client Address</Label>
						<Textarea id="clientAddress" bind:value={clientAddress} rows={3} required />
					</div>

					{#if templateType === 'enhanced'}
						<div class="space-y-2">
							<Label for="clientTrn">Client TRN (Tax Registration Number)</Label>
							<Input id="clientTrn" bind:value={clientTrn} placeholder="100037631700003" />
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Invoice Items -->
			<Card>
				<CardHeader>
					<CardTitle>Invoice Items</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="overflow-x-auto">
						<table class="w-full border-collapse">
							<thead>
								<tr class="border-b">
									<th class="p-2 text-left text-sm font-medium">S.NO</th>
									{#if templateType === 'enhanced'}
										<th class="p-2 text-left text-sm font-medium">Date</th>
									{/if}
									<th class="p-2 text-left text-sm font-medium">Particulars</th>
									<th class="p-2 text-left text-sm font-medium">Quantity</th>
									{#if templateType === 'enhanced'}
										<th class="p-2 text-left text-sm font-medium">Hours</th>
									{/if}
									<th class="p-2 text-left text-sm font-medium">Per Hour/Unit</th>
									{#if templateType === 'enhanced'}
										<th class="p-2 text-left text-sm font-medium">VAT %</th>
										<th class="p-2 text-left text-sm font-medium">VAT Amount</th>
									{/if}
									<th class="p-2 text-left text-sm font-medium">Amount</th>
									<th class="p-2 text-left text-sm font-medium"></th>
								</tr>
							</thead>
							<tbody>
								{#each items as item, index}
									<tr class="border-b">
										<td class="p-2 text-center">{index + 1}</td>
										{#if templateType === 'enhanced'}
											<td class="p-2">
												<Input type="date" bind:value={item.date} class="w-32" />
											</td>
										{/if}
										<td class="p-2">
											<Input
												bind:value={item.description}
												placeholder="Service description"
												required
											/>
										</td>
										<td class="p-2">
											<Input
												type="number"
												bind:value={item.quantity}
												min="1"
												class="w-20"
												oninput={() => calculateItemTotal(item)}
												required
											/>
										</td>
										{#if templateType === 'enhanced'}
											<td class="p-2">
												<Input type="number" bind:value={item.hours} min="0" class="w-20" />
											</td>
										{/if}
										<td class="p-2">
											<Input
												type="number"
												bind:value={item.unitPrice}
												min="0"
												step="0.01"
												class="w-24"
												oninput={() => calculateItemTotal(item)}
												required
											/>
										</td>
										{#if templateType === 'enhanced'}
											<td class="p-2">
												<Input
													type="number"
													bind:value={item.vatPercentage}
													min="0"
													max="100"
													step="0.01"
													class="w-20"
													oninput={() => calculateItemTotal(item)}
												/>
											</td>
											<td class="p-2 text-sm">
												AED {(item.vatAmount || 0).toFixed(2)}
											</td>
										{/if}
										<td class="p-2 text-sm font-medium">
											AED {(item.total || 0).toFixed(2)}
										</td>
										<td class="p-2">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onclick={() => removeItem(index)}
												disabled={items.length === 1}
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<Button type="button" variant="outline" onclick={addItem}>
						<Plus class="mr-2 h-4 w-4" />
						Add Item
					</Button>
				</CardContent>
			</Card>

			<!-- Totals -->
			<Card>
				<CardHeader>
					<CardTitle>Summary</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2">
					<div class="flex justify-between text-sm">
						<span>Subtotal (Excl VAT):</span>
						<span class="font-medium">AED {subtotal.toFixed(2)}</span>
					</div>
					{#if templateType === 'enhanced'}
						<div class="flex justify-between text-sm">
							<span>Total Quantity:</span>
							<span class="font-medium">{totalQuantity.toFixed(2)}</span>
						</div>
					{/if}
					<div class="flex justify-between text-sm">
						<span>Total VAT:</span>
						<span class="font-medium">AED {totalVat.toFixed(2)}</span>
					</div>
					<div class="flex justify-between border-t pt-2 text-lg font-bold">
						<span>Total (Incl VAT):</span>
						<span>AED {total.toFixed(2)}</span>
					</div>
					{#if templateType === 'enhanced'}
						<div class="mt-2 text-xs text-muted-foreground">
							<strong>Amount in words:</strong>
							{numberToWords(total)}
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Notes -->
			<Card>
				<CardHeader>
					<CardTitle>Additional Notes</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea bind:value={notes} rows={3} placeholder="Any additional notes or terms..." />
				</CardContent>
			</Card>

			<!-- Submit -->
			<div class="flex justify-end gap-4">
				<Button type="button" variant="outline" onclick={() => window.history.back()}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Creating...' : 'Create Invoice'}
				</Button>
			</div>
		</div>

		<!-- Preview Section -->
		<div class="space-y-6 lg:sticky lg:top-6 lg:self-start">
			<Card>
				<CardHeader>
					<CardTitle>Invoice Preview</CardTitle>
				</CardHeader>
				<CardContent>
					{#if companySettings}
						<InvoiceTemplatePreview
							logoUrl={companySettings.companyLogo}
							stampUrl={companySettings.companyStamp}
							signatureUrl={companySettings.companySignature}
							companyName={companySettings.companyName || 'Your Company Name'}
							companyNameAr="اسم شركتك"
							companyPhone={companySettings.companyPhone || '+971 XXX XX XXXX'}
							companyAddress={companySettings.companyAddress || 'Your Company Address'}
							companyEmail={companySettings.companyEmail || 'email@company.com'}
							companyTrn={companySettings.companyTaxId || 'XXXXXXXXXXXXX'}
						/>
					{:else}
						<div class="flex h-64 items-center justify-center">
							<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
</form>
