<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		User, 
		Mail, 
		Phone, 
		MapPin, 
		FileText, 
		Edit, 
		ArrowLeft,
		Calendar,
		DollarSign
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

	const totalInvoiced = $derived(
		data.invoices.reduce((sum, invoice) => sum + invoice.total, 0)
	);

	const paidInvoices = $derived(
		data.invoices.filter(invoice => invoice.status === 'paid')
	);

	const totalPaid = $derived(
		paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
	);

	const pendingAmount = $derived(totalInvoiced - totalPaid);
</script>

<svelte:head>
	<title>{data.client.name} - Clients - Invoi</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<Button variant="ghost" size="sm" href="/clients">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Clients
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">{data.client.name}</h1>
				<p class="text-muted-foreground">Client Details</p>
			</div>
		</div>
		<div class="flex space-x-2">
			<Button variant="outline" href="/clients/{data.client.id}/edit">
				<Edit class="mr-2 h-4 w-4" />
				Edit Client
			</Button>
			<Button href="/invoices/new?client={data.client.id}">
				<FileText class="mr-2 h-4 w-4" />
				New Invoice
			</Button>
		</div>
	</div>

	<!-- Client Information -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Basic Info -->
		<Card class="lg:col-span-2">
			<CardHeader>
				<CardTitle class="flex items-center space-x-2">
					<User class="h-5 w-5" />
					<span>Client Information</span>
					<Badge variant={data.client.isActive ? 'default' : 'secondary'}>
						{data.client.isActive ? 'Active' : 'Inactive'}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="space-y-3">
						<div class="flex items-center space-x-2">
							<Mail class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm font-medium">Email:</span>
							<a href="mailto:{data.client.email}" class="text-blue-600 hover:underline">
								{data.client.email}
							</a>
						</div>

						{#if data.client.phone}
							<div class="flex items-center space-x-2">
								<Phone class="h-4 w-4 text-muted-foreground" />
								<span class="text-sm font-medium">Phone:</span>
								<a href="tel:{data.client.phone}" class="text-blue-600 hover:underline">
									{data.client.phone}
								</a>
							</div>
						{/if}

						{#if data.client.taxId}
							<div class="flex items-center space-x-2">
								<FileText class="h-4 w-4 text-muted-foreground" />
								<span class="text-sm font-medium">Tax ID:</span>
								<span>{data.client.taxId}</span>
							</div>
						{/if}
					</div>

					<div class="space-y-3">
						{#if data.client.address || data.client.city}
							<div class="flex items-start space-x-2">
								<MapPin class="h-4 w-4 text-muted-foreground mt-0.5" />
								<div class="text-sm">
									<div class="font-medium">Address:</div>
									<div class="text-muted-foreground">
										{#if data.client.address}
											<div>{data.client.address}</div>
										{/if}
										{#if data.client.city || data.client.state || data.client.zipCode}
											<div>
												{data.client.city}{data.client.state ? `, ${data.client.state}` : ''} {data.client.zipCode || ''}
											</div>
										{/if}
										{#if data.client.country}
											<div>{data.client.country}</div>
										{/if}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				{#if data.client.notes}
					<div class="pt-4 border-t">
						<div class="text-sm font-medium mb-2">Notes:</div>
						<p class="text-sm text-muted-foreground">{data.client.notes}</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Stats -->
		<div class="space-y-4">
			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium">Total Invoiced</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">${totalInvoiced.toFixed(2)}</div>
					<p class="text-xs text-muted-foreground">{data.invoices.length} invoices</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium">Total Paid</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
					<p class="text-xs text-muted-foreground">{paidInvoices.length} paid invoices</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium">Pending Amount</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</div>
					<p class="text-xs text-muted-foreground">Outstanding balance</p>
				</CardContent>
			</Card>
		</div>
	</div>

	<!-- Invoices -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center justify-between">
				<span>Invoices ({data.invoices.length})</span>
				<Button size="sm" href="/invoices/new?client={data.client.id}">
					<FileText class="mr-2 h-4 w-4" />
					New Invoice
				</Button>
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each data.invoices as invoice}
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="flex items-center space-x-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
								<FileText class="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<p class="font-medium">{invoice.invoiceNumber}</p>
								<div class="flex items-center space-x-2 text-sm text-muted-foreground">
									<Calendar class="h-3 w-3" />
									<span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
								</div>
							</div>
						</div>

						<div class="flex items-center space-x-4">
							<div class="text-right">
								<div class="flex items-center space-x-1">
									<DollarSign class="h-4 w-4" />
									<span class="font-medium">{invoice.total.toFixed(2)}</span>
								</div>
							</div>
							<Badge class={getStatusColor(invoice.status)}>
								{invoice.status}
							</Badge>
							<Button variant="outline" size="sm" href="/invoices/{invoice.id}">
								View
							</Button>
						</div>
					</div>
				{/each}

				{#if data.invoices.length === 0}
					<div class="py-8 text-center text-muted-foreground">
						<FileText class="mx-auto mb-4 h-12 w-12 opacity-50" />
						<p>No invoices yet</p>
						<p class="text-sm">Create the first invoice for this client</p>
						<Button class="mt-4" href="/invoices/new?client={data.client.id}">
							<FileText class="mr-2 h-4 w-4" />
							Create Invoice
						</Button>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>