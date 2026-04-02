<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import PayslipPreview from '$lib/components/PayslipPreview.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Download from '@lucide/svelte/icons/download';
	import { onMount } from 'svelte';
	import { exportElementToPdf } from '$lib/utils/html2canvas-pdf';

	let staffId = $page.params.id;
	let month = $state(new Date().toISOString().slice(0, 7));
	let isLoading = $state(true);
	let isSaving = $state(false);
	let isDownloading = $state(false);
	let staffMember = $state<any>(null);
	let companySettings = $state<any>(null);
	let payslips = $state<any[]>([]);
	let basePreview = $state<any>(null);
	let summary = $state<any>(null);
	let previewContainer: HTMLElement;

	let paymentDate = $state(new Date().toISOString().split('T')[0]);
	let overtime = $state(0);
	let bonus = $state(0);
	let taxDeduction = $state(0);
	let otherDeductions = $state(0);
	let notes = $state('');
	let isPaid = $state(false);

	const preview = $derived(
		basePreview
			? {
					...basePreview,
					paymentDate,
					overtime,
					bonus,
					taxDeduction,
					otherDeductions,
					grossSalary: Number((basePreview.basicSalary + basePreview.allowances + overtime + bonus).toFixed(2)),
					netSalary: Number((basePreview.basicSalary + basePreview.allowances + overtime + bonus - taxDeduction - otherDeductions).toFixed(2))
				}
			: null
	);

	async function loadPayslips(selectedMonth: string = month) {
		isLoading = true;
		try {
			const [payslipResponse, settingsResponse] = await Promise.all([
				fetch(`/api/staff/${staffId}/payslips?month=${selectedMonth}`),
				fetch('/api/settings')
			]);

			if (!payslipResponse.ok) {
				throw new Error('Failed to load payslip data');
			}

			const payslipData = await payslipResponse.json();
			staffMember = payslipData.staff;
			summary = payslipData.summary;
			payslips = payslipData.payslips;
			basePreview = payslipData.preview;

			if (settingsResponse.ok) {
				companySettings = await settingsResponse.json();
			}
		} catch (error) {
			console.error('Failed to load payslip data:', error);
			alert('Failed to load payslip data');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadPayslips(month);
	});

	function handleMonthChange() {
		loadPayslips(month);
	}

	async function generatePayslip(event: Event) {
		event.preventDefault();
		isSaving = true;
		try {
			const response = await fetch(`/api/staff/${staffId}/payslips`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					month,
					paidDate: paymentDate,
					overtime,
					bonus,
					taxDeduction,
					otherDeductions,
					notes,
					isPaid
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create payslip');
			}

			const data = await response.json();
			basePreview = data.preview;
			await loadPayslips();
			alert('Payslip generated successfully');
		} catch (error) {
			console.error('Failed to generate payslip:', error);
			alert('Failed to generate payslip');
		} finally {
			isSaving = false;
		}
	}

	async function downloadPayslipPdf() {
		if (!preview || !staffMember || !previewContainer) return;

		isDownloading = true;
		try {
			await new Promise((resolve) => setTimeout(resolve, 200));

			const images = previewContainer.querySelectorAll('img');
			if (images.length > 0) {
				await Promise.all(
					Array.from(images).map(
						(img) =>
							new Promise((resolve) => {
								if (img.complete) {
									resolve(undefined);
								} else {
									img.onload = () => resolve(undefined);
									img.onerror = () => resolve(undefined);
									setTimeout(() => resolve(undefined), 2000);
								}
							})
					)
				);
			}

			const fileMonth = preview.month || month;
			const fileName = `${staffMember.employeeId}-${fileMonth}-payslip.pdf`;
			await exportElementToPdf(previewContainer, fileName);
		} catch (error) {
			console.error('Failed to download payslip PDF:', error);
			alert('Failed to download payslip PDF');
		} finally {
			isDownloading = false;
		}
	}
</script>

<svelte:head>
	<title>Payslips - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto(`/staff/${staffId}`)}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Payslips</h1>
				<p class="text-muted-foreground">
					{staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Loading staff...'}
				</p>
			</div>
		</div>

		<div class="space-y-2">
			<Label for="month">Payslip Month</Label>
			<Input id="month" type="month" bind:value={month} class="w-48" onchange={handleMonthChange} />
		</div>
	</div>

	{#if summary}
		<div class="grid gap-4 md:grid-cols-4">
			<Card><CardContent class="pt-6"><p class="text-sm text-muted-foreground">Paid Days</p><p class="text-2xl font-bold">{summary.paidDays}</p></CardContent></Card>
			<Card><CardContent class="pt-6"><p class="text-sm text-muted-foreground">LOP Days</p><p class="text-2xl font-bold text-red-700">{summary.lopDays}</p></CardContent></Card>
			<Card><CardContent class="pt-6"><p class="text-sm text-muted-foreground">Hours Worked</p><p class="text-2xl font-bold">{summary.totalHours}</p></CardContent></Card>
			<Card><CardContent class="pt-6"><p class="text-sm text-muted-foreground">Overtime Hours</p><p class="text-2xl font-bold">{summary.overtimeHours}</p></CardContent></Card>
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[360px,1fr]">
		<Card>
			<CardHeader>
				<CardTitle>Generate Payslip</CardTitle>
			</CardHeader>
			<CardContent>
				<form class="space-y-4" onsubmit={generatePayslip}>
					<div class="space-y-2">
						<Label for="paymentDate">Payment Date</Label>
						<Input id="paymentDate" type="date" bind:value={paymentDate} required />
					</div>
					<div class="space-y-2">
						<Label for="overtime">Overtime (AED)</Label>
						<Input id="overtime" type="number" bind:value={overtime} min="0" step="0.01" />
					</div>
					<div class="space-y-2">
						<Label for="bonus">Bonus (AED)</Label>
						<Input id="bonus" type="number" bind:value={bonus} min="0" step="0.01" />
					</div>
					<div class="space-y-2">
						<Label for="taxDeduction">Tax Deduction (AED)</Label>
						<Input id="taxDeduction" type="number" bind:value={taxDeduction} min="0" step="0.01" />
					</div>
					<div class="space-y-2">
						<Label for="otherDeductions">Other Deductions (AED)</Label>
						<Input id="otherDeductions" type="number" bind:value={otherDeductions} min="0" step="0.01" />
					</div>
					<div class="space-y-2">
						<Label for="notes">Notes</Label>
						<Textarea id="notes" bind:value={notes} rows={3} />
					</div>
					<label class="flex items-center gap-2 text-sm">
						<input type="checkbox" bind:checked={isPaid} class="rounded border-gray-300" />
						Mark as paid
					</label>
					<Button type="button" variant="outline" class="w-full" onclick={downloadPayslipPdf} disabled={!preview || isDownloading}>
						<Download class="mr-2 h-4 w-4" />
						{isDownloading ? 'Generating PDF...' : 'Download Payslip PDF'}
					</Button>
					<Button type="submit" class="w-full" disabled={isSaving}>
						{isSaving ? 'Generating...' : 'Generate Payslip'}
					</Button>
				</form>
			</CardContent>
		</Card>

		<div class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Payslip Preview</CardTitle>
				</CardHeader>
				<CardContent>
					{#if isLoading}
						<div class="flex h-64 items-center justify-center">
							<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
						</div>
					{:else}
						<PayslipPreview {companySettings} {staffMember} {preview} />
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Generated Payslips</CardTitle>
				</CardHeader>
				<CardContent>
					{#if payslips.length === 0}
						<div class="py-8 text-center text-muted-foreground">
							<p>No payslips generated yet.</p>
						</div>
					{:else}
						<div class="space-y-3">
							{#each payslips as payslip (payslip.id)}
								<div class="flex items-center justify-between rounded-lg border p-4 text-sm">
									<div>
										<p class="font-medium">{payslip.month}</p>
										<p class="text-muted-foreground">
											Gross: AED {Number(payslip.grossSalary || 0).toFixed(2)} | Net: AED {Number(payslip.netSalary || 0).toFixed(2)}
										</p>
									</div>
									<div class="text-right">
										<p class="font-medium">{payslip.isPaid ? 'Paid' : 'Draft'}</p>
										<p class="text-muted-foreground">{payslip.paidDate || '-'}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>

	<div class="pointer-events-none fixed top-0 left-0 -z-50 opacity-0" style="width: 210mm; min-height: 297mm;">
		<div bind:this={previewContainer}>
			<PayslipPreview {companySettings} {staffMember} {preview} />
		</div>
	</div>
</div>
