<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Plus, Search, Download, Eye, Edit, Trash2, Upload } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { generateInvoicePDF } from '$lib/utils/pdf.js';
	import type { Invoice } from '$lib/server/db/schema';
  
  let invoices = $state<Invoice[]>([]);
  let filteredInvoices = $state<Invoice[]>([]);
  let searchQuery = $state('');
  let isLoading = $state(true);
  
  onMount(async () => {
    try {
      const response = await fetch('/api/invoices');
      if (response.ok) {
        invoices = await response.json();
        filteredInvoices = invoices;
      }
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      isLoading = false;
    }
  });
  
  $effect(() => {
    if (searchQuery.trim()) {
      filteredInvoices = invoices.filter(invoice =>
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
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  async function downloadPDF(invoice: Invoice) {
    try {
      // In a real app, you'd fetch the complete invoice with items
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  }
  
  async function deleteInvoice(id: string) {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        const response = await fetch(`/api/invoices/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          invoices = invoices.filter(inv => inv.id !== id);
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
      <p class="text-muted-foreground">
        Manage and track all your invoices
      </p>
    </div>
    
    <div class="flex gap-2">
      <input
        type="file"
        accept=".pdf"
        onchange={handleFileUpload}
        class="hidden"
        id="pdf-upload"
      />
      <Button variant="outline" onclick={() => document.getElementById('pdf-upload')?.click()}>
        <Upload class="w-4 h-4 mr-2" />
        Upload PDF
      </Button>
      
      <Button href="/invoices/new">
        <Plus class="w-4 h-4 mr-2" />
        New Invoice
      </Button>
    </div>
  </div>
  
  <!-- Search and Filters -->
  <Card>
    <CardContent class="pt-6">
      <div class="flex items-center space-x-2">
        <Search class="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          bind:value={searchQuery}
          class="max-w-sm"
        />
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
        <div class="flex items-center justify-center h-32">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      {:else if filteredInvoices.length === 0}
        <div class="text-center py-12">
          <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-lg font-medium mb-2">No invoices found</h3>
          <p class="text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Get started by creating your first invoice'}
          </p>
          <Button href="/invoices/new">
            <Plus class="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      {:else}
        <div class="space-y-4">
          {#each filteredInvoices as invoice}
            <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span class="text-blue-600 font-semibold text-sm">
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
                    <Eye class="w-4 h-4" />
                  </Button>
                  
                  <Button variant="ghost" size="icon" href="/invoices/{invoice.id}/edit">
                    <Edit class="w-4 h-4" />
                  </Button>
                  
                  <Button variant="ghost" size="icon" onclick={() => downloadPDF(invoice)}>
                    <Download class="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onclick={() => deleteInvoice(invoice.id)}
                    class="text-red-500 hover:text-red-700"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
