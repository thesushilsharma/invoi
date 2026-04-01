<script lang="ts">
	import EnhancedInvoiceFormNew from '$lib/components/enhanced-invoice-form-new.svelte';

	interface Props {
		initialData?: any;
		templates?: unknown[];
		onSubmit: (data: any) => Promise<void>;
		onSaveDraft?: (data: any) => Promise<void>;
		onPreview?: (data: any) => void;
	}

	let { initialData = null, onSubmit }: Props = $props();
</script>

<EnhancedInvoiceFormNew {initialData} {onSubmit} />
