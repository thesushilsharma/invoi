<script lang="ts">
	import type { StatusDistribution } from '$lib/server/analytics';

	let {
		data = [],
		title = '',
		size = 200,
		colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
	} = $props<{
		data: StatusDistribution[];
		title?: string;
		size?: number;
		colors?: string[];
	}>();

	const radius = $derived(size / 2 - 20);
	const innerRadius = $derived(radius * 0.6);
	const center = $derived(size / 2);

	const total = $derived(data.reduce((sum, item) => sum + item.count, 0));

	const segments = $derived(() => {
		let currentAngle = -90; // Start from top
		return data.map((item, index) => {
			const percentage = total > 0 ? item.count / total : 0;
			const angle = percentage * 360;
			const startAngle = currentAngle;
			const endAngle = currentAngle + angle;
			
			currentAngle += angle;

			// Calculate path for donut segment
			const startAngleRad = (startAngle * Math.PI) / 180;
			const endAngleRad = (endAngle * Math.PI) / 180;

			const x1 = center + radius * Math.cos(startAngleRad);
			const y1 = center + radius * Math.sin(startAngleRad);
			const x2 = center + radius * Math.cos(endAngleRad);
			const y2 = center + radius * Math.sin(endAngleRad);

			const x3 = center + innerRadius * Math.cos(endAngleRad);
			const y3 = center + innerRadius * Math.sin(endAngleRad);
			const x4 = center + innerRadius * Math.cos(startAngleRad);
			const y4 = center + innerRadius * Math.sin(startAngleRad);

			const largeArcFlag = angle > 180 ? 1 : 0;

			const pathData = [
				`M ${x1} ${y1}`,
				`A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
				`L ${x3} ${y3}`,
				`A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
				'Z'
			].join(' ');

			return {
				path: pathData,
				color: colors[index % colors.length],
				item,
				percentage
			};
		});
	});

	function capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}
</script>

<div class="w-full">
	{#if title}
		<h3 class="text-lg font-semibold mb-4">{title}</h3>
	{/if}
	
	<div class="flex items-center gap-8">
		<!-- Chart -->
		<div class="relative">
			<svg width={size} height={size} class="overflow-visible">
				{#each segments as segment}
					<path
						d={segment.path}
						fill={segment.color}
						class="hover:opacity-80 transition-opacity cursor-pointer"
					>
						<title>
							{capitalizeFirst(segment.item.status)}: {segment.item.count} ({segment.item.percentage.toFixed(1)}%)
						</title>
					</path>
				{/each}

				<!-- Center text -->
				<text
					x={center}
					y={center - 5}
					text-anchor="middle"
					class="text-2xl font-bold fill-gray-700"
				>
					{total}
				</text>
				<text
					x={center}
					y={center + 15}
					text-anchor="middle"
					class="text-sm fill-gray-500"
				>
					Total
				</text>
			</svg>

			{#if data.length === 0}
				<div class="absolute inset-0 flex items-center justify-center">
					<p class="text-gray-500">No data</p>
				</div>
			{/if}
		</div>

		<!-- Legend -->
		{#if data.length > 0}
			<div class="space-y-2">
				{#each segments as segment, index}
					<div class="flex items-center gap-2">
						<div
							class="w-3 h-3 rounded-full"
							style="background-color: {segment.color}"
						></div>
						<span class="text-sm text-gray-700">
							{capitalizeFirst(segment.item.status)}
						</span>
						<span class="text-sm text-gray-500">
							({segment.item.count})
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>