<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { FileText, DollarSign, Clock, AlertTriangle, TrendingUp, Users } from '@lucide/svelte';
	import type { Invoice, Payment } from '$lib/server/db/schema';

	let {
		invoices = [],
		payments = [],
		totalRevenue = 0,
		pendingAmount = 0,
		overdueCount = 0
	} = $props<{
		invoices: Invoice[];
		payments: Payment[];
		totalRevenue: number;
		pendingAmount: number;
		overdueCount: number;
	}>();

	const recentInvoices = $derived(
		invoices
			.sort(
				(a: Invoice, b: Invoice) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)
			.slice(0, 5)
	);

	const monthlyRevenue = $derived.by(() => {
		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();

		return payments
			.filter((payment: Payment) => {
				const paymentDate = new Date(payment.paymentDate);
				return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
			})
			.reduce((sum: number, payment: Payment) => sum + payment.amount, 0);
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
</script>

<div class="space-y-6">
	<!-- Stats Cards -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
				<DollarSign class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
				<p class="text-xs text-muted-foreground">
					+${monthlyRevenue.toFixed(2)} this month
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Pending Amount</CardTitle>
				<Clock class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">${pendingAmount.toFixed(2)}</div>
				<p class="text-xs text-muted-foreground">Awaiting payment</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Total Invoices</CardTitle>
				<FileText class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{invoices.length}</div>
				<p class="text-xs text-muted-foreground">All time</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Overdue</CardTitle>
				<AlertTriangle class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold text-red-600">{overdueCount}</div>
				<p class="text-xs text-muted-foreground">Require attention</p>
			</CardContent>
		</Card>
	</div>

	<!-- Recent Invoices -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center justify-between">
				Recent Invoices
				<Button variant="outline" size="sm" href="/invoices">View All</Button>
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each recentInvoices as invoice}
					<div
						class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
					>
						<div class="flex flex-1 items-center space-x-4">
							<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
								<FileText class="h-5 w-5 text-blue-600" />
							</div>
							<div class="flex-1">
								<p class="font-medium">{invoice.invoiceNumber}</p>
								<p class="text-sm text-muted-foreground">{invoice.clientName}</p>
							</div>
						</div>

						<div class="flex items-center space-x-4">
							<div class="text-right">
								<p class="font-medium">${invoice.total.toFixed(2)}</p>
								<p class="text-sm text-muted-foreground">
									Due: {new Date(invoice.dueDate).toLocaleDateString()}
								</p>
							</div>
							<Badge class={getStatusColor(invoice.status)}>
								{invoice.status}
							</Badge>
							<Button variant="outline" size="sm" href="/invoices/{invoice.id}">View</Button>
						</div>
					</div>
				{/each}

				{#if recentInvoices.length === 0}
					<div class="py-8 text-center text-muted-foreground">
						<FileText class="mx-auto mb-4 h-12 w-12 opacity-50" />
						<p class="mb-2">No invoices yet</p>
						<p class="mb-4 text-sm">Create your first invoice to get started</p>
						<Button href="/invoices/new">
							<FileText class="mr-2 h-4 w-4" />
							Create First Invoice
						</Button>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Quick Actions -->
	<Card>
		<CardHeader>
			<CardTitle>Quick Actions</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Button
					href="/invoices/new"
					class="flex h-20 flex-col items-center justify-center space-y-2"
				>
					<FileText class="h-6 w-6" />
					<span>New Invoice</span>
				</Button>

				<Button
					variant="outline"
					href="/clients"
					class="flex h-20 flex-col items-center justify-center space-y-2"
				>
					<Users class="h-6 w-6" />
					<span>Manage Clients</span>
				</Button>

				<Button
					variant="outline"
					href="/reports"
					class="flex h-20 flex-col items-center justify-center space-y-2"
				>
					<TrendingUp class="h-6 w-6" />
					<span>View Reports</span>
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
