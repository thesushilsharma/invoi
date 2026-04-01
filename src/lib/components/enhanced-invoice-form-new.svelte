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
	function getInitialDate(value: string | Date | null | undefined, fallback: string) {
		if (!value) return fallback;
		return typeof value === 'string'
			? value.split('T')[0]
			: new Date(value).toISOString().split('T')[0];
	}

	function getInitialItems(data: any): InvoiceItem[] {
		if (data?.items && data.items.length > 0) {
			return data.items.map((item: any) => ({
				date: item.date || new Date().toISOString().split('T')[0],
				description: item.description || '',
				quantity: item.quantity || 1,
				hours: item.hours || 0,
				unitPrice: item.unitPrice || 0,
				vatPercentage: item.vatPercentage || 5,
				vatAmount: item.vatAmount || 0,
				total: item.total || 0
			}));
		}

		return [
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
		];
	}

	function getInitialFormData(data: any) {
		return {
			invoiceNumber: data?.invoiceNumber || `INV-${Date.now()}`,
			poNumber: data?.poNumber || '',
			clientName: data?.clientName || '',
			clientEmail: data?.clientEmail || '',
			clientAddress: data?.clientAddress || '',
			clientTrn: data?.clientTrn || '',
			department: data?.department || '',
			issueDate: getInitialDate(data?.issueDate, new Date().toISOString().split('T')[0]),
			dueDate: getInitialDate(
				data?.dueDate,
				new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
			),
			taxRate: data?.taxRate || 5,
			notes: data?.notes || '',
			items: getInitialItems(data)
		};
	}

	let invoiceNumber = $state('');
	let poNumber = $state('');
	let clientName = $state('');
	let clientEmail = $state('');
	let clientAddress = $state('');
	let clientTrn = $state('');
	let department = $state('');
	let issueDate = $state('');
	let dueDate = $state('');
	let taxRate = $state(5);
	let notes = $state('');
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

	let items = $state<InvoiceItem[]>(getInitialItems(null));

	$effect(() => {
		const formData = getInitialFormData(initialData);
		invoiceNumber = formData.invoiceNumber;
		poNumber = formData.poNumber;
		clientName = formData.clientName;
		clientEmail = formData.clientEmail;
		clientAddress = formData.clientAddress;
		clientTrn = formData.clientTrn;
		department = formData.department;
		issueDate = formData.issueDate;
		dueDate = formData.dueDate;
		taxRate = formData.taxRate;
		notes = formData.notes;
		items = formData.items;
	});

	const subtotal = $derived(items.reduce((sum, item) => sum + (item.total || 0), 0));
	const totalVat = $derived(items.reduce((sum, item) => sum + (item.vatAmount || 0), 0));
	const totalQuantity = $derived(items.reduce((sum, item) => sum + item.quantity, 0));
	const total = $derived(subtotal + totalVat);

	function calculateItemTotal(item: InvoiceItem) {
		const baseAmount = item.quantity * item.unitPrice;
		item.vatAmount = baseAmount * ((item.vatPercentage || 0) / 100);
		item.total = baseAmount;
	}

	function getPreviewInvoice() {
		return {
			invoiceNumber,
			clientName,
			clientEmail,
			clientAddress,
			clientTrn,
			department,
			issueDate,
			dueDate,
			subtotal,
			taxRate,
			taxAmount: totalVat,
			total,
			totalQuantity,
			amountInWords: numberToWords(total),
			currency: 'AED',
			status: initialData?.status || 'draft',
			notes
		};
	}

	function getPreviewItems() {
		return items.map((item) => ({
			date: item.date,
			description: item.description,
			quantity: item.quantity,
			hours: item.hours,
			unitPrice: item.unitPrice,
			vatPercentage: item.vatPercentage,
			vatAmount: item.vatAmount,
			total: item.total
		}));
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
				clientTrn: clientTrn || undefined,
				department: department || undefined,
				issueDate,
				dueDate,
				subtotal,
				taxRate,
				taxAmount: totalVat,
				total,
				totalQuantity,
				amountInWords: numberToWords(total),
				currency: 'AED',
				status: initialData?.status || 'draft',
				notes,
				items: items.map((item) => ({
					date: item.date,
					description: item.description,
					quantity: item.quantity,
					hours: item.hours,
					unitPrice: item.unitPrice,
					vatPercentage: item.vatPercentage,
					vatAmount: item.vatAmount,
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

						<div class="space-y-2">
							<Label for="department">Department</Label>
							<Input id="department" bind:value={department} placeholder="e.g., BQT, Sales" />
						</div>

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

					<div class="space-y-2">
						<Label for="clientTrn">Client TRN (Tax Registration Number)</Label>
						<Input id="clientTrn" bind:value={clientTrn} placeholder="100037631700003" />
					</div>
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
									<th class="p-2 text-left text-sm font-medium">Date</th>
									<th class="p-2 text-left text-sm font-medium">Particulars</th>
									<th class="p-2 text-left text-sm font-medium">Quantity</th>
									<th class="p-2 text-left text-sm font-medium">Hours</th>
									<th class="p-2 text-left text-sm font-medium">Per Hour/Unit</th>
									<th class="p-2 text-left text-sm font-medium">VAT %</th>
									<th class="p-2 text-left text-sm font-medium">VAT Amount</th>
									<th class="p-2 text-left text-sm font-medium">Amount</th>
									<th class="p-2 text-left text-sm font-medium"></th>
								</tr>
							</thead>
							<tbody>
								{#each items as item, index (index)}
									<tr class="border-b">
										<td class="p-2 text-center">{index + 1}</td>
										<td class="p-2">
											<Input type="date" bind:value={item.date} class="w-32" />
										</td>
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
										<td class="p-2">
											<Input type="number" bind:value={item.hours} min="0" class="w-20" />
										</td>
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
					<div class="flex justify-between text-sm">
						<span>Total Quantity:</span>
						<span class="font-medium">{totalQuantity.toFixed(2)}</span>
					</div>
					<div class="flex justify-between text-sm">
						<span>Total VAT:</span>
						<span class="font-medium">AED {totalVat.toFixed(2)}</span>
					</div>
					<div class="flex justify-between border-t pt-2 text-lg font-bold">
						<span>Total (Incl VAT):</span>
						<span>AED {total.toFixed(2)}</span>
					</div>
					<div class="mt-2 text-xs text-muted-foreground">
						<strong>Amount in words:</strong>
						{numberToWords(total)}
					</div>
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
					{isSubmitting ? (initialData ? 'Updating...' : 'Creating...') : (initialData ? 'Update Invoice' : 'Create Invoice')}
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
							invoice={getPreviewInvoice()}
							items={getPreviewItems()}
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
