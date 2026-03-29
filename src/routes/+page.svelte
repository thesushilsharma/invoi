<script lang="ts">
  import InvoiceDashboard from '$lib/components/invoice-dashboard.svelte';
	import type { Invoice, Payment } from '$lib/server/db/schema';
  import { onMount } from 'svelte';
  
  let invoices = $state<Invoice[]>([]);
  let payments = $state<Payment[]>([]);
  let totalRevenue = $state(0);
  let pendingAmount = $state(0);
  let overdueCount = $state(0);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  
  onMount(async () => {
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const [invoicesRes, paymentsRes] = await Promise.all([
        fetch('/api/invoices', { signal: controller.signal }),
        fetch('/api/payments', { signal: controller.signal })
      ]);
      
      clearTimeout(timeoutId);
      
      if (invoicesRes.ok) {
        invoices = await invoicesRes.json();
      } else {
        console.error('Failed to fetch invoices:', invoicesRes.status);
      }
      
      if (paymentsRes.ok) {
        payments = await paymentsRes.json();
      } else {
        console.error('Failed to fetch payments:', paymentsRes.status);
      }
      
      // Calculate metrics
      totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      pendingAmount = invoices
        .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
        .reduce((sum, inv) => sum + inv.total, 0);
      overdueCount = invoices.filter(inv => 
        inv.status === 'overdue' || 
        (inv.status === 'sent' && new Date(inv.dueDate) < new Date())
      ).length;
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        error = 'Request timed out. Please check if the database is running.';
        console.error('Request timed out - database may not be running');
      } else {
        error = 'Failed to load dashboard data. Please try again.';
        console.error('Failed to load dashboard data:', err);
      }
    } finally {
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Dashboard - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
    <p class="text-muted-foreground">
      Welcome back! Here's an overview of your invoicing activity.
    </p>
  </div>
  
  {#if isLoading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else if error}
    <div class="flex flex-col items-center justify-center h-64 space-y-4">
      <div class="text-destructive text-lg font-semibold">{error}</div>
      <button 
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        onclick={() => window.location.reload()}
      >
        Retry
      </button>
    </div>
  {:else}
    <InvoiceDashboard 
      {invoices}
      {payments}
      {totalRevenue}
      {pendingAmount}
      {overdueCount}
    />
  {/if}
</div>
