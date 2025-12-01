<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Client, Invoice } from '$lib/server/db/schema';
  
  let client = $state<Client | null>(null);
  let invoices = $state<Invoice[]>([]);
  let isLoading = $state(true);
  
  const clientId = $page.params.id;
  
  onMount(async () => {
    try {
      const [clientRes, invoicesRes] = await Promise.all([
        fetch(`/api/clients/${clientId}`),
        fetch(`/api/invoices?clientId=${clientId}`)
      ]);
      
      if (clientRes.ok) {
        client = await clientRes.json();
      }
      
      if (invoicesRes.ok) {
        invoices = await invoicesRes.json();
      }
    } catch (error) {
      console.error('Failed to load client:', error);
    } finally {
      isLoading = false;
    }
  });
  
  async function deleteClient() {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        const response = await fetch(`/api/clients/${clientId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          goto('/clients');
        }
      } catch (error) {
        console.error('Failed to delete client:', error);
      }
    }
  }
  
  function getTotalRevenue() {
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
  }
  
  function getPendingAmount() {
    return invoices
      .filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled')
      .reduce((sum, inv) => sum + inv.total, 0);
  }
</script>

<svelte:head>
  <title>{client?.name || 'Client'} - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <Button variant="ghost" size="icon" href="/clients">
        <ArrowLeft class="w-4 h-4" />
      </Button>
      <div>
        <h1 class="text-3xl font-bold tracking-tight">
          {client?.name || 'Loading...'}
        </h1>
        <p class="text-muted-foreground">Client details and invoice history</p>
      </div>
    </div>
    
    {#if client}
      <div class="flex gap-2">
        <Button variant="outline" href="/clients/{clientId}/edit">
          <Edit class="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button variant="destructive" onclick={deleteClient}>
          <Trash2 class="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    {/if}
  </div>
  
  {#if isLoading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else if !client}
    <Card>
      <CardContent class="pt-6">
        <p class="text-center text-muted-foreground">Client not found</p>
      </CardContent>
    </Card>
  {:else}
    <div class="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">${getTotalRevenue().toFixed(2)}</p>
          <p class="text-sm text-muted-foreground">From paid invoices</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">${getPendingAmount().toFixed(2)}</p>
          <p class="text-sm text-muted-foreground">Outstanding invoices</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-3xl font-bold">{invoices.length}</p>
          <p class="text-sm text-muted-foreground">All time</p>
        </CardContent>
      </Card>
    </div>
    
    <div class="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center space-x-3">
            <Mail class="w-4 h-4 text-muted-foreground" />
            <div>
              <p class="text-sm text-muted-foreground">Email</p>
              <p class="font-medium">{client.email}</p>
            </div>
          </div>
          
          {#if client.phone}
            <div class="flex items-center space-x-3">
              <Phone class="w-4 h-4 text-muted-foreground" />
              <div>
                <p class="text-sm text-muted-foreground">Phone</p>
                <p class="font-medium">{client.phone}</p>
              </div>
            </div>
          {/if}
          
          {#if client.address}
            <div class="flex items-start space-x-3">
              <MapPin class="w-4 h-4 text-muted-foreground mt-1" />
              <div>
                <p class="text-sm text-muted-foreground">Address</p>
                <p class="font-medium">{client.address}</p>
                {#if client.city || client.state || client.zipCode}
                  <p class="font-medium">
                    {[client.city, client.state, client.zipCode].filter(Boolean).join(', ')}
                  </p>
                {/if}
                {#if client.country}
                  <p class="font-medium">{client.country}</p>
                {/if}
              </div>
            </div>
          {/if}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          {#if client.taxId}
            <div>
              <p class="text-sm text-muted-foreground">Tax ID</p>
              <p class="font-medium">{client.taxId}</p>
            </div>
          {/if}
          
          <div>
            <p class="text-sm text-muted-foreground">Status</p>
            <Badge class={client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {client.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          <div>
            <p class="text-sm text-muted-foreground">Client Since</p>
            <p class="font-medium">{new Date(client.createdAt).toLocaleDateString()}</p>
          </div>
          
          {#if client.notes}
            <div>
              <p class="text-sm text-muted-foreground">Notes</p>
              <p class="font-medium text-sm">{client.notes}</p>
            </div>
          {/if}
        </CardContent>
      </Card>
    </div>
    
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>Invoice History</CardTitle>
          <Button href="/invoices/new?clientId={clientId}" size="sm">
            New Invoice
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {#if invoices.length === 0}
          <p class="text-center text-muted-foreground py-8">No invoices yet</p>
        {:else}
          <div class="space-y-4">
            {#each invoices as invoice}
              <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p class="font-medium">{invoice.invoiceNumber}</p>
                  <p class="text-sm text-muted-foreground">
                    Due: {new Date(invoice.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div class="flex items-center space-x-4">
                  <div class="text-right">
                    <p class="font-semibold">${invoice.total.toFixed(2)}</p>
                    <Badge class={
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" href="/invoices/{invoice.id}">
                    View
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>
