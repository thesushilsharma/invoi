<script lang="ts">
	import { onMount } from 'svelte';
	import { jsPDF } from 'jspdf';
	import html2canvas from 'html2canvas';
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Badge } from "$lib/components/ui/badge";
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
	import { Upload, Plus, Search, Eye, Edit, Download, Trash2 } from '@lucide/svelte';
	import InvoiceTemplatePreview from '$lib/components/InvoiceTemplatePreview.svelte';
	import type { Invoice, InvoiceItem } from '$lib/server/db/schema';

	let invoices: Invoice[] = $state([]);
	let filteredInvoices: Invoice[] = $state([]);
	let searchQuery: string = $state('');
	let isLoading = $state(true);
	let isDownloading = $state(false);
	let companySettings: any = $state(null);
	let previewContainer: HTMLElement;
	let downloadInvoice: Invoice | null = $state(null);
	let downloadItems: InvoiceItem[] = $state([]);

	onMount(async () => {
		try {
			const [invoicesResponse, settingsResponse] = await Promise.all([
				fetch('/api/invoices'),
				fetch('/api/settings')
			]);

			if (invoicesResponse.ok) {
				invoices = await invoicesResponse.json();
				filteredInvoices = invoices;
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

	$effect(() => {
		if (searchQuery.trim()) {
			filteredInvoices = invoices.filter(
				(invoice) =>
					invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
					invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
					invoice.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())
			);
		} else {
			filteredInvoices = invoices;
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

	async function downloadPDF(invoice: Invoice) {
		if (isDownloading || !previewContainer) return;

		isDownloading = true;
		try {
			// Fetch full invoice details including items
			const response = await fetch(`/api/invoices/${invoice.id}`);
			if (!response.ok) throw new Error('Failed to fetch invoice details');

			const data = await response.json();
			downloadInvoice = data.invoice;
			downloadItems = data.items || [];

			if (!downloadInvoice) {
				throw new Error('Invoice data not found');
			}

			// Wait for the preview to be rendered and images to load
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Wait for images to load
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

			// Additional wait for rendering
			await new Promise((resolve) => setTimeout(resolve, 200));

			const canvas = await html2canvas(previewContainer, {
				scale: 2,
				useCORS: true,
				logging: false,
				backgroundColor: '#ffffff',
				allowTaint: true,
				width: previewContainer.scrollWidth,
				height: previewContainer.scrollHeight
			});

			if (!canvas) {
				throw new Error('Failed to create canvas');
			}

			const imgData = canvas.toDataURL('image/png');
			if (!imgData || imgData === 'data:,') {
				throw new Error('Failed to generate image data');
			}

			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});

			const imgProps = pdf.getImageProperties(imgData);
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

			// Handle multi-page PDF if content is too tall
			if (pdfHeight > pdf.internal.pageSize.getHeight()) {
				const pageHeight = pdf.internal.pageSize.getHeight();
				let heightLeft = pdfHeight;
				let position = 0;

				pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
				heightLeft -= pageHeight;

				while (heightLeft > 0) {
					position = heightLeft - pdfHeight;
					pdf.addPage();
					pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
					heightLeft -= pageHeight;
				}
			} else {
				pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
			}

			pdf.save(`${invoice.invoiceNumber}.pdf`);
		} catch (error) {
			console.error('Failed to download PDF:', error);
			alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			isDownloading = false;
			downloadInvoice = null;
			downloadItems = [];
		}
	}

	async function deleteInvoice(id: string) {
		if (confirm('Are you sure you want to delete this invoice?')) {
			try {
				const response = await fetch(`/api/invoices/${id}`, {
					method: 'DELETE'
				});

				if (response.ok) {
					invoices = invoices.filter((inv) => inv.id !== id);
				}
			} catch (error) {
				console.error('Failed to delete invoice:', error);
			}
		}
	}

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (files && files.length > 0) {
			// Handle PDF upload and parsing
			console.log('Uploading PDF:', files[0].name);
			// Implement PDF parsing logic here
		}
	}
</script>

<svelte:head>
	<title>Invoices - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Invoices</h1>
			<p class="text-muted-foreground">Manage and track all your invoices</p>
		</div>

		<div class="flex gap-2">
			<input type="file" accept=".pdf" onchange={handleFileUpload} class="hidden" id="pdf-upload" />
			<Button variant="outline" onclick={() => document.getElementById('pdf-upload')?.click()}>
				<Upload class="mr-2 h-4 w-4" />
				Upload PDF
			</Button>

			<Button href="/invoices/new">
				<Plus class="mr-2 h-4 w-4" />
				New Invoice
			</Button>
		</div>
	</div>

	<!-- Search and Filters -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex items-center space-x-2">
				<Search class="h-4 w-4 text-muted-foreground" />
				<Input placeholder="Search invoices..." bind:value={searchQuery} class="max-w-sm" />
			</div>
		</CardContent>
	</Card>

	<!-- Invoices List -->
	<Card>
		<CardHeader>
			<CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
		</CardHeader>
		<CardContent>
			{#if isLoading}
				<div class="flex h-32 items-center justify-center">
					<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
				</div>
			{:else if filteredInvoices.length === 0}
				<div class="py-12 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
					>
						<Plus class="h-8 w-8 text-gray-400" />
					</div>
					<h3 class="mb-2 text-lg font-medium">No invoices found</h3>
					<p class="mb-4 text-muted-foreground">
						{searchQuery
							? 'Try adjusting your search terms'
							: 'Get started by creating your first invoice'}
					</p>
					<Button href="/invoices/new">
						<Plus class="mr-2 h-4 w-4" />
						Create Invoice
					</Button>
				</div>
			{:else}
				<div class="space-y-4">
					{#each filteredInvoices as invoice}
						<div class="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50">
							<div class="flex items-center space-x-4">
								<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
									<span class="text-sm font-semibold text-blue-600">
										{invoice.invoiceNumber.slice(-3)}
									</span>
								</div>

								<div>
									<h3 class="font-medium">{invoice.invoiceNumber}</h3>
									<p class="text-sm text-muted-foreground">{invoice.clientName}</p>
									<p class="text-xs text-muted-foreground">
										Due: {new Date(invoice.dueDate).toLocaleDateString()}
									</p>
								</div>
							</div>

							<div class="flex items-center space-x-4">
								<div class="text-right">
									<p class="font-semibold">${invoice.total.toFixed(2)}</p>
									<Badge class={getStatusColor(invoice.status)}>
										{invoice.status}
									</Badge>
								</div>

								<div class="flex items-center space-x-1">
									<Button variant="ghost" size="icon" href="/invoices/{invoice.id}">
										<Eye class="h-4 w-4" />
									</Button>

									<Button variant="ghost" size="icon" href="/invoices/{invoice.id}/edit">
										<Edit class="h-4 w-4" />
									</Button>

									<Button
										variant="ghost"
										size="icon"
										onclick={() => downloadPDF(invoice)}
										disabled={isDownloading}
									>
										<Download class="h-4 w-4" />
									</Button>

									<Button
										variant="ghost"
										size="icon"
										onclick={() => deleteInvoice(invoice.id)}
										class="text-red-500 hover:text-red-700"
									>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Hidden Preview for PDF Generation -->
	<div
		class="pointer-events-none fixed top-0 left-0 -z-50 opacity-0"
		style="width: 210mm; min-height: 297mm;"
	>
		<div bind:this={previewContainer}>
			{#if downloadInvoice && companySettings}
				<InvoiceTemplatePreview
					logoUrl={companySettings.companyLogo}
					stampUrl={companySettings.companyStamp}
					signatureUrl={companySettings.companySignature}
					companyName={companySettings.companyName}
					companyNameAr={companySettings.companyNameAr || "اسم شركتك"}
					companyPhone={companySettings.companyPhone}
					companyAddress={companySettings.companyAddress}
					companyEmail={companySettings.companyEmail}
					companyTrn={companySettings.companyTaxId}
					invoice={downloadInvoice}
					items={downloadItems}
				/>
			{/if}
		</div>
	</div>
</div>
