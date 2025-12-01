<script lang="ts">
	import type { Invoice, InvoiceItem } from '$lib/server/db/schema';

	interface Props {
		logoUrl?: string;
		stampUrl?: string;
		signatureUrl?: string;
		companyName?: string;
		companyNameAr?: string;
		companyPhone?: string;
		companyAddress?: string;
		companyEmail?: string;
		companyTrn?: string;
		invoice?: Invoice | null;
		items?: InvoiceItem[];
	}

	let { 
		logoUrl, 
		stampUrl, 
		signatureUrl,
		companyName = 'Your Company Name',
		companyNameAr = 'اسم شركتك',
		companyPhone = '+971 XXX XX XXXX',
		companyAddress = 'Your Company Address',
		companyEmail = 'email@company.com',
		companyTrn = 'XXXXXXXXXXXXX',
		invoice = null,
		items = []
	}: Props = $props();

	function formatDate(dateString: string | null | undefined): string {
		if (!dateString) return 'DD-MM-YYYY';
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
		} catch {
			return 'DD-MM-YYYY';
		}
	}

	function formatCurrency(amount: number | null | undefined, currency: string = 'AED'): string {
		if (amount === null || amount === undefined) return `${currency}0.00`;
		return `${currency}${amount.toFixed(2)}`;
	}
</script>

<div class="border-2 border-gray-300 rounded-lg p-6 bg-white shadow-lg max-w-4xl mx-auto">
	<div class="text-xs space-y-3">
		<!-- Header -->
		<div class="border-2 border-black p-4 relative min-h-[100px] flex items-center">
			{#if logoUrl}
				<img src={logoUrl} crossorigin="anonymous" alt="Logo" class="absolute left-3 top-3 h-16 w-16 object-contain border border-gray-300 rounded" />
			{:else}
				<div class="absolute left-3 top-3 h-16 w-16 border-2 border-dashed border-gray-400 rounded flex items-center justify-center text-gray-400 text-xs">
					LOGO
				</div>
			{/if}
			
			<div class="text-center flex-1">
				<div class="text-sm text-gray-700 mb-1">{companyNameAr}</div>
				<div class="font-bold text-xl mb-2">{companyName}</div>
				<div class="text-[10px] space-y-0.5">
					<div>Mob : {companyPhone}</div>
					<div>{companyAddress}</div>
					<div>Email: {companyEmail}</div>
					<div>TRN No. : {companyTrn}</div>
				</div>
			</div>
		</div>

		<!-- Tax Invoice Title -->
		<div class="bg-gray-300 text-center py-2 font-bold text-base border-y-2 border-black">
			Tax Invoice
		</div>

		<!-- Client & Invoice Info -->
		<div class="border-2 border-black p-3 flex justify-between text-[10px]">
			<div class="space-y-0.5">
				<div class="font-bold text-sm">{invoice?.clientName || 'Lorem Ipsum Client Ltd'}</div>
				{#if invoice?.clientAddress}
					{#each invoice.clientAddress.split('\n').filter(line => line.trim()) as line}
						<div>{line}</div>
					{/each}
				{:else}
					<div>Lorem ipsum dolor sit amet</div>
					<div>Consectetur adipiscing elit</div>
					<div>Sed do eiusmod tempor</div>
				{/if}
				{#if invoice?.clientTrn}
					<div class="mt-1">TRN : {invoice.clientTrn}</div>
				{:else}
					<div class="mt-1">TRN : XXXXXXXXXXXXX</div>
				{/if}
			</div>
			<div class="text-right space-y-1">
				<div>Date - <span class="font-bold">{formatDate(invoice?.issueDate)}</span></div>
				<div>Invoice #: <span class="font-bold">{invoice?.invoiceNumber || 'XXXX'}</span></div>
			</div>
		</div>

		{#if invoice?.department}
			<div class="text-right text-[10px] font-bold">Department : {invoice.department}</div>
		{/if}

		<!-- Items Table -->
		<table class="w-full border-collapse border-2 border-black text-[9px]">
			<thead>
				<tr class="bg-gray-300">
					<th class="border border-black p-2 font-bold">S.NO</th>
					<th class="border border-black p-2 font-bold">Date</th>
					<th class="border border-black p-2 font-bold">Particulars</th>
					<th class="border border-black p-2 font-bold">Quantity</th>
					<th class="border border-black p-2 font-bold">Hour</th>
					<th class="border border-black p-2 font-bold">Per Hour</th>
					<th class="border border-black p-2 font-bold">VAT 5%</th>
					<th class="border border-black p-2 font-bold">Amount</th>
				</tr>
			</thead>
			<tbody>
				{#if items && items.length > 0}
					{#each items as item, index}
						<tr>
							<td class="border border-black p-2 text-center">{index + 1}</td>
							<td class="border border-black p-2">{formatDate(item.date)}</td>
							<td class="border border-black p-2">{item.description || '-'}</td>
							<td class="border border-black p-2 text-center">{item.quantity?.toFixed(2) || '0.00'}</td>
							<td class="border border-black p-2 text-center">{item.hours?.toFixed(2) || '0.00'}</td>
							<td class="border border-black p-2">{formatCurrency(item.unitPrice, invoice?.currency || 'AED')}</td>
							<td class="border border-black p-2">{formatCurrency(item.vatAmount, invoice?.currency || 'AED')}</td>
							<td class="border border-black p-2">{formatCurrency(item.total, invoice?.currency || 'AED')}</td>
						</tr>
					{/each}
					{#if items.length < 4}
						{#each Array(4 - items.length) as _}
							<tr>
								<td class="border border-black p-2 h-8"></td>
								<td class="border border-black p-2"></td>
								<td class="border border-black p-2"></td>
								<td class="border border-black p-2"></td>
								<td class="border border-black p-2"></td>
								<td class="border border-black p-2"></td>
								<td class="border border-black p-2"></td>
								<td class="border border-black p-2"></td>
							</tr>
						{/each}
					{/if}
				{:else}
					<tr>
						<td class="border border-black p-2 text-center">1</td>
						<td class="border border-black p-2">DD-MM-YY</td>
						<td class="border border-black p-2">Lorem ipsum service</td>
						<td class="border border-black p-2 text-center">10</td>
						<td class="border border-black p-2 text-center">120</td>
						<td class="border border-black p-2">AED14.00</td>
						<td class="border border-black p-2">AED84.00</td>
						<td class="border border-black p-2">AED1,680.00</td>
					</tr>
					{#each Array(3) as _, i}
						<tr>
							<td class="border border-black p-2 h-8"></td>
							<td class="border border-black p-2"></td>
							<td class="border border-black p-2"></td>
							<td class="border border-black p-2"></td>
							<td class="border border-black p-2"></td>
							<td class="border border-black p-2"></td>
							<td class="border border-black p-2"></td>
							<td class="border border-black p-2"></td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>

		<!-- Totals -->
		<div class="flex justify-end mt-2">
			<table class="border-collapse border-2 border-black text-[10px] min-w-[280px]">
				<tbody>
					<tr class="bg-gray-100">
						<td class="border border-black p-2 font-bold">Total Amt Excl VAT</td>
						<td class="border border-black p-2 text-right font-semibold">{formatCurrency(invoice?.subtotal, invoice?.currency || 'AED')}</td>
					</tr>
					<tr>
						<td class="border border-black p-2 font-bold">Total Quantity</td>
						<td class="border border-black p-2 text-right">{invoice?.totalQuantity?.toFixed(2) || '0.00'}</td>
					</tr>
					<tr class="bg-gray-100">
						<td class="border border-black p-2 font-bold">Total VAT %</td>
						<td class="border border-black p-2 text-right">{formatCurrency(invoice?.taxAmount, invoice?.currency || 'AED')}</td>
					</tr>
					<tr>
						<td class="border border-black p-2 font-bold">Total Amt Incl VAT</td>
						<td class="border border-black p-2 text-right font-bold text-base">{formatCurrency(invoice?.total, invoice?.currency || 'AED')}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Footer -->
		<div class="flex justify-between items-end mt-4 gap-4">
			<div class="border-2 border-black p-3 flex-1 max-w-md">
				<div class="font-bold text-[10px] mb-2">AMOUNT IN WORDS:</div>
				<div class="text-[9px] leading-relaxed text-gray-700">
					{#if invoice?.amountInWords}
						{@html invoice.amountInWords.replace(/\n/g, '<br />')}
					{:else}
						ONE THOUSAND SEVEN HUNDRED<br />
						SIXTY FOUR DIRHAMS ONLY
					{/if}
				</div>
				
				{#if stampUrl}
					<img src={stampUrl} crossorigin="anonymous" alt="Stamp" class="h-16 w-16 object-contain mx-auto mt-3" />
				{:else}
					<div class="h-16 w-16 border-2 border-dashed border-gray-400 rounded-full mx-auto mt-3 flex items-center justify-center text-gray-400 text-xs">
						STAMP
					</div>
				{/if}
			</div>

			<div class="text-center flex flex-col items-center">
				{#if signatureUrl}
					<img src={signatureUrl} crossorigin="anonymous" alt="Signature" class="h-12 w-32 object-contain mb-2" />
				{:else}
					<div class="h-12 w-32 border-b-2 border-black mb-2 flex items-center justify-center text-gray-400 text-xs">
						Signature
					</div>
				{/if}
				<div class="text-[9px] italic font-medium">Authorized Signature</div>
			</div>
		</div>
	</div>
</div>

<style>
	table {
		font-size: 7px;
	}
</style>
