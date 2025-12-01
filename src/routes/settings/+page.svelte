<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { toast } from '$lib/components/ui/toast';
	import { onMount } from 'svelte';
	import { fileToBase64, validateImageFile } from '$lib/utils/image-handler';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import InvoiceTemplatePreview from '$lib/components/InvoiceTemplatePreview.svelte';
	
	let companyName = $state('');
	let companyEmail = $state('');
	let companyAddress = $state('');
	let companyPhone = $state('');
	let companyWebsite = $state('');
	let companyCity = $state('Dubai');
	let companyCountry = $state('United Arab Emirates');
	let companyTaxId = $state('');
	let companyLogo = $state('');
	let companyStamp = $state('');
	let companySignature = $state('');
	let currency = $state('AED');
	let taxRate = $state(5);
	let invoicePrefix = $state('INV');
	let paymentTermsDays = $state(30);
	let reminderDaysBeforeDue = $state(3);
	let isLoading = $state(false);
	let isSaving = $state(false);

	onMount(async () => {
		isLoading = true;
		try {
			const response = await fetch('/api/settings');
			if (response.ok) {
				const data = await response.json();
				companyName = data.companyName || '';
				companyEmail = data.companyEmail || '';
				companyAddress = data.companyAddress || '';
				companyPhone = data.companyPhone || '';
				companyWebsite = data.companyWebsite || '';
				companyLogo = data.companyLogo || '';
				companyStamp = data.companyStamp || '';
				companySignature = data.companySignature || '';
				companyCity = data.companyCity || 'Dubai';
				companyCountry = data.companyCountry || 'United Arab Emirates';
				companyTaxId = data.companyTaxId || '';
				currency = data.defaultCurrency || 'AED';
				taxRate = data.defaultTaxRate || 5;
				invoicePrefix = data.invoicePrefix || 'INV';
				paymentTermsDays = data.paymentTermsDays || 30;
				reminderDaysBeforeDue = data.reminderDaysBeforeDue || 3;
			}
		} catch (error) {
			console.error('Failed to load settings:', error);
			toast('Failed to load settings', 'error');
		} finally {
			isLoading = false;
		}
	});

	async function handleImageUpload(event: Event, type: 'logo' | 'stamp' | 'signature') {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;

		const validation = validateImageFile(file);
		if (!validation.valid) {
			toast(validation.error || 'Invalid file', 'error');
			return;
		}

		try {
			const base64 = await fileToBase64(file);
			
			if (type === 'logo') {
				companyLogo = base64;
			} else if (type === 'stamp') {
				companyStamp = base64;
			} else if (type === 'signature') {
				companySignature = base64;
			}
			
			toast(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`, 'success');
		} catch (error) {
			console.error('Failed to upload image:', error);
			toast('Failed to upload image', 'error');
		}
	}

	function removeImage(type: 'logo' | 'stamp' | 'signature') {
		if (type === 'logo') {
			companyLogo = '';
		} else if (type === 'stamp') {
			companyStamp = '';
		} else if (type === 'signature') {
			companySignature = '';
		}
	}

	async function saveSettings() {
		isSaving = true;
		try {
			const response = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					companyName,
					companyEmail,
					companyAddress,
					companyPhone,
					companyWebsite,
					companyLogo,
					companyStamp,
					companySignature,
					companyCity,
					companyCountry,
					companyTaxId,
					defaultCurrency: currency,
					defaultTaxRate: taxRate,
					invoicePrefix,
					paymentTermsDays,
					reminderDaysBeforeDue
				})
			});

			if (response.ok) {
				toast('Settings saved successfully!', 'success');
			} else {
				throw new Error('Failed to save settings');
			}
		} catch (error) {
			console.error('Failed to save settings:', error);
			toast('Failed to save settings', 'error');
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Settings - Invoice Manager</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Settings</h1>
		<p class="text-muted-foreground">Manage your company information and preferences</p>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center h-64">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	{:else}
		<form onsubmit={saveSettings} class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Company Information</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="companyName">Company Name</Label>
							<Input
								id="companyName"
								bind:value={companyName}
								placeholder="Your Company Name"
							/>
						</div>

						<div class="space-y-2">
							<Label for="companyEmail">Company Email</Label>
							<Input
								id="companyEmail"
								type="email"
								bind:value={companyEmail}
								placeholder="company@example.com"
							/>
						</div>

						<div class="space-y-2">
							<Label for="companyPhone">Phone Number</Label>
							<Input
								id="companyPhone"
								bind:value={companyPhone}
								placeholder="+1 (555) 123-4567"
							/>
						</div>

						<div class="space-y-2">
							<Label for="companyWebsite">Website</Label>
							<Input
								id="companyWebsite"
								bind:value={companyWebsite}
								placeholder="https://yourcompany.com"
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="companyAddress">Company Address</Label>
						<Textarea
							id="companyAddress"
							bind:value={companyAddress}
							rows={3}
							placeholder="123 Business St"
						/>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="companyCity">City</Label>
							<Input
								id="companyCity"
								bind:value={companyCity}
								placeholder="Dubai"
							/>
						</div>

						<div class="space-y-2">
							<Label for="companyCountry">Country</Label>
							<Input
								id="companyCountry"
								bind:value={companyCountry}
								placeholder="United Arab Emirates"
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="companyTaxId">Tax Registration Number (TRN)</Label>
						<Input
							id="companyTaxId"
							bind:value={companyTaxId}
							placeholder="123456789012345"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Branding & Documents</CardTitle>
				</CardHeader>
				<CardContent class="space-y-6">
					<!-- Logo Upload -->
					<div class="space-y-2">
						<Label>Company Logo</Label>
						<div class="flex items-center gap-4">
							{#if companyLogo}
								<div class="relative">
									<img src={companyLogo} alt="Company Logo" class="h-20 w-20 object-contain border rounded" />
									<button
										type="button"
										onclick={() => removeImage('logo')}
										class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
									>
										<X class="h-3 w-3" />
									</button>
								</div>
							{:else}
								<div class="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
									<Upload class="h-6 w-6" />
								</div>
							{/if}
							<div class="flex-1">
								<Input
									type="file"
									accept="image/png,image/jpeg,image/jpg,image/svg+xml"
									onchange={(e) => handleImageUpload(e, 'logo')}
									class="cursor-pointer"
								/>
								<p class="text-xs text-muted-foreground mt-1">PNG, JPG or SVG (max 2MB)</p>
							</div>
						</div>
					</div>

					<!-- Stamp Upload -->
					<div class="space-y-2">
						<Label>Company Stamp</Label>
						<div class="flex items-center gap-4">
							{#if companyStamp}
								<div class="relative">
									<img src={companyStamp} alt="Company Stamp" class="h-20 w-20 object-contain border rounded" />
									<button
										type="button"
										onclick={() => removeImage('stamp')}
										class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
									>
										<X class="h-3 w-3" />
									</button>
								</div>
							{:else}
								<div class="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
									<Upload class="h-6 w-6" />
								</div>
							{/if}
							<div class="flex-1">
								<Input
									type="file"
									accept="image/png,image/jpeg,image/jpg"
									onchange={(e) => handleImageUpload(e, 'stamp')}
									class="cursor-pointer"
								/>
								<p class="text-xs text-muted-foreground mt-1">PNG or JPG (max 2MB)</p>
							</div>
						</div>
					</div>

					<!-- Signature Upload -->
					<div class="space-y-2">
						<Label>Authorized Signature</Label>
						<div class="flex items-center gap-4">
							{#if companySignature}
								<div class="relative">
									<img src={companySignature} alt="Signature" class="h-20 w-32 object-contain border rounded" />
									<button
										type="button"
										onclick={() => removeImage('signature')}
										class="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
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
									onchange={(e) => handleImageUpload(e, 'signature')}
									class="cursor-pointer"
								/>
								<p class="text-xs text-muted-foreground mt-1">PNG or JPG (max 2MB)</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Invoice Defaults</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="currency">Default Currency</Label>
							<select
								id="currency"
								bind:value={currency}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							>
								<option value="AED">AED - UAE Dirham</option>
								<option value="SAR">SAR - Saudi Riyal</option>
								<option value="USD">USD - US Dollar</option>
								<option value="EUR">EUR - Euro</option>
								<option value="GBP">GBP - British Pound</option>
								<option value="CAD">CAD - Canadian Dollar</option>
								<option value="AUD">AUD - Australian Dollar</option>
								<option value="JPY">JPY - Japanese Yen</option>
								<option value="CHF">CHF - Swiss Franc</option>
								<option value="CNY">CNY - Chinese Yuan</option>
								<option value="INR">INR - Indian Rupee</option>
							</select>
						</div>

						<div class="space-y-2">
							<Label for="taxRate">Default Tax Rate (%)</Label>
							<Input
								id="taxRate"
								type="number"
								bind:value={taxRate}
								min="0"
								max="100"
								step="0.01"
								placeholder="0.00"
							/>
						</div>

						<div class="space-y-2">
							<Label for="invoicePrefix">Invoice Number Prefix</Label>
							<Input
								id="invoicePrefix"
								bind:value={invoicePrefix}
								placeholder="INV"
							/>
						</div>

						<div class="space-y-2">
							<Label for="paymentTerms">Payment Terms (Days)</Label>
							<Input
								id="paymentTerms"
								type="number"
								bind:value={paymentTermsDays}
								min="1"
								placeholder="30"
							/>
						</div>

						<div class="space-y-2">
							<Label for="reminderDays">Reminder Days Before Due</Label>
							<Input
								id="reminderDays"
								type="number"
								bind:value={reminderDaysBeforeDue}
								min="1"
								placeholder="3"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Invoice Template Preview</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground mb-4">
						Preview of how your invoice will look with the uploaded branding assets
					</p>
					<InvoiceTemplatePreview 
						logoUrl={companyLogo} 
						stampUrl={companyStamp} 
						signatureUrl={companySignature}
						companyName={companyName || 'Your Company Name'}
						companyNameAr="اسم شركتك"
						companyPhone={companyPhone || '+971 XXX XX XXXX'}
						companyAddress={companyAddress || 'Your Company Address'}
						companyEmail={companyEmail || 'email@company.com'}
						companyTrn={companyTaxId || 'XXXXXXXXXXXXX'}
					/>
				</CardContent>
			</Card>

			<div class="flex justify-end">
				<Button type="submit" disabled={isSaving}>
					{isSaving ? 'Saving...' : 'Save Settings'}
				</Button>
			</div>
		</form>
	{/if}
</div>