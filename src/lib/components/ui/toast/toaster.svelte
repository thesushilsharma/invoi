<script lang="ts">
  import { toasts } from './toast';
  import { CheckCircle, XCircle, Info, AlertTriangle, X } from '@lucide/svelte';
  import { fly } from 'svelte/transition';
  
  function getIcon(type: string) {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      case 'warning': return AlertTriangle;
      default: return Info;
    }
  }
  
  function getColor(type: string) {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  }
  
  function removeToast(id: string) {
    toasts.update((all) => all.filter((t) => t.id !== id));
  }
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
  {#each $toasts as toast (toast.id)}
    {@const Icon = getIcon(toast.type)}
    <div
      transition:fly={{ x: 300, duration: 300 }}
      class="flex items-center gap-3 p-4 rounded-lg border shadow-lg {getColor(toast.type)}"
    >
      <Icon class="w-5 h-5 flex-shrink-0" />
      <p class="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onclick={() => removeToast(toast.id)}
        class="flex-shrink-0 hover:opacity-70"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {/each}
</div>
