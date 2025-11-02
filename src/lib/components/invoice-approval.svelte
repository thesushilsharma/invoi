<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		CheckCircle, 
		XCircle, 
		AlertCircle, 
		Clock, 
		User,
		MessageSquare
	} from '@lucide/svelte';
	import type { Invoice, InvoiceApproval } from '$lib/server/db/schema';

	let {
		invoice,
		approvals = [],
		canApprove = false,
		onApprove,
		onReject,
		onRequestRevision
	} = $props<{
		invoice: Invoice;
		approvals: InvoiceApproval[];
		canApprove?: boolean;
		onApprove?: (comments?: string) => Promise<void>;
		onReject?: (comments: string) => Promise<void>;
		onRequestRevision?: (comments: string) => Promise<void>;
	}>();

	let comments = $state('');
	let isSubmitting = $state(false);

	function getStatusIcon(status: string) {
		switch (status) {
			case 'approved':
				return CheckCircle;
			case 'rejected':
				return XCircle;
			case 'revision_requested':
				return AlertCircle;
			default:
				return Clock;
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'approved':
				return 'text-green-600';
			case 'rejected':
				return 'text-red-600';
			case 'revision_requested':
				return 'text-orange-600';
			default:
				return 'text-gray-600';
		}
	}

	function getStatusBadgeColor(status: string): string {
		switch (status) {
			case 'approved':
				return 'bg-green-100 text-green-800';
			case 'rejected':
				return 'bg-red-100 text-red-800';
			case 'revision_requested':
				return 'bg-orange-100 text-orange-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	async function handleApprove() {
		if (!onApprove) return;
		
		isSubmitting = true;
		try {
			await onApprove(comments);
			comments = '';
		} catch (error) {
			console.error('Error approving invoice:', error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleReject() {
		if (!onReject || !comments.trim()) return;
		
		isSubmitting = true;
		try {
			await onReject(comments);
			comments = '';
		} catch (error) {
			console.error('Error rejecting invoice:', error);
		} finally {
			isSubmitting = false;
		}
	}

	async function handleRequestRevision() {
		if (!onRequestRevision || !comments.trim()) return;
		
		isSubmitting = true;
		try {
			await onRequestRevision(comments);
			comments = '';
		} catch (error) {
			console.error('Error requesting revision:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center justify-between">
			<span>Approval Status</span>
			<Badge class={getStatusBadgeColor(invoice.approvalStatus || 'pending')}>
				{invoice.approvalStatus || 'pending'}
			</Badge>
		</CardTitle>
	</CardHeader>

	<CardContent class="space-y-4">
		<!-- Current Status -->
		<div class="p-4 border rounded-lg">
			{#if invoice.approvalStatus}
				{@const StatusIcon = getStatusIcon(invoice.approvalStatus)}
				<div class="flex items-center space-x-2 mb-2">
					<StatusIcon class="h-5 w-5 {getStatusColor(invoice.approvalStatus)}" />
					<span class="font-medium">
						{invoice.approvalStatus === 'approved' ? 'Approved' :
						 invoice.approvalStatus === 'rejected' ? 'Rejected' :
						 invoice.approvalStatus === 'revision_requested' ? 'Revision Requested' :
						 'Pending Approval'}
					</span>
				</div>
			{:else}
				{@const StatusIcon = getStatusIcon('pending')}
				<div class="flex items-center space-x-2 mb-2">
					<StatusIcon class="h-5 w-5 {getStatusColor('pending')}" />
					<span class="font-medium">Pending Approval</span>
				</div>
			{/if}
			
			{#if invoice.approvedAt}
				<p class="text-sm text-muted-foreground">
					{invoice.approvalStatus === 'approved' ? 'Approved' : 'Updated'} on {formatDate(invoice.approvedAt)}
					{#if invoice.approvedBy}
						by {invoice.approvedBy}
					{/if}
				</p>
			{/if}
		</div>

		<!-- Approval History -->
		{#if approvals.length > 0}
			<div class="space-y-3">
				<h4 class="font-medium">Approval History</h4>
				{#each approvals as approval}
					<div class="flex items-start space-x-3 p-3 border rounded-lg">
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
							<User class="h-4 w-4" />
						</div>
						<div class="flex-1 space-y-1">
							<div class="flex items-center space-x-2">
								<span class="font-medium text-sm">{approval.approverEmail}</span>
								<Badge class={getStatusBadgeColor(approval.status)}>
									{approval.status}
								</Badge>
							</div>
							<p class="text-xs text-muted-foreground">
								{formatDate(approval.createdAt)}
							</p>
							{#if approval.comments}
								<div class="flex items-start space-x-2 mt-2">
									<MessageSquare class="h-3 w-3 mt-0.5 text-muted-foreground" />
									<p class="text-sm text-muted-foreground">{approval.comments}</p>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Approval Actions -->
		{#if canApprove && invoice.approvalStatus === 'pending'}
			<div class="space-y-4 pt-4 border-t">
				<div>
					<label class="text-sm font-medium">Comments (optional)</label>
					<Textarea
						bind:value={comments}
						placeholder="Add your comments..."
						rows={3}
						class="mt-1"
					/>
				</div>

				<div class="flex space-x-2">
					<Button 
						onclick={handleApprove}
						disabled={isSubmitting}
						class="flex-1"
					>
						<CheckCircle class="mr-2 h-4 w-4" />
						Approve
					</Button>
					
					<Button 
						variant="outline"
						onclick={handleRequestRevision}
						disabled={isSubmitting || !comments.trim()}
						class="flex-1"
					>
						<AlertCircle class="mr-2 h-4 w-4" />
						Request Revision
					</Button>
					
					<Button 
						variant="destructive"
						onclick={handleReject}
						disabled={isSubmitting || !comments.trim()}
						class="flex-1"
					>
						<XCircle class="mr-2 h-4 w-4" />
						Reject
					</Button>
				</div>

				{#if isSubmitting}
					<p class="text-sm text-muted-foreground text-center">
						Processing your response...
					</p>
				{/if}
			</div>
		{:else if invoice.approvalStatus === 'pending'}
			<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<div class="flex items-center space-x-2">
					<Clock class="h-5 w-5 text-yellow-600" />
					<span class="font-medium text-yellow-800">Waiting for Approval</span>
				</div>
				<p class="text-sm text-yellow-700 mt-1">
					This invoice is pending approval from authorized personnel.
				</p>
			</div>
		{/if}
	</CardContent>
</Card>