<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import FileText from '@lucide/svelte/icons/file-text';
	import Download from '@lucide/svelte/icons/download';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Wallet from '@lucide/svelte/icons/wallet';
	import Filter from '@lucide/svelte/icons/filter';
	import { goto } from '$app/navigation';

	let { data }: any = $props();

	let startDate = $state(data?.filters?.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
	let endDate = $state(data?.filters?.endDate || new Date().toISOString().split('T')[0]);
	let activeTab: 'vat' | 'petty-cash' = $state('vat');

	function applyFilters() {
		const params = new URLSearchParams();
		params.set('startDate', startDate);
		params.set('endDate', endDate);
		goto(`/reports?${params.toString()}`);
	}

	function exportToCSV(type: 'vat' | 'petty-cash') {
		let csvContent = '';
		let filename = '';

		if (type === 'vat') {
			csvContent = 'Invoice Number,Client Name,Date,Subtotal,VAT Rate,VAT Amount,Total,Status,Currency\n';
			data?.vatReport?.data?.forEach((row: any) => {
				csvContent += `${row.invoiceNumber},"${row.clientName}",${row.issueDate},${row.subtotal},${row.taxRate}%,${row.taxAmount},${row.total},${row.status},${row.currency}\n`;
			});
			filename = `vat-report-${startDate}-to-${endDate}.csv`;
		} else {
			csvContent = 'Date,Invoice Number,Client,Amount,Payment Method,Transaction ID,Notes\n';
			data?.pettyCashReport?.data?.forEach((row: any) => {
				csvContent += `${row.paymentDate},"${row.invoiceNumber}","${row.clientName}",${row.amount},${row.paymentMethod},"${row.transactionId || ''}","${row.notes || ''}"\n`;
			});
			filename = `petty-cash-report-${startDate}-to-${endDate}.csv`;
		}

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = filename;
		link.click();
	}

	function formatCurrency(amount: number, currency: string = 'AED') {
		return new Intl.NumberFormat('en-AE', {
			style: 'currency',
			currency: currency
		}).format(amount);
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-AE', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Reports - Invoi</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Reports</h1>
		<p class="text-muted-foreground">VAT reports and petty cash tracking</p>
	</div>

	<!-- Date Filter -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Filter class="h-5 w-5" />
				Filter Reports
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<Label for="startDate">Start Date</Label>
					<Input
						id="startDate"
						type="date"
						bind:value={startDate}
					/>
				</div>
				<div>
					<Label for="endDate">End Date</Label>
					<Input
						id="endDate"
						type="date"
						bind:value={endDate}
					/>
				</div>
				<div class="flex items-end">
					<Button onclick={applyFilters} class="w-full">
						<Calendar class="mr-2 h-4 w-4" />
						Apply Filters
					</Button>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Report Tabs -->
	<div class="flex gap-2 border-b">
		<button
			class="px-4 py-2 font-medium transition-colors {activeTab === 'vat'
				? 'border-b-2 border-primary text-primary'
				: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'vat')}
		>
			<Receipt class="inline-block mr-2 h-4 w-4" />
			VAT Report
		</button>
		<button
			class="px-4 py-2 font-medium transition-colors {activeTab === 'petty-cash'
				? 'border-b-2 border-primary text-primary'
				: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'petty-cash')}
		>
			<Wallet class="inline-block mr-2 h-4 w-4" />
			Petty Cash Report
		</button>
	</div>

	{#if activeTab === 'vat'}
		<!-- VAT Report -->
		<div class="space-y-4">
			<!-- Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader class="pb-2">
						<CardTitle class="text-sm font-medium text-muted-foreground">Total Sales (Excl. VAT)</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold">{formatCurrency(data?.vatReport?.summary?.totalSales || 0)}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader class="pb-2">
						<CardTitle class="text-sm font-medium text-muted-foreground">Total VAT Collected</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold text-green-600">{formatCurrency(data?.vatReport?.summary?.totalVat || 0)}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader class="pb-2">
						<CardTitle class="text-sm font-medium text-muted-foreground">Total (Incl. VAT)</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold">{formatCurrency(data?.vatReport?.summary?.totalWithVat || 0)}</div>
					</CardContent>
				</Card>
			</div>

			<!-- VAT Table -->
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle>VAT Transactions</CardTitle>
						<Button variant="outline" size="sm" onclick={() => exportToCSV('vat')}>
							<Download class="mr-2 h-4 w-4" />
							Export CSV
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b">
									<th class="text-left p-2 font-medium">Invoice #</th>
									<th class="text-left p-2 font-medium">Client</th>
									<th class="text-left p-2 font-medium">Date</th>
									<th class="text-right p-2 font-medium">Subtotal</th>
									<th class="text-right p-2 font-medium">VAT Rate</th>
									<th class="text-right p-2 font-medium">VAT Amount</th>
									<th class="text-right p-2 font-medium">Total</th>
									<th class="text-center p-2 font-medium">Status</th>
								</tr>
							</thead>
							<tbody>
								{#each data?.vatReport?.data || [] as invoice}
									<tr class="border-b hover:bg-muted/50">
										<td class="p-2 font-mono text-sm">{invoice.invoiceNumber}</td>
										<td class="p-2">{invoice.clientName}</td>
										<td class="p-2 text-sm text-muted-foreground">{formatDate(invoice.issueDate)}</td>
										<td class="p-2 text-right">{formatCurrency(invoice.subtotal, invoice.currency)}</td>
										<td class="p-2 text-right">{invoice.taxRate}%</td>
										<td class="p-2 text-right text-green-600">{formatCurrency(invoice.taxAmount, invoice.currency)}</td>
										<td class="p-2 text-right font-medium">{formatCurrency(invoice.total, invoice.currency)}</td>
										<td class="p-2 text-center">
											<Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
												{invoice.status}
											</Badge>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="8" class="p-8 text-center text-muted-foreground">
											No VAT transactions found for the selected period
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	{:else}
		<!-- Petty Cash Report -->
		<div class="space-y-4">
			<!-- Summary Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<CardHeader class="pb-2">
						<CardTitle class="text-sm font-medium text-muted-foreground">Total Cash Payments</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold">{formatCurrency(data?.pettyCashReport?.summary?.totalCash || 0)}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader class="pb-2">
						<CardTitle class="text-sm font-medium text-muted-foreground">Number of Transactions</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold">{data?.pettyCashReport?.summary?.transactionCount || 0}</div>
					</CardContent>
				</Card>
			</div>

			<!-- Petty Cash Table -->
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle>Cash Transactions</CardTitle>
						<Button variant="outline" size="sm" onclick={() => exportToCSV('petty-cash')}>
							<Download class="mr-2 h-4 w-4" />
							Export CSV
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b">
									<th class="text-left p-2 font-medium">Date</th>
									<th class="text-left p-2 font-medium">Invoice #</th>
									<th class="text-left p-2 font-medium">Client</th>
									<th class="text-right p-2 font-medium">Amount</th>
									<th class="text-left p-2 font-medium">Transaction ID</th>
									<th class="text-left p-2 font-medium">Notes</th>
								</tr>
							</thead>
							<tbody>
								{#each data?.pettyCashReport?.data || [] as payment}
									<tr class="border-b hover:bg-muted/50">
										<td class="p-2 text-sm">{formatDate(payment.paymentDate)}</td>
										<td class="p-2 font-mono text-sm">{payment.invoiceNumber || 'N/A'}</td>
										<td class="p-2">{payment.clientName || 'N/A'}</td>
										<td class="p-2 text-right font-medium">{formatCurrency(payment.amount)}</td>
										<td class="p-2 text-sm text-muted-foreground">{payment.transactionId || '-'}</td>
										<td class="p-2 text-sm text-muted-foreground">{payment.notes || '-'}</td>
									</tr>
								{:else}
									<tr>
										<td colspan="6" class="p-8 text-center text-muted-foreground">
											No cash transactions found for the selected period
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}

	<!-- Quick Actions -->
	<Card>
		<CardContent class="pt-6">
			<div class="flex flex-wrap gap-4 justify-center">
				<Button variant="outline" href="/analytics">
					<FileText class="mr-2 h-4 w-4" />
					View Analytics
				</Button>
				<Button variant="outline" href="/invoices">
					<Receipt class="mr-2 h-4 w-4" />
					View Invoices
				</Button>
				<Button variant="outline" href="/payments">
					<Wallet class="mr-2 h-4 w-4" />
					View Payments
				</Button>
			</div>
		</CardContent>
	</Card>
</div>