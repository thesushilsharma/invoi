<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Bell, CheckCircle, AlertCircle, Clock } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import type { Notification } from '$lib/server/db/schema';
  
  let notifications = $state<Notification[]>([]);
  let isLoading = $state(true);
  
  onMount(async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        notifications = await response.json();
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      isLoading = false;
    }
  });
  
  function getNotificationIcon(type: string) {
    switch (type) {
      case 'payment_received': return CheckCircle;
      case 'overdue': return AlertCircle;
      case 'reminder': return Clock;
      default: return Bell;
    }
  }
  
  function getNotificationColor(type: string) {
    switch (type) {
      case 'payment_received': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'reminder': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<svelte:head>
  <title>Notifications - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight">Notifications</h1>
    <p class="text-muted-foreground">
      Stay updated with invoice reminders and payment notifications
    </p>
  </div>
  
  <Card>
    <CardHeader>
      <CardTitle>Recent Notifications</CardTitle>
    </CardHeader>
    <CardContent>
      {#if isLoading}
        <div class="flex items-center justify-center h-32">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      {:else if notifications.length === 0}
        <div class="text-center py-12">
          <Bell class="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 class="text-lg font-medium mb-2">No notifications</h3>
          <p class="text-muted-foreground">
            You're all caught up! Notifications will appear here.
          </p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each notifications as notification}
            {@const Icon = getNotificationIcon(notification.type)}
            <div class="flex items-start space-x-4 p-4 border rounded-lg">
              <div class="w-10 h-10 rounded-full flex items-center justify-center {getNotificationColor(notification.type)}">
                <Icon class="w-5 h-5" />
              </div>
              
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <Badge class={getNotificationColor(notification.type)}>
                    {notification.type.replace('_', ' ')}
                  </Badge>
                  <span class="text-xs text-muted-foreground">
                    {notification.sentAt ? new Date(notification.sentAt).toLocaleDateString() : 'Scheduled'}
                  </span>
                </div>
                <p class="text-sm">{notification.message}</p>
                {#if notification.scheduledFor && !notification.sentAt}
                  <p class="text-xs text-muted-foreground mt-1">
                    Scheduled for: {new Date(notification.scheduledFor).toLocaleString()}
                  </p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </CardContent>
  </Card>
</div>
