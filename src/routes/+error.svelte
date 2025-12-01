<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { AlertCircle, Home } from '@lucide/svelte';
</script>

<svelte:head>
  <title>Error - Invoice Manager</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4">
  <Card class="max-w-md w-full">
    <CardContent class="pt-6">
      <div class="text-center space-y-4">
        <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle class="w-8 h-8 text-red-600" />
        </div>
        
        <div>
          <h1 class="text-2xl font-bold mb-2">
            {$page.status === 404 ? 'Page Not Found' : 'Something Went Wrong'}
          </h1>
          <p class="text-muted-foreground">
            {$page.error?.message || 'An unexpected error occurred'}
          </p>
        </div>
        
        <Button href="/" class="w-full">
          <Home class="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </CardContent>
  </Card>
</div>
