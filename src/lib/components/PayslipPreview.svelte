<script lang="ts">
	import type { Staff, Settings } from '$lib/server/db/schema';
	import type { PayslipPreviewData } from '$lib/server/payroll';

	interface Props {
		companySettings?: Settings | null;
		staffMember: Staff | null;
		preview: PayslipPreviewData | null;
	}

	let { companySettings = null, staffMember, preview }: Props = $props();

	function formatCurrency(value: number | null | undefined) {
		return `AED ${(value || 0).toFixed(2)}`;
	}

	function formatMonth(value: string | undefined) {
		if (!value) return '';
		const [year, month] = value.split('-').map(Number);
		return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric'
		});
	}

	const earnings = $derived(
		preview
			? [
					{ label: 'Basic Salary', value: preview.basicSalary },
					{ label: 'Allowances', value: preview.allowances },
					{ label: 'Overtime', value: preview.overtime },
					{ label: 'Bonus', value: preview.bonus }
				].filter((item) => item.value > 0)
			: []
	);

	const deductions = $derived(
		preview
			? [
					{ label: 'Tax Deduction', value: preview.taxDeduction },
					{ label: 'Other Deductions', value: preview.otherDeductions }
				].filter((item) => item.value > 0)
			: []
	);
</script>

<div class="rounded-xl border bg-white p-6 shadow-sm">
	{#if staffMember && preview}
		<div class="mb-6 flex items-start justify-between gap-6 border-b pb-4">
			<div>
				<h2 class="text-2xl font-bold">{companySettings?.companyName || 'Company Name'}</h2>
				<p class="text-sm text-muted-foreground">{companySettings?.companyAddress || 'Company Address'}</p>
				<p class="text-sm text-muted-foreground">{companySettings?.companyEmail || 'company@example.com'}</p>
			</div>
			<div class="text-right">
				<h3 class="text-xl font-semibold">Payslip</h3>
				<p class="text-sm text-muted-foreground">{formatMonth(preview.month)}</p>
				<p class="text-sm text-muted-foreground">Payment Date: {preview.paymentDate}</p>
			</div>
		</div>

		<div class="mb-6 grid gap-4 md:grid-cols-2">
			<div class="space-y-1">
				<p class="text-sm text-muted-foreground">Employee Name</p>
				<p class="font-medium">{staffMember.firstName} {staffMember.lastName}</p>
				<p class="text-sm text-muted-foreground">Employee ID: {staffMember.employeeId}</p>
				<p class="text-sm text-muted-foreground">Pay Period: {formatMonth(preview.month)}</p>
			</div>
			<div class="space-y-1 text-left md:text-right">
				<p class="text-sm text-muted-foreground">Total Paid Days: {preview.attendance.paidDays}</p>
				<p class="text-sm text-muted-foreground">Loss of Pay (LOP) Days: {preview.attendance.lopDays}</p>
				<p class="text-sm text-muted-foreground">Total Hours Worked: {preview.attendance.totalHours}</p>
				<p class="text-sm text-muted-foreground">Overtime Hours: {preview.attendance.overtimeHours}</p>
			</div>
		</div>

		<div class="grid gap-6 md:grid-cols-2">
			<div>
				<h4 class="mb-3 font-semibold">Earnings</h4>
				<div class="space-y-2 rounded-lg border p-4">
					{#each earnings as item (item.label)}
						<div class="flex justify-between text-sm">
							<span>{item.label}</span>
							<span class="font-medium">{formatCurrency(item.value)}</span>
						</div>
					{/each}
					{#if earnings.length === 0}
						<p class="text-sm text-muted-foreground">No earnings components added.</p>
					{/if}
				</div>
			</div>

			<div>
				<h4 class="mb-3 font-semibold">Deductions</h4>
				<div class="space-y-2 rounded-lg border p-4">
					{#each deductions as item (item.label)}
						<div class="flex justify-between text-sm">
							<span>{item.label}</span>
							<span class="font-medium">{formatCurrency(item.value)}</span>
						</div>
					{/each}
					{#if deductions.length === 0}
						<p class="text-sm text-muted-foreground">No deductions applied.</p>
					{/if}
				</div>
			</div>
		</div>

		<div class="mt-6 grid gap-4 md:grid-cols-2">
			<div class="rounded-lg border p-4">
				<p class="text-sm text-muted-foreground">Gross Income</p>
				<p class="mt-1 text-2xl font-bold">{formatCurrency(preview.grossSalary)}</p>
			</div>
			<div class="rounded-lg border p-4">
				<p class="text-sm text-muted-foreground">Net Income</p>
				<p class="mt-1 text-2xl font-bold text-green-700">{formatCurrency(preview.netSalary)}</p>
			</div>
		</div>
	{:else}
		<div class="py-12 text-center text-muted-foreground">
			<p>Select a staff member and month to preview the payslip.</p>
		</div>
	{/if}
</div>
