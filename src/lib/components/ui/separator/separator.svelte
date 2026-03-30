<script lang="ts">
  import { cn } from '$lib/utils';
  
  interface Props {
    class?: string;
    [key: string]: any;
  }
  
  let { class: className, ...restProps }: Props = $props();
</script>

<div class={cn('shrink-0 bg-border h-px w-full', className)} {...restProps}></div>
