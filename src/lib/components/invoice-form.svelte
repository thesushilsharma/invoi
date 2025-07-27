<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Textarea } from '$lib/components/ui/textarea';
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
    import { Plus, Trash2 } from '@lucide/svelte';
    import { invoiceSchema, type InvoiceFormData } from '$lib/schemas/invoice.js';
    import { generateInvoiceNumber, calculateItemTotal, calculateSubtotal, calculateTaxAmount, calculateTotal } from '$lib/utils/calculations.js';
    
    let { onSubmit, initialData = null } = $props<{
      onSubmit: (data: InvoiceFormData) => Promise<void>;
      initialData?: InvoiceFormData | null;
    }>();
    
    let formData = $state<InvoiceFormData>({
      invoiceNumber: initialData?.invoiceNumber || generateInvoiceNumber(),
      clientName: initialData?.clientName || '',
      clientEmail: initialData?.clientEmail || '',
      clientAddress: initialData?.clientAddress || '',
      issueDate: initialData?.issueDate || new Date().toISOString().split('T')[0],
      dueDate: initialData?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: initialData?.taxRate || 10,
      items: initialData?.items || [{ description: '', quantity: 1, unitPrice: 0 }],
      notes: initialData?.notes || '',
      isRecurring: initialData?.isRecurring || false,
      recurringInterval: initialData?.recurringInterval || 'monthly'
    });
    
    let errors = $state<Record<string, string>>({});
    let isSubmitting = $state(false);
    
    const subtotal = $derived(calculateSubtotal(
      formData.items.map(item => ({
        ...item,
        total: calculateItemTotal(item.quantity, item.unitPrice)
      }))
    ));
    
    const taxAmount = $derived(calculateTaxAmount(subtotal, formData.taxRate));
    const total = $derived(calculateTotal(subtotal, taxAmount));
    
    // Define recurring interval options
    const recurringIntervals = [
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'yearly', label: 'Yearly' }
    ];
    
    // Get the label for the selected recurring interval
    const selectedIntervalLabel = $derived(
      recurringIntervals.find(interval => interval.value === formData.recurringInterval)?.label || 'Select interval'
    );
    
    function addItem() {
      formData.items.push({ description: '', quantity: 1, unitPrice: 0 });
    }
    
    function removeItem(index: number) {
      if (formData.items.length > 1) {
        formData.items.splice(index, 1);
      }
    }
    
    function updateItemTotal(index: number) {
      const item = formData.items[index];
      if (item) {
        item.total = calculateItemTotal(item.quantity, item.unitPrice);
      }
    }
    
    async function handleSubmit(event: Event) {
      event.preventDefault();
      try {
        isSubmitting = true;
        errors = {};
        
        const result = invoiceSchema.safeParse(formData);
        if (!result.success) {
          result.error.errors.forEach(error => {
            errors[error.path.join('.')] = error.message;
          });
          return;
        }
        
        await onSubmit(result.data);
      } catch (error) {
        console.error('Form submission error:', error);
        errors.general = 'Failed to save invoice. Please try again.';
      } finally {
        isSubmitting = false;
      }
    }
  </script>
  
  <form onsubmit={handleSubmit} class="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Invoice Details</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label for="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              bind:value={formData.invoiceNumber}
              class={errors.invoiceNumber ? 'border-red-500' : ''}
            />
            {#if errors.invoiceNumber}
              <p class="text-sm text-red-500 mt-1">{errors.invoiceNumber}</p>
            {/if}
          </div>
          
          <div>
            <Label for="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              bind:value={formData.taxRate}
              class={errors.taxRate ? 'border-red-500' : ''}
            />
            {#if errors.taxRate}
              <p class="text-sm text-red-500 mt-1">{errors.taxRate}</p>
            {/if}
          </div>
          
          <div>
            <Label for="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              type="date"
              bind:value={formData.issueDate}
              class={errors.issueDate ? 'border-red-500' : ''}
            />
            {#if errors.issueDate}
              <p class="text-sm text-red-500 mt-1">{errors.issueDate}</p>
            {/if}
          </div>
          
          <div>
            <Label for="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              bind:value={formData.dueDate}
              class={errors.dueDate ? 'border-red-500' : ''}
            />
            {#if errors.dueDate}
              <p class="text-sm text-red-500 mt-1">{errors.dueDate}</p>
            {/if}
          </div>
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle>Client Information</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label for="clientName">Client Name</Label>
          <Input
            id="clientName"
            bind:value={formData.clientName}
            class={errors.clientName ? 'border-red-500' : ''}
          />
          {#if errors.clientName}
            <p class="text-sm text-red-500 mt-1">{errors.clientName}</p>
          {/if}
        </div>
        
        <div>
          <Label for="clientEmail">Client Email</Label>
          <Input
            id="clientEmail"
            type="email"
            bind:value={formData.clientEmail}
            class={errors.clientEmail ? 'border-red-500' : ''}
          />
          {#if errors.clientEmail}
            <p class="text-sm text-red-500 mt-1">{errors.clientEmail}</p>
          {/if}
        </div>
        
        <div>
          <Label for="clientAddress">Client Address</Label>
          <Textarea
            id="clientAddress"
            bind:value={formData.clientAddress}
            class={errors.clientAddress ? 'border-red-500' : ''}
            rows={3}
          />
          {#if errors.clientAddress}
            <p class="text-sm text-red-500 mt-1">{errors.clientAddress}</p>
          {/if}
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          Invoice Items
          <Button type="button" variant="outline" size="sm" onclick={addItem}>
            <Plus class="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          {#each formData.items as item, index}
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
              <div class="md:col-span-2">
                <Label for="description-{index}">Description</Label>
                <Input
                  id="description-{index}"
                  bind:value={item.description}
                  placeholder="Item description"
                />
              </div>
              
              <div>
                <Label for="quantity-{index}">Quantity</Label>
                <Input
                  id="quantity-{index}"
                  type="number"
                  step="0.01"
                  min="0.01"
                  bind:value={item.quantity}
                  oninput={() => updateItemTotal(index)}
                />
              </div>
              
              <div>
                <Label for="unitPrice-{index}">Unit Price</Label>
                <Input
                  id="unitPrice-{index}"
                  type="number"
                  step="0.01"
                  min="0"
                  bind:value={item.unitPrice}
                  oninput={() => updateItemTotal(index)}
                />
              </div>
              
              <div class="flex items-end gap-2">
                <div class="flex-1">
                  <Label>Total</Label>
                  <div class="h-10 px-3 py-2 border rounded-md bg-muted">
                    ${calculateItemTotal(item.quantity, item.unitPrice).toFixed(2)}
                  </div>
                </div>
                {#if formData.items.length > 1}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onclick={() => removeItem(index)}
                    class="text-red-500 hover:text-red-700"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        
        <div class="mt-6 space-y-2 text-right">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>Tax ({formData.taxRate}%):</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader>
        <CardTitle>Additional Options</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label for="notes">Notes</Label>
          <Textarea
            id="notes"
            bind:value={formData.notes}
            placeholder="Additional notes or terms..."
            rows={3}
          />
        </div>
        
        <div class="flex items-center space-x-2">
          <Checkbox
            id="isRecurring"
            bind:checked={formData.isRecurring}
          />
          <Label for="isRecurring">Make this a recurring invoice</Label>
        </div>
        
        {#if formData.isRecurring}
          <div>
            <Label for="recurringInterval">Recurring Interval</Label>
            <Select bind:value={formData.recurringInterval}>
              <SelectTrigger>
                {selectedIntervalLabel}
              </SelectTrigger>
              <SelectContent>
                {#each recurringIntervals as interval}
                  <SelectItem value={interval.value}>{interval.label}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>
        {/if}
      </CardContent>
    </Card>
    
    {#if errors.general}
      <div class="p-4 bg-red-50 border border-red-200 rounded-md">
        <p class="text-red-700">{errors.general}</p>
      </div>
    {/if}
    
    <div class="flex gap-4">
      <Button type="submit" disabled={isSubmitting} class="flex-1">
        {isSubmitting ? 'Saving...' : 'Save Invoice'}
      </Button>
      <Button type="button" variant="outline">
        Save as Draft
      </Button>
    </div>
  </form>