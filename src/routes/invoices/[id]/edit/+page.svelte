<script lang="ts">
	import InvoiceForm from '$lib/components/invoice-form.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="container mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">Edit Invoice</h1>
	<InvoiceForm invoice={data.invoice} />
</div>