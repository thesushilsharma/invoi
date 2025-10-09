<script lang="ts">
	import type { StatusDistribution } from '$lib/server/analytics';

	let {
		data = [],
		title = '',
		height = 300,
		colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
	} = $props<{
		data: StatusDistribution[];
		title?: string;
		height?: number;
		colors?: string[];
	}>();

	const maxValue = $derived(Math.max(...data.map(d => d.count), 0));
	const barWidth = $derived(data.length > 0 ? (800 - 120) / data.length * 0.8 : 0);

	function getBarHeight(value: number): number {
		return maxValue > 0 ? (value / maxValue) * (height - 100) : 0;
	}

	function getX(index: number): number {
		const spacing = (800 - 120) / data.length;
		return 60 + index * spacing + (spacing - barWidth) / 2;
	}

	function getY(value: number): number {
		return height - 60 - getBarHeight(value);
	}

	function capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<div class="w-full">
	{#if title}
		<h3 class="text-lg font-semibold mb-4">{title}</h3>
	{/if}
	
	<div class="relative">
		<svg width="100%" viewBox="0 0 800 {height}" class="overflow-visible">
			<!-- Grid lines -->
			{#each Array(6) as _, i}
				{@const value = (maxValue * i) / 5}
				{@const y = height - 60 - (value / maxValue) * (height - 100)}
				<line
					x1="60"
					y1={y}
					x2="740"
					y2={y}
					stroke="#e5e7eb"
					stroke-width="1"
					stroke-dasharray="2,2"
				/>
				<text
					x="50"
					y={y + 4}
					text-anchor="end"
					class="text-xs fill-gray-500"
				>
					{Math.round(value)}
				</text>
			{/each}

			<!-- Bars -->
			{#each data as item, index}
				<rect
					x={getX(index)}
					y={getY(item.count)}
					width={barWidth}
					height={getBarHeight(item.count)}
					fill={colors[index % colors.length]}
					class="hover:opacity-80 transition-opacity cursor-pointer"
				>
					<title>{capitalizeFirst(item.status)}: {item.count} ({item.percentage.toFixed(1)}%)</title>
				</rect>

				<!-- Value labels on bars -->
				<text
					x={getX(index) + barWidth / 2}
					y={getY(item.count) - 5}
					text-anchor="middle"
					class="text-xs fill-gray-700 font-medium"
				>
					{item.count}
				</text>

				<!-- X-axis labels -->
				<text
					x={getX(index) + barWidth / 2}
					y={height - 20}
					text-anchor="middle"
					class="text-xs fill-gray-500"
				>
					{capitalizeFirst(item.status)}
				</text>
			{/each}
		</svg>

		{#if data.length === 0}
			<div class="absolute inset-0 flex items-center justify-center">
				<p class="text-gray-500">No data available</p>
			</div>
		{/if}
	</div>
</div>