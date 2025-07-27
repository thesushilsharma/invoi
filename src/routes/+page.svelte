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
  
  onMount(async () => {
    try {
      // Simulate API calls - replace with actual API endpoints
      const [invoicesRes, paymentsRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/payments')
      ]);
      
      if (invoicesRes.ok) {
        invoices = await invoicesRes.json();
      }
      
      if (paymentsRes.ok) {
        payments = await paymentsRes.json();
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
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
