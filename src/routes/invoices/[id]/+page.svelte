<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Download, Mail, Edit, Trash2, ArrowLeft } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Invoice, InvoiceItem } from '$lib/server/db/schema';
	import InvoiceTemplatePreview from '$lib/components/InvoiceTemplatePreview.svelte';
	import { exportElementToPdf } from '$lib/utils/html2canvas-pdf';


	let invoice = $state<Invoice | null>(null);
	let items = $state<InvoiceItem[]>([]);
	let isLoading = $state(true);
	let isDownloading = $state(false);
	let companySettings = $state<any>(null);
	let previewContainer: HTMLElement;

	const invoiceId = $page.params.id;

	onMount(async () => {
		try {
			const [invoiceResponse, settingsResponse] = await Promise.all([
				fetch(`/api/invoices/${invoiceId}`),
				fetch('/api/settings')
			]);

			if (invoiceResponse.ok) {
				const data = await invoiceResponse.json();
				invoice = data.invoice;
				items = data.items || [];
			}

			if (settingsResponse.ok) {
				companySettings = await settingsResponse.json();
			}
		} catch (error) {
			console.error('Failed to load data:', error);
		} finally {
			isLoading = false;
		}
	});

	function getStatusColor(status: string) {
		switch (status) {
			case 'paid':
				return 'bg-green-100 text-green-800';
			case 'sent':
				return 'bg-blue-100 text-blue-800';
			case 'overdue':
				return 'bg-red-100 text-red-800';
			case 'draft':
				return 'bg-gray-100 text-gray-800';
			case 'cancelled':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	async function downloadPDF() {
		if (!invoice || !previewContainer) return;

		isDownloading = true;
		try {
			await new Promise((resolve) => setTimeout(resolve, 500));

			const images = previewContainer.querySelectorAll('img');
			if (images.length > 0) {
				await Promise.all(
					Array.from(images).map(
						(img) =>
							new Promise((resolve) => {
								if (img.complete) {
									resolve(undefined);
								} else {
									img.onload = () => resolve(undefined);
									img.onerror = () => resolve(undefined);
									setTimeout(() => resolve(undefined), 2000);
								}
							})
					)
				);
			}

			await new Promise((resolve) => setTimeout(resolve, 200));

			await exportElementToPdf(previewContainer, `${invoice.invoiceNumber}.pdf`);
		} catch (error) {
			console.error('Failed to download PDF:', error);
			alert(`Failed to generate PDF. ${error instanceof Error ? error.message : ''}`);
		} finally {
			isDownloading = false;
		}
	}

	async function sendEmail() {
		try {
			const response = await fetch(`/api/invoices/${invoiceId}/send`, {
				method: 'POST'
			});
			if (response.ok) {
				alert('Invoice sent successfully!');
			}
		} catch (error) {
			console.error('Failed to send email:', error);
			alert('Failed to send invoice');
		}
	}

	async function deleteInvoice() {
		if (confirm('Are you sure you want to delete this invoice?')) {
			try {
				const response = await fetch(`/api/invoices/${invoiceId}`, {
					method: 'DELETE'
				});
				if (response.ok) {
					goto('/invoices');
				}
			} catch (error) {
				console.error('Failed to delete invoice:', error);
			}
		}
	}
</script>

<svelte:head>
	<title>{invoice?.invoiceNumber || 'Invoice'} - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<Button variant="ghost" size="icon" href="/invoices">
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">
					{invoice?.invoiceNumber || 'Loading...'}
				</h1>
				<p class="text-muted-foreground">Invoice details and items</p>
			</div>
		</div>

		{#if invoice}
			<div class="flex gap-2">
				<Button variant="outline" onclick={downloadPDF} disabled={isDownloading}>
					<Download class="mr-2 h-4 w-4" />
					{isDownloading ? 'Generating...' : 'Download PDF'}
				</Button>
				<Button variant="outline" onclick={sendEmail}>
					<Mail class="mr-2 h-4 w-4" />
					Send Email
				</Button>
				<Button variant="outline" href="/invoices/{invoiceId}/edit">
					<Edit class="mr-2 h-4 w-4" />
					Edit
				</Button>
				<Button variant="destructive" onclick={deleteInvoice}>
					<Trash2 class="mr-2 h-4 w-4" />
					Delete
				</Button>
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
		</div>
	{:else if !invoice}
		<Card>
			<CardContent class="pt-6">
				<p class="text-center text-muted-foreground">Invoice not found</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-6 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Invoice Information</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div>
						<p class="text-sm text-muted-foreground">Status</p>
						<Badge class={getStatusColor(invoice.status)}>{invoice.status}</Badge>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Issue Date</p>
						<p class="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Due Date</p>
						<p class="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Currency</p>
						<p class="font-medium">{invoice.currency}</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Client Information</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div>
						<p class="text-sm text-muted-foreground">Name</p>
						<p class="font-medium">{invoice.clientName}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Email</p>
						<p class="font-medium">{invoice.clientEmail}</p>
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Address</p>
						<p class="font-medium">{invoice.clientAddress}</p>
					</div>
				</CardContent>
			</Card>
		</div>

		<Card>
			<CardHeader>
				<CardTitle>Invoice Items</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					{#each items as item}
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div class="flex-1">
								<p class="font-medium">{item.description}</p>
								<p class="text-sm text-muted-foreground">
									Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
								</p>
							</div>
							<p class="font-semibold">${item.total.toFixed(2)}</p>
						</div>
					{/each}

					<Separator />

					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Subtotal</span>
							<span>${invoice.subtotal.toFixed(2)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
							<span>${invoice.taxAmount.toFixed(2)}</span>
						</div>
						<Separator />
						<div class="flex justify-between text-lg font-bold">
							<span>Total</span>
							<span>${invoice.total.toFixed(2)}</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		{#if invoice.notes}
			<Card>
				<CardHeader>
					<CardTitle>Notes</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-sm">{invoice.notes}</p>
				</CardContent>
			</Card>
		{/if}
	{/if}

	<!-- Hidden Preview for PDF Generation -->
	<div
		class="pointer-events-none fixed top-0 left-0 -z-50 opacity-0 pdf-snapshot"
		style="width: 210mm; min-height: 297mm;"
	>
		<div bind:this={previewContainer}>
			{#if invoice && companySettings}
				<InvoiceTemplatePreview
					logoUrl={companySettings.companyLogo}
					stampUrl={companySettings.companyStamp}
					signatureUrl={companySettings.companySignature}
					companyName={companySettings.companyName}
					companyNameAr="اسم شركتك"
					companyPhone={companySettings.companyPhone}
					companyAddress={companySettings.companyAddress}
					companyEmail={companySettings.companyEmail}
					companyTrn={companySettings.companyTaxId}
					{invoice}
					{items}
				/>
			{/if}
		</div>
	</div>
</div>

