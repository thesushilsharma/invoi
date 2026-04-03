<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle, Clock, Calendar, CheckCircle2, AlertCircle, ChevronRight, PieChart } from '@lucide/svelte';
	import type { TeamTimesheetData } from '$lib/server/payroll';
	import { goto } from '$app/navigation';

	let timesheetData = $state<TeamTimesheetData | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let currentMonth = $state(new Date().toISOString().slice(0, 7));

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		isLoading = true;
		error = null;
		try {
			const res = await fetch(`/api/timesheets?month=${currentMonth}`);
			if (res.ok) {
				timesheetData = await res.json();
			} else {
				error = 'Failed to load timesheet data';
			}
		} catch (e) {
			error = 'Error connecting to server';
		} finally {
			isLoading = false;
		}
	}

	function formatHours(hours: number) {
		return `${hours.toFixed(1)}h`;
	}
</script>

<svelte:head>
	<title>Timesheets - Invoice Manager</title>
</svelte:head>

<div class="space-y-8 animate-in fade-in duration-500 pb-12">
	<!-- Hero Section with Marketing Copy -->
	<section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-slate-50 p-8 md:p-12 shadow-2xl">
		<div class="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
			<Clock class="w-64 h-64 text-indigo-400" />
		</div>
		
		<div class="relative z-10 max-w-3xl space-y-6">
			<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 text-sm font-medium backdrop-blur-sm">
				<Clock size={16} />
				<span>Smart time tracking</span>
			</div>
			
			<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
				Don't waste time. <br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Track it.</span>
			</h1>
			
			<p class="text-lg text-slate-300 leading-relaxed max-w-2xl">
				Timesheets allows you to automate time tracking, eliminate leakage, and boost billable hours. All within an interface powered by smart recommendations.
			</p>
			
			<div class="grid sm:grid-cols-2 gap-6 pt-6 border-t border-slate-800/60">
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-indigo-300 font-semibold">
						<AlertCircle size={18} />
						<h3>Where did all those hours go? Stop wondering.</h3>
					</div>
					<p class="text-sm text-slate-400 leading-relaxed">
						Launch a timer on the fly, and ensure timesheets are always linked to the correct project or task. No more missing data.
					</p>
				</div>
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-emerald-400 font-semibold">
						<PieChart size={18} />
						<h3>Make every minute count. Keep it profitable.</h3>
					</div>
					<p class="text-sm text-slate-400 leading-relaxed">
						Get an overview of your billable time by team member, project, task, and billing type to maximize revenue.
					</p>
				</div>
			</div>
		</div>
	</section>

	{#if isLoading}
		<div class="flex items-center justify-center py-20">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
		</div>
	{:else if error}
		<div class="bg-destructive/10 text-destructive p-6 rounded-xl border border-destructive/20 text-center">
			<AlertTriangle class="mx-auto mb-2 h-8 w-8 opacity-80" />
			<p class="font-medium">{error}</p>
			<Button variant="outline" class="mt-4" onclick={loadData}>Retry</Button>
		</div>
	{:else if timesheetData}
		<!-- Stats Overview -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card class="bg-card shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500">
				<CardContent class="p-6">
					<div class="flex flex-row items-center justify-between space-y-0 pb-2">
						<p class="text-sm font-medium text-muted-foreground">Total Hours Logged</p>
						<Clock class="h-4 w-4 text-blue-500" />
					</div>
					<div class="text-3xl font-bold">{timesheetData.totals.totalHours.toFixed(1)}h</div>
					<p class="text-xs flex items-center mt-1 text-muted-foreground">
						Across {timesheetData.totals.staffCount} team members
					</p>
				</CardContent>
			</Card>

			<Card class="bg-card shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-500">
				<CardContent class="p-6">
					<div class="flex flex-row items-center justify-between space-y-0 pb-2">
						<p class="text-sm font-medium text-muted-foreground">Expected Tracked Time</p>
						<Calendar class="h-4 w-4 text-emerald-500" />
					</div>
					<div class="text-3xl font-bold">{timesheetData.totals.coveragePercent}%</div>
					<div class="w-full bg-secondary h-2 mt-2 rounded-full overflow-hidden">
						<div class="bg-emerald-500 h-full" style="width: {Math.min(timesheetData.totals.coveragePercent, 100)}%"></div>
					</div>
				</CardContent>
			</Card>

			<Card class="bg-card shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-500">
				<CardContent class="p-6">
					<div class="flex flex-row items-center justify-between space-y-0 pb-2">
						<p class="text-sm font-medium text-muted-foreground">Overtime Trend</p>
						<AlertTriangle class="h-4 w-4 text-amber-500" />
					</div>
					<div class="text-3xl font-bold">{timesheetData.totals.overtimeHours.toFixed(1)}h</div>
					<p class="text-xs flex items-center mt-1 {timesheetData.totals.overtimeHours > 20 ? 'text-amber-500 font-medium' : 'text-muted-foreground'}">
						{timesheetData.totals.overtimeHours > 20 ? 'Action may be required' : 'Within normal limits'}
					</p>
				</CardContent>
			</Card>

			<Card class="bg-card shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-500">
				<CardContent class="p-6">
					<div class="flex flex-row items-center justify-between space-y-0 pb-2">
						<p class="text-sm font-medium text-muted-foreground">Billable Impact</p>
						<CheckCircle2 class="h-4 w-4 text-purple-500" />
					</div>
					<div class="text-3xl font-bold">{timesheetData.totals.paidDays} <span class="text-lg font-normal text-muted-foreground">days</span></div>
					<p class="text-xs flex items-center mt-1 text-muted-foreground">
						Logged and payable this period
					</p>
				</CardContent>
			</Card>
		</div>

		<div class="grid xl:grid-cols-3 gap-8">
			<!-- Main Staff Breakdown Table -->
			<div class="xl:col-span-2 space-y-6">
				<div>
					<h2 class="text-xl font-bold flex items-center gap-2">
						Team Breakdown
						<span class="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">{timesheetData.members.length} members</span>
					</h2>
					<p class="text-muted-foreground text-sm mt-1">Detailed overview of tracked time and attendance coverage.</p>
				</div>
				
				<div class="bg-card border rounded-xl shadow-sm overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left">
							<thead class="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
								<tr>
									<th class="px-6 py-4 font-medium">Team Member</th>
									<th class="px-6 py-4 font-medium">Coverage</th>
									<th class="px-6 py-4 font-medium text-right">Tracked Hrs</th>
									<th class="px-6 py-4 font-medium text-right">Overtime</th>
									<th class="px-6 py-4 font-medium text-center">Actions</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each timesheetData.members as member (member.staffId)}
									<tr class="hover:bg-muted/30 transition-colors group">
										<td class="px-6 py-4">
											<div class="flex items-center gap-3">
												<div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
													{member.name.charAt(0)}
												</div>
												<div>
													<p class="font-medium text-foreground">{member.name}</p>
													<p class="text-xs text-muted-foreground">{member.position}</p>
												</div>
											</div>
										</td>
										<td class="px-6 py-4">
											<div class="space-y-1">
												<div class="flex justify-between text-xs">
													<span>{member.coveragePercent}%</span>
													<span class="text-muted-foreground">{member.trackedEntries}/{member.expectedEntries} days</span>
												</div>
												<div class="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
													<div 
														class="h-full rounded-full {member.coveragePercent < 50 ? 'bg-destructive' : member.coveragePercent < 80 ? 'bg-amber-400' : 'bg-emerald-500'}" 
														style="width: {Math.min(member.coveragePercent, 100)}%"
													></div>
												</div>
											</div>
										</td>
										<td class="px-6 py-4 text-right font-medium">
											{formatHours(member.totalHours)}
										</td>
										<td class="px-6 py-4 text-right">
											{#if member.overtimeHours > 0}
												<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
													+{formatHours(member.overtimeHours)}
												</span>
											{:else}
												<span class="text-muted-foreground">-</span>
											{/if}
										</td>
										<td class="px-6 py-4 text-center">
											<Button 
												variant="ghost" 
												size="sm" 
												class="opacity-0 group-hover:opacity-100 transition-opacity"
												onclick={() => goto(`/staff/${member.staffId}/attendance`)}
											>
												View Records <ChevronRight class="w-4 h-4 ml-1" />
											</Button>
										</td>
									</tr>
								{/each}
								{#if timesheetData.members.length === 0}
									<tr>
										<td colspan="5" class="px-6 py-8 text-center text-muted-foreground">
											No team members found. Add staff to start tracking time.
										</td>
									</tr>
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<!-- Leakage Alerts Sidebar -->
			<div class="space-y-6">
				<div>
					<h2 class="text-xl font-bold flex items-center gap-2 text-amber-600 dark:text-amber-500">
						<AlertTriangle size={20} />
						Smart Alerts
					</h2>
					<p class="text-muted-foreground text-sm mt-1">Leakage alerts and tracking anomalies.</p>
				</div>

				<div class="space-y-4">
					{#each timesheetData.recommendations as rec, i (i)}
						<div class="p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors cursor-pointer group" onclick={() => rec.staffId && goto(`/staff/${rec.staffId}/attendance`)}>
							<div class="flex gap-3">
								<div class="mt-0.5">
									{#if rec.type === 'missing'}
										<AlertCircle class="text-destructive w-5 h-5" />
									{:else if rec.type === 'undertracked'}
										<Clock class="text-amber-500 w-5 h-5" />
									{:else}
										<AlertTriangle class="text-blue-500 w-5 h-5" />
									{/if}
								</div>
								<div>
									<h4 class="font-medium text-sm group-hover:text-primary transition-colors">{rec.title}</h4>
									<p class="text-xs text-muted-foreground mt-1 leading-relaxed">{rec.message}</p>
									{#if rec.staffId}
										<span class="inline-flex items-center text-xs text-primary mt-2 font-medium">
											Resolve issue <ChevronRight size={14} class="ml-0.5" />
										</span>
									{/if}
								</div>
							</div>
						</div>
					{/each}
					{#if timesheetData.recommendations.length === 0}
						<div class="p-8 rounded-xl border border-dashed text-center flex flex-col items-center justify-center bg-muted/10">
							<div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
								<CheckCircle2 class="w-6 h-6" />
							</div>
							<h3 class="font-medium text-sm">All clear!</h3>
							<p class="text-xs text-muted-foreground mt-1">No leakage detected. Timesheets look healthy.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
