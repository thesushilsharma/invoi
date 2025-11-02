<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { FileText, Palette, Check, Eye } from '@lucide/svelte';
	import type { InvoiceTemplate } from '$lib/server/db/schema';

	let {
		templates = [],
		selectedTemplate = null,
		onselect,
		showPreview = true
	} = $props<{
		templates: InvoiceTemplate[];
		selectedTemplate?: InvoiceTemplate | null;
		onselect: (template: InvoiceTemplate) => void;
		showPreview?: boolean;
	}>();

	function getTemplateTypeLabel(type: string): string {
		const labels: Record<string, string> = {
			standard: 'Standard',
			modern: 'Modern',
			classic: 'Classic',
			minimal: 'Minimal',
			custom: 'Custom'
		};
		return labels[type] || type;
	}

	function getTemplateTypeColor(type: string): string {
		const colors: Record<string, string> = {
			standard: 'bg-blue-100 text-blue-800',
			modern: 'bg-purple-100 text-purple-800',
			classic: 'bg-green-100 text-green-800',
			minimal: 'bg-gray-100 text-gray-800',
			custom: 'bg-orange-100 text-orange-800'
		};
		return colors[type] || 'bg-gray-100 text-gray-800';
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold">Choose Template</h3>
		<Button variant="outline" size="sm" href="/templates/new">
			<Palette class="mr-2 h-4 w-4" />
			Create Custom
		</Button>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each templates as template}
			<Card 
				class="cursor-pointer transition-all hover:shadow-md {selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''}"
				onclick={() => onselect(template)}
			>
				<CardHeader class="pb-3">
					<div class="flex items-center justify-between">
						<CardTitle class="text-base">{template.name}</CardTitle>
						{#if selectedTemplate?.id === template.id}
							<Check class="h-5 w-5 text-blue-600" />
						{/if}
					</div>
					<div class="flex items-center space-x-2">
						<Badge class={getTemplateTypeColor(template.type)}>
							{getTemplateTypeLabel(template.type)}
						</Badge>
						{#if template.isDefault}
							<Badge variant="outline">Default</Badge>
						{/if}
					</div>
				</CardHeader>

				<CardContent class="space-y-3">
					{#if template.description}
						<p class="text-sm text-muted-foreground">{template.description}</p>
					{/if}

					<!-- Color Preview -->
					<div class="flex items-center space-x-2">
						<span class="text-xs text-muted-foreground">Colors:</span>
						<div 
							class="w-4 h-4 rounded-full border"
							style="background-color: {template.primaryColor}"
							title="Primary Color"
						></div>
						<div 
							class="w-4 h-4 rounded-full border"
							style="background-color: {template.secondaryColor}"
							title="Secondary Color"
						></div>
					</div>

					<!-- Font Family -->
					{#if template.fontFamily}
						<div class="text-xs text-muted-foreground">
							Font: {template.fontFamily}
						</div>
					{/if}

					{#if showPreview}
						<div class="flex space-x-2">
							<Button 
								variant="outline" 
								size="sm" 
								class="flex-1"
								onclick={(e) => {
									e.stopPropagation();
									// Open preview in new tab
									window.open(`/api/templates/${template.id}/preview`, '_blank');
								}}
							>
								<Eye class="mr-2 h-3 w-3" />
								Preview
							</Button>
							<Button 
								size="sm" 
								class="flex-1"
								onclick={(e) => {
									e.stopPropagation();
									onselect(template);
								}}
							>
								Select
							</Button>
						</div>
					{/if}
				</CardContent>
			</Card>
		{/each}

		{#if templates.length === 0}
			<div class="col-span-full py-8 text-center text-muted-foreground">
				<FileText class="mx-auto mb-4 h-12 w-12 opacity-50" />
				<p>No templates available</p>
				<p class="text-sm">Create your first template to get started</p>
				<Button class="mt-4" href="/templates/new">
					<Palette class="mr-2 h-4 w-4" />
					Create Template
				</Button>
			</div>
		{/if}
	</div>
</div>