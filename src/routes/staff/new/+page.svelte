<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { goto } from '$app/navigation';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import { fileToBase64, validateImageFile } from '$lib/utils/image-handler';

	let employeeId = $state(`EMP-${Date.now()}`);
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
	let joinDate = $state(new Date().toISOString().split('T')[0]);
	let basicSalary = $state(0);
	let allowances = $state(0);
	
	let bankName = $state('');
	let accountNumber = $state('');
	let iban = $state('');
	
	let address = $state('');
	let signature = $state('');
	let status = $state('active');
	
	let isSubmitting = $state(false);

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

			const response = await fetch('/api/staff', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (response.ok) {
				const staff = await response.json();
				goto(`/staff/${staff.id}`);
			} else {
				throw new Error('Failed to create staff');
			}
		} catch (error) {
			console.error('Failed to create staff:', error);
			alert('Failed to create staff member');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Add Staff - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Add New Staff Member</h1>
		<p class="text-muted-foreground">Fill in the employee details below</p>
	</div>

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
						<Input id="basicSalary" type="number" bind:value={basicSalary} min="0" step="0.01" required />
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
								<img src={signature} alt="Signature" class="h-20 w-32 object-contain border rounded" />
								<button
									type="button"
									onclick={() => (signature = '')}
									class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
								>
									<X class="h-3 w-3" />
								</button>
							</div>
						{:else}
							<div class="h-20 w-32 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
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
							<p class="text-xs text-muted-foreground mt-1">PNG or JPG (max 2MB)</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Submit -->
		<div class="flex justify-end gap-4">
			<Button type="button" variant="outline" onclick={() => goto('/staff')}>
				Cancel
			</Button>
			<Button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Creating...' : 'Create Staff Member'}
			</Button>
		</div>
	</form>
</div>
