<script lang="ts">
	let {
		value = 0,
		max = 100,
		class: className = ''
	} = $props<{
		value?: number;
		max?: number;
		class?: string;
	}>();

	const percentage = $derived(Math.min(Math.max((value / max) * 100, 0), 100));
</script>

<div class="relative w-full overflow-hidden rounded-full bg-secondary {className}">
	<div 
		class="h-full w-full flex-1 bg-primary transition-all duration-300 ease-in-out"
		style="transform: translateX(-{100 - percentage}%)"
	></div>
</div>