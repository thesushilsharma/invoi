<script lang="ts">
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Badge } from '$lib/components/ui/badge';
	import { CurrencyService, SUPPORTED_CURRENCIES } from '$lib/server/currency-service';
	import type { CurrencyInfo } from '$lib/server/currency-service';

	let {
		selectedCurrency = 'USD',
		onchange,
		showExchangeRate = false,
		baseCurrency = 'USD',
		disabled = false
	} = $props<{
		selectedCurrency?: string;
		onchange: (currency: string) => void;
		showExchangeRate?: boolean;
		baseCurrency?: string;
		disabled?: boolean;
	}>();

	let exchangeRate = $state<number | null>(null);
	let isLoadingRate = $state(false);

	const currencies = $derived(Object.values(SUPPORTED_CURRENCIES));

	// Load exchange rate when currency changes
	$effect(() => {
		if (showExchangeRate && selectedCurrency !== baseCurrency) {
			isLoadingRate = true;
			CurrencyService.getExchangeRate(baseCurrency, selectedCurrency)
				.then(rate => {
					exchangeRate = rate;
				})
				.catch(error => {
					console.error('Failed to load exchange rate:', error);
					exchangeRate = null;
				})
				.finally(() => {
					isLoadingRate = false;
				});
		} else {
			exchangeRate = null;
		}
	});

	// Watch for currency changes and call onchange
	$effect(() => {
		onchange(selectedCurrency);
	});

	function formatExchangeRate(rate: number): string {
		return `1 ${baseCurrency} = ${rate.toFixed(4)} ${selectedCurrency}`;
	}
</script>

<div class="space-y-2">
	<Select bind:value={selectedCurrency} {disabled} type="single">
		<SelectTrigger class="w-full">
			{#if selectedCurrency}
				<div class="flex items-center space-x-2">
					<span class="font-medium">{SUPPORTED_CURRENCIES[selectedCurrency]?.symbol}</span>
					<span>{selectedCurrency}</span>
					<span class="text-muted-foreground">- {SUPPORTED_CURRENCIES[selectedCurrency]?.name}</span>
				</div>
			{:else}
				<span class="text-muted-foreground">Select currency</span>
			{/if}
		</SelectTrigger>
		<SelectContent>
			{#each currencies as currency}
				<SelectItem value={currency.code}>
					<div class="flex items-center justify-between w-full">
						<div class="flex items-center space-x-2">
							<span class="font-medium w-8">{currency.symbol}</span>
							<span class="font-medium">{currency.code}</span>
							<span class="text-muted-foreground">{currency.name}</span>
						</div>
					</div>
				</SelectItem>
			{/each}
		</SelectContent>
	</Select>

	{#if showExchangeRate && selectedCurrency !== baseCurrency}
		<div class="text-sm">
			{#if isLoadingRate}
				<Badge variant="outline">Loading rate...</Badge>
			{:else if exchangeRate}
				<Badge variant="secondary">
					{formatExchangeRate(exchangeRate)}
				</Badge>
			{:else}
				<Badge variant="destructive">Rate unavailable</Badge>
			{/if}
		</div>
	{/if}
</div>