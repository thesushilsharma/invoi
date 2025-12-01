<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let staff = $state<any[]>([]);
	let filteredStaff = $state<any[]>([]);
	let searchQuery = $state('');
	let isLoading = $state(true);

	onMount(async () => {
		await loadStaff();
	});

	async function loadStaff() {
		isLoading = true;
		try {
			const response = await fetch('/api/staff');
			if (response.ok) {
				staff = await response.json();
				filteredStaff = staff;
			}
		} catch (error) {
			console.error('Failed to load staff:', error);
		} finally {
			isLoading = false;
		}
	}

	$effect(() => {
		if (searchQuery) {
			filteredStaff = staff.filter(
				(s) =>
					s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
					s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
					s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
					s.position.toLowerCase().includes(searchQuery.toLowerCase())
			);
		} else {
			filteredStaff = staff;
		}
	});

	function getStatusColor(status: string) {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800';
			case 'on_leave':
				return 'bg-yellow-100 text-yellow-800';
			case 'terminated':
				return 'bg-red-100 text-red-800';
			case 'suspended':
				return 'bg-gray-100 text-gray-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<svelte:head>
	<title>Staff Management - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Staff Management</h1>
			<p class="text-muted-foreground">Manage your employees and their details</p>
		</div>
		<Button onclick={() => goto('/staff/new')}>
			<Plus class="h-4 w-4 mr-2" />
			Add Staff
		</Button>
	</div>

	<Card>
		<CardHeader>
			<div class="flex items-center gap-4">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						bind:value={searchQuery}
						placeholder="Search by name, employee ID, or position..."
						class="pl-10"
					/>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			{#if isLoading}
				<div class="flex items-center justify-center h-64">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			{:else if filteredStaff.length === 0}
				<div class="text-center py-12">
					<p class="text-muted-foreground">No staff members found</p>
					<Button onclick={() => goto('/staff/new')} class="mt-4">
						<Plus class="h-4 w-4 mr-2" />
						Add First Staff Member
					</Button>
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="text-left p-3 font-medium">Employee ID</th>
								<th class="text-left p-3 font-medium">Name</th>
								<th class="text-left p-3 font-medium">Position</th>
								<th class="text-left p-3 font-medium">Department</th>
								<th class="text-left p-3 font-medium">Email</th>
								<th class="text-left p-3 font-medium">Status</th>
								<th class="text-left p-3 font-medium">Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredStaff as member}
								<tr class="border-b hover:bg-muted/50">
									<td class="p-3 font-mono text-sm">{member.employeeId}</td>
									<td class="p-3">{member.firstName} {member.lastName}</td>
									<td class="p-3">{member.position}</td>
									<td class="p-3">{member.department || '-'}</td>
									<td class="p-3 text-sm">{member.email}</td>
									<td class="p-3">
										<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(member.status)}">
											{member.status.replace('_', ' ')}
										</span>
									</td>
									<td class="p-3">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => goto(`/staff/${member.id}`)}
										>
											View
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
