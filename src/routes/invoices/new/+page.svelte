<script lang="ts">
  import InvoiceForm from '$lib/components/invoice-form.svelte';
  import { goto } from '$app/navigation';
  import type { InvoiceFormData } from '$lib/schemas/invoice.js';
  
  async function handleSubmit(data: InvoiceFormData) {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const invoice = await response.json();
        goto(`/invoices/${invoice.id}`);
      } else {
        throw new Error('Failed to create invoice');
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }
</script>

<svelte:head>
  <title>New Invoice - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Create New Invoice</h1>
    <p class="text-muted-foreground">
      Fill in the details below to create a new invoice
    </p>
  </div>
  
  <InvoiceForm onSubmit={handleSubmit} />
</div>
