<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { onMount } from 'svelte';

	let staffId = $page.params.id;
	let month = $state(new Date().toISOString().slice(0, 7));
	let isLoading = $state(true);
	let isSaving = $state(false);
	let staffMember = $state<any>(null);
	let summary = $state<any>(null);
	let records = $state<any[]>([]);

	let entryDate = $state(new Date().toISOString().split('T')[0]);
	let status = $state('present');
	let checkIn = $state('');
	let checkOut = $state('');
	let hoursWorked = $state(8);
	let notes = $state('');

	async function loadAttendance(selectedMonth: string = month) {
		isLoading = true;
		try {
			const response = await fetch(`/api/staff/${staffId}/attendance?month=${selectedMonth}`);
			if (!response.ok) {
				throw new Error('Failed to load attendance');
			}

			const data = await response.json();
			staffMember = data.staff;
			summary = data.summary;
			records = data.records;
		} catch (error) {
			console.error('Failed to load attendance:', error);
			alert('Failed to load attendance records');
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		loadAttendance(month);
	});

	function handleMonthChange() {
		loadAttendance(month);
	}

	async function saveAttendance(event: Event) {
		event.preventDefault();
		isSaving = true;

		try {
			const response = await fetch(`/api/staff/${staffId}/attendance`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: entryDate,
					status,
					checkIn: checkIn || null,
					checkOut: checkOut || null,
					hoursWorked,
					notes
				})
			});

			if (!response.ok) {
				throw new Error('Failed to save attendance');
			}

			checkIn = '';
			checkOut = '';
			hoursWorked = status === 'half_day' ? 4 : 8;
			notes = '';
			await loadAttendance();
		} catch (error) {
			console.error('Failed to save attendance:', error);
			alert('Failed to save attendance');
		} finally {
			isSaving = false;
		}
	}

	async function deleteAttendance(attendanceId: string) {
		if (!confirm('Delete this attendance entry?')) return;

		try {
			const response = await fetch(`/api/staff/${staffId}/attendance/${attendanceId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete attendance');
			}

			await loadAttendance();
		} catch (error) {
			console.error('Failed to delete attendance:', error);
			alert('Failed to delete attendance entry');
		}
	}
</script>

<svelte:head>
	<title>Attendance - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto(`/staff/${staffId}`)}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Attendance</h1>
				<p class="text-muted-foreground">
					{staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Loading staff...'}
				</p>
			</div>
		</div>

		<div class="space-y-2">
			<Label for="month">Month</Label>
			<Input id="month" type="month" bind:value={month} class="w-48" onchange={handleMonthChange} />
		</div>
	</div>

	{#if summary}
		<div class="grid gap-4 md:grid-cols-4">
			<Card><CardContent class="pt-6"><p class="text-sm text-muted-foreground">Working Days</p><p class="text-2xl font-bold">{summary.workingDays}</p></CardContent></Card>
			<Card><CardContent class="pt-6"><p class="text-sm text-muted-foreground">Paid Days</p><p class="text-2xl font-bold text-green-700">{summary.paidDays}</p></CardContent></Card>
			<Card><CardContent class="pt-6"><p class="text-sm text-muted-foreground">LOP Days</p><p class="text-2xl font-bold text-red-700">{summary.lopDays}</p></CardContent></Card>
			<Card><CardContent class="pt-6"><p class="text-sm text-muted-foreground">Hours Worked</p><p class="text-2xl font-bold">{summary.totalHours}</p></CardContent></Card>
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[360px,1fr]">
		<Card>
			<CardHeader>
				<CardTitle>Record Attendance</CardTitle>
			</CardHeader>
			<CardContent>
				<form class="space-y-4" onsubmit={saveAttendance}>
					<div class="space-y-2">
						<Label for="entryDate">Date</Label>
						<Input id="entryDate" type="date" bind:value={entryDate} required />
					</div>

					<div class="space-y-2">
						<Label for="status">Status</Label>
						<select id="status" bind:value={status} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
							<option value="present">Present</option>
							<option value="late">Late</option>
							<option value="half_day">Half Day</option>
							<option value="absent">Absent</option>
							<option value="on_leave">On Leave</option>
						</select>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="checkIn">Check In</Label>
							<Input id="checkIn" type="time" bind:value={checkIn} />
						</div>
						<div class="space-y-2">
							<Label for="checkOut">Check Out</Label>
							<Input id="checkOut" type="time" bind:value={checkOut} />
						</div>
					</div>

					<div class="space-y-2">
						<Label for="hoursWorked">Hours Worked</Label>
						<Input id="hoursWorked" type="number" bind:value={hoursWorked} min="0" step="0.25" />
					</div>

					<div class="space-y-2">
						<Label for="notes">Notes</Label>
						<Textarea id="notes" bind:value={notes} rows={3} />
					</div>

					<Button type="submit" class="w-full" disabled={isSaving}>
						{isSaving ? 'Saving...' : 'Save Attendance'}
					</Button>
				</form>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Attendance Entries</CardTitle>
			</CardHeader>
			<CardContent>
				{#if isLoading}
					<div class="flex h-48 items-center justify-center">
						<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
					</div>
				{:else if records.length === 0}
					<div class="py-12 text-center text-muted-foreground">
						<p>No attendance records for this month yet.</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full border-collapse text-sm">
							<thead>
								<tr class="border-b text-left">
									<th class="p-3">Date</th>
									<th class="p-3">Status</th>
									<th class="p-3">Check In</th>
									<th class="p-3">Check Out</th>
									<th class="p-3">Hours</th>
									<th class="p-3">Notes</th>
									<th class="p-3"></th>
								</tr>
							</thead>
							<tbody>
								{#each records as record (record.id)}
									<tr class="border-b">
										<td class="p-3">{record.date}</td>
										<td class="p-3 capitalize">{record.status.replace('_', ' ')}</td>
										<td class="p-3">{record.checkIn || '-'}</td>
										<td class="p-3">{record.checkOut || '-'}</td>
										<td class="p-3">{Number(record.hoursWorked || 0).toFixed(2)}</td>
										<td class="p-3">{record.notes || '-'}</td>
										<td class="p-3 text-right">
											<Button variant="ghost" size="icon" onclick={() => deleteAttendance(record.id)}>
												<Trash2 class="h-4 w-4" />
											</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
