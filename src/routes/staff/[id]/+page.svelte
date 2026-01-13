<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { fileToBase64, validateImageFile } from '$lib/utils/image-handler';
	import { onMount } from 'svelte';

	let staffId = $page.params.id;
	let isLoading = $state(true);
	let isSubmitting = $state(false);
	let isDeleting = $state(false);

	let employeeId = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');
	let dateOfBirth = $state('');
	let nationality = $state('');

	let emiratesId = $state('');
	let emiratesIdExpiry = $state('');
	let visaNumber = $state('');
	let visaExpiry = $state('');
	let passportNumber = $state('');
	let passportExpiry = $state('');

	let position = $state('');
	let department = $state('');
	let joinDate = $state('');
	let basicSalary = $state(0);
	let allowances = $state(0);

	let bankName = $state('');
	let accountNumber = $state('');
	let iban = $state('');

	let address = $state('');
	let signature = $state('');
	let status = $state('active');

	onMount(async () => {
		try {
			const response = await fetch(`/api/staff/${staffId}`);
			if (response.ok) {
				const data = await response.json();
				// Populate form
				employeeId = data.employeeId || '';
				firstName = data.firstName || '';
				lastName = data.lastName || '';
				email = data.email || '';
				phone = data.phone || '';
				dateOfBirth = data.dateOfBirth || '';
				nationality = data.nationality || '';

				emiratesId = data.emiratesId || '';
				emiratesIdExpiry = data.emiratesIdExpiry || '';
				visaNumber = data.visaNumber || '';
				visaExpiry = data.visaExpiry || '';
				passportNumber = data.passportNumber || '';
				passportExpiry = data.passportExpiry || '';

				position = data.position || '';
				department = data.department || '';
				joinDate = data.joinDate || '';
				basicSalary = data.basicSalary || 0;
				allowances = data.allowances || 0;

				bankName = data.bankName || '';
				accountNumber = data.accountNumber || '';
				iban = data.iban || '';

				address = data.address || '';
				signature = data.signature || '';
				status = data.status || 'active';
			} else {
				console.error('Failed to load staff details');
				goto('/staff');
			}
		} catch (error) {
			console.error('Error loading staff details:', error);
			goto('/staff');
		} finally {
			isLoading = false;
		}
	});

	async function handleSignatureUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		const validation = validateImageFile(file);
		if (!validation.valid) {
			alert(validation.error);
			return;
		}

		try {
			signature = await fileToBase64(file);
		} catch (error) {
			console.error('Failed to upload signature:', error);
			alert('Failed to upload signature');
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		isSubmitting = true;

		try {
			const data = {
				employeeId,
				firstName,
				lastName,
				email,
				phone,
				dateOfBirth,
				nationality,
				emiratesId,
				emiratesIdExpiry,
				visaNumber,
				visaExpiry,
				passportNumber,
				passportExpiry,
				position,
				department,
				joinDate,
				basicSalary,
				allowances,
				bankName,
				accountNumber,
				iban,
				address,
				signature,
				status
			};

			const response = await fetch(`/api/staff/${staffId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (response.ok) {
				alert('Staff member updated successfully');
			} else {
				throw new Error('Failed to update staff');
			}
		} catch (error) {
			console.error('Failed to update staff:', error);
			alert('Failed to update staff member');
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDelete() {
		if (
			!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')
		) {
			return;
		}

		isDeleting = true;
		try {
			const response = await fetch(`/api/staff/${staffId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				goto('/staff');
			} else {
				throw new Error('Failed to delete staff');
			}
		} catch (error) {
			console.error('Failed to delete staff:', error);
			alert('Failed to delete staff member');
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Staff - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" size="icon" onclick={() => goto('/staff')}>
				<ArrowLeft class="h-4 w-4" />
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Edit Staff Member</h1>
				<p class="text-muted-foreground">{firstName} {lastName}</p>
			</div>
		</div>
		<Button variant="destructive" onclick={handleDelete} disabled={isDeleting}>
			<Trash2 class="mr-2 h-4 w-4" />
			{isDeleting ? 'Deleting...' : 'Delete Staff'}
		</Button>
	</div>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Personal Information -->
			<Card>
				<CardHeader>
					<CardTitle>Personal Information</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="employeeId">Employee ID</Label>
							<Input id="employeeId" bind:value={employeeId} required />
						</div>

						<div class="space-y-2">
							<Label for="status">Status</Label>
							<select
								id="status"
								bind:value={status}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value="active">Active</option>
								<option value="on_leave">On Leave</option>
								<option value="suspended">Suspended</option>
								<option value="terminated">Terminated</option>
							</select>
						</div>

						<div class="space-y-2">
							<Label for="firstName">First Name</Label>
							<Input id="firstName" bind:value={firstName} required />
						</div>

						<div class="space-y-2">
							<Label for="lastName">Last Name</Label>
							<Input id="lastName" bind:value={lastName} required />
						</div>

						<div class="space-y-2">
							<Label for="email">Email</Label>
							<Input id="email" type="email" bind:value={email} required />
						</div>

						<div class="space-y-2">
							<Label for="phone">Phone</Label>
							<Input id="phone" bind:value={phone} />
						</div>

						<div class="space-y-2">
							<Label for="dateOfBirth">Date of Birth</Label>
							<Input id="dateOfBirth" type="date" bind:value={dateOfBirth} />
						</div>

						<div class="space-y-2">
							<Label for="nationality">Nationality</Label>
							<Input id="nationality" bind:value={nationality} />
						</div>
					</div>

					<div class="space-y-2">
						<Label for="address">Address</Label>
						<Textarea id="address" bind:value={address} rows={2} />
					</div>
				</CardContent>
			</Card>

			<!-- Emirates ID & Visa Details -->
			<Card>
				<CardHeader>
					<CardTitle>Emirates ID & Visa Details</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="emiratesId">Emirates ID</Label>
							<Input id="emiratesId" bind:value={emiratesId} placeholder="784-XXXX-XXXXXXX-X" />
						</div>

						<div class="space-y-2">
							<Label for="emiratesIdExpiry">Emirates ID Expiry</Label>
							<Input id="emiratesIdExpiry" type="date" bind:value={emiratesIdExpiry} />
						</div>

						<div class="space-y-2">
							<Label for="visaNumber">Visa Number</Label>
							<Input id="visaNumber" bind:value={visaNumber} />
						</div>

						<div class="space-y-2">
							<Label for="visaExpiry">Visa Expiry</Label>
							<Input id="visaExpiry" type="date" bind:value={visaExpiry} />
						</div>

						<div class="space-y-2">
							<Label for="passportNumber">Passport Number</Label>
							<Input id="passportNumber" bind:value={passportNumber} />
						</div>

						<div class="space-y-2">
							<Label for="passportExpiry">Passport Expiry</Label>
							<Input id="passportExpiry" type="date" bind:value={passportExpiry} />
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Employment Details -->
			<Card>
				<CardHeader>
					<CardTitle>Employment Details</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="position">Position</Label>
							<Input id="position" bind:value={position} required />
						</div>

						<div class="space-y-2">
							<Label for="department">Department</Label>
							<Input id="department" bind:value={department} />
						</div>

						<div class="space-y-2">
							<Label for="joinDate">Join Date</Label>
							<Input id="joinDate" type="date" bind:value={joinDate} required />
						</div>

						<div class="space-y-2">
							<Label for="basicSalary">Basic Salary (AED)</Label>
							<Input
								id="basicSalary"
								type="number"
								bind:value={basicSalary}
								min="0"
								step="0.01"
								required
							/>
						</div>

						<div class="space-y-2">
							<Label for="allowances">Allowances (AED)</Label>
							<Input id="allowances" type="number" bind:value={allowances} min="0" step="0.01" />
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Bank Details -->
			<Card>
				<CardHeader>
					<CardTitle>Bank Details</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="bankName">Bank Name</Label>
							<Input id="bankName" bind:value={bankName} />
						</div>

						<div class="space-y-2">
							<Label for="accountNumber">Account Number</Label>
							<Input id="accountNumber" bind:value={accountNumber} />
						</div>

						<div class="space-y-2 md:col-span-2">
							<Label for="iban">IBAN</Label>
							<Input id="iban" bind:value={iban} placeholder="AE07XXXXXXXXXXXXXXXXXXXX" />
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Digital Signature -->
			<Card>
				<CardHeader>
					<CardTitle>Digital Signature</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-2">
						<Label>Employee Signature</Label>
						<div class="flex items-center gap-4">
							{#if signature}
								<div class="relative">
									<img
										src={signature}
										alt="Signature"
										class="h-20 w-32 rounded border object-contain"
									/>
									<button
										type="button"
										onclick={() => (signature = '')}
										class="text-destructive-foreground absolute -top-2 -right-2 rounded-full bg-destructive p-1"
									>
										<X class="h-3 w-3" />
									</button>
								</div>
							{:else}
								<div
									class="flex h-20 w-32 items-center justify-center rounded border-2 border-dashed text-muted-foreground"
								>
									<Upload class="h-6 w-6" />
								</div>
							{/if}
							<div class="flex-1">
								<Input
									type="file"
									accept="image/png,image/jpeg,image/jpg"
									onchange={handleSignatureUpload}
									class="cursor-pointer"
								/>
								<p class="mt-1 text-xs text-muted-foreground">PNG or JPG (max 2MB)</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Submit -->
			<div class="flex justify-end gap-4">
				<Button type="button" variant="outline" onclick={() => goto('/staff')}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Save Changes'}
				</Button>
			</div>
		</form>
	{/if}
</div>
