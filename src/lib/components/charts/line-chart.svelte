<script lang="ts">
	import type { MonthlyData } from '$lib/server/analytics';

	let {
		data = [],
		title = '',
		height = 300,
		color = '#3b82f6',
		showGrid = true,
		showLabels = true
	} = $props<{
		data: MonthlyData[];
		title?: string;
		height?: number;
		color?: string;
		showGrid?: boolean;
		showLabels?: boolean;
	}>();

	const maxValue = $derived(Math.max(...data.map(d => d.value), 0));
	const minValue = $derived(Math.min(...data.map(d => d.value), 0));
	const range = $derived(maxValue - minValue || 1);

	function getY(value: number): number {
		return height - 60 - ((value - minValue) / range) * (height - 100);
	}

	function getX(index: number): number {
		return 60 + (index * (800 - 120)) / Math.max(data.length - 1, 1);
	}

	const pathData = $derived(() => {
		if (data.length === 0) return '';
		
		let path = `M ${getX(0)} ${getY(data[0].value)}`;
		for (let i = 1; i < data.length; i++) {
			path += ` L ${getX(i)} ${getY(data[i].value)}`;
		}
		return path;
	});

	const gridLines = $derived(() => {
		const lines = [];
		const steps = 5;
		for (let i = 0; i <= steps; i++) {
			const value = minValue + (range * i) / steps;
			const y = getY(value);
			lines.push({ y, value });
		}
		return lines;
	});
</script>

<div class="w-full">
	{#if title}
		<h3 class="text-lg font-semibold mb-4">{title}</h3>
	{/if}
	
	<div class="relative">
		<svg width="100%" viewBox="0 0 800 {height}" class="overflow-visible">
			<!-- Grid lines -->
			{#if showGrid}
				{#each gridLines as line}
					<line
						x1="60"
						y1={line.y}
						x2="740"
						y2={line.y}
						stroke="#e5e7eb"
						stroke-width="1"
						stroke-dasharray="2,2"
					/>
				{/each}
			{/if}

			<!-- Y-axis labels -->
			{#if showLabels}
				{#each gridLines as line}
					<text
						x="50"
						y={line.y + 4}
						text-anchor="end"
						class="text-xs fill-gray-500"
					>
						${Math.round(line.value).toLocaleString()}
					</text>
				{/each}
			{/if}

			<!-- Line -->
			{#if data.length > 0}
				<path
					d={pathData}
					fill="none"
					stroke={color}
					stroke-width="3"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>

				<!-- Data points -->
				{#each data as point, index}
					<circle
						cx={getX(index)}
						cy={getY(point.value)}
						r="4"
						fill={color}
						class="hover:r-6 transition-all cursor-pointer"
					>
						<title>{point.month}: ${point.value.toLocaleString()}</title>
					</circle>
				{/each}
			{/if}

			<!-- X-axis labels -->
			{#if showLabels}
				{#each data as point, index}
					<text
						x={getX(index)}
						y={height - 20}
						text-anchor="middle"
						class="text-xs fill-gray-500"
					>
						{point.month}
					</text>
				{/each}
			{/if}
		</svg>

		{#if data.length === 0}
			<div class="absolute inset-0 flex items-center justify-center">
				<p class="text-gray-500">No data available</p>
			</div>
		{/if}
	</div>
</div>