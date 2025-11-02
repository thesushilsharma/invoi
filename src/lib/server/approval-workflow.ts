import { db } from '$lib/server/db';
import { invoices, invoiceApprovals } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Invoice, InvoiceApproval, NewInvoiceApproval } from '$lib/server/db/schema';

export interface ApprovalWorkflowConfig {
	requireApproval: boolean;
	approvers: string[]; // Email addresses
	approvalThreshold?: number; // Minimum number of approvals required
	autoApproveBelow?: number; // Auto-approve invoices below this amount
}

export interface ApprovalRequest {
	invoiceId: string;
	approverEmail: string;
	message?: string;
	dueDate?: Date;
}

export interface ApprovalResponse {
	approvalId: string;
	status: 'approved' | 'rejected' | 'revision_requested';
	comments?: string;
}

export class ApprovalWorkflowService {
	// Submit invoice for approval
	static async submitForApproval(
		invoiceId: string,
		approvers: string[],
		message?: string
	): Promise<{ success: boolean; approvalIds: string[] }> {
		try {
			// Update invoice status to pending approval
			await db
				.update(invoices)
				.set({
					approvalStatus: 'pending',
					updatedAt: new Date()
				})
				.where(eq(invoices.id, invoiceId));

			// Create approval records for each approver
			const approvalIds: string[] = [];
			
			for (const approverEmail of approvers) {
				const approval = await db
					.insert(invoiceApprovals)
					.values({
						invoiceId,
						approverEmail,
						status: 'pending',
						comments: message,
						createdAt: new Date()
					})
					.returning();

				approvalIds.push(approval[0].id);

				// Send approval notification (in real app)
				await this.sendApprovalNotification(invoiceId, approverEmail, message);
			}

			return {
				success: true,
				approvalIds
			};
		} catch (error) {
			console.error('Error submitting for approval:', error);
			return {
				success: false,
				approvalIds: []
			};
		}
	}

	// Process approval response
	static async processApproval(
		approvalId: string,
		response: ApprovalResponse
	): Promise<{ success: boolean; invoiceStatus?: string }> {
		try {
			// Update approval record
			await db
				.update(invoiceApprovals)
				.set({
					status: response.status,
					comments: response.comments,
					approvedAt: new Date()
				})
				.where(eq(invoiceApprovals.id, approvalId));

			// Get the invoice and all its approvals
			const approval = await db
				.select()
				.from(invoiceApprovals)
				.where(eq(invoiceApprovals.id, approvalId))
				.limit(1);

			if (approval.length === 0) {
				throw new Error('Approval not found');
			}

			const invoiceId = approval[0].invoiceId;
			const allApprovals = await db
				.select()
				.from(invoiceApprovals)
				.where(eq(invoiceApprovals.invoiceId, invoiceId));

			// Determine final invoice status
			const finalStatus = this.calculateFinalApprovalStatus(allApprovals);

			// Update invoice status
			await db
				.update(invoices)
				.set({
					approvalStatus: finalStatus,
					approvedAt: finalStatus === 'approved' ? new Date() : null,
					updatedAt: new Date()
				})
				.where(eq(invoices.id, invoiceId));

			// Send notifications based on final status
			await this.sendApprovalStatusNotification(invoiceId, finalStatus);

			return {
				success: true,
				invoiceStatus: finalStatus
			};
		} catch (error) {
			console.error('Error processing approval:', error);
			return {
				success: false
			};
		}
	}

	// Get pending approvals for a user
	static async getPendingApprovals(approverEmail: string): Promise<Array<{
		approval: InvoiceApproval;
		invoice: Invoice;
	}>> {
		const approvals = await db
			.select()
			.from(invoiceApprovals)
			.where(
				and(
					eq(invoiceApprovals.approverEmail, approverEmail),
					eq(invoiceApprovals.status, 'pending')
				)
			);

		const results = [];
		for (const approval of approvals) {
			const invoice = await db
				.select()
				.from(invoices)
				.where(eq(invoices.id, approval.invoiceId))
				.limit(1);

			if (invoice.length > 0) {
				results.push({
					approval,
					invoice: invoice[0]
				});
			}
		}

		return results;
	}

	// Get approval history for an invoice
	static async getApprovalHistory(invoiceId: string): Promise<InvoiceApproval[]> {
		return await db
			.select()
			.from(invoiceApprovals)
			.where(eq(invoiceApprovals.invoiceId, invoiceId))
			.orderBy(invoiceApprovals.createdAt);
	}

	// Check if invoice needs approval
	static async needsApproval(
		invoice: Invoice,
		config: ApprovalWorkflowConfig
	): Promise<boolean> {
		if (!config.requireApproval) return false;

		// Auto-approve if below threshold
		if (config.autoApproveBelow && invoice.total < config.autoApproveBelow) {
			return false;
		}

		// Check if already approved
		if (invoice.approvalStatus === 'approved') return false;

		return true;
	}

	// Auto-approve invoice if conditions are met
	static async autoApprove(
		invoiceId: string,
		config: ApprovalWorkflowConfig,
		reason: string = 'Auto-approved based on workflow rules'
	): Promise<boolean> {
		try {
			// Update invoice status
			await db
				.update(invoices)
				.set({
					approvalStatus: 'approved',
					approvedAt: new Date(),
					approvedBy: 'system',
					updatedAt: new Date()
				})
				.where(eq(invoices.id, invoiceId));

			// Create approval record
			await db
				.insert(invoiceApprovals)
				.values({
					invoiceId,
					approverEmail: 'system@auto-approval',
					status: 'approved',
					comments: reason,
					approvedAt: new Date(),
					createdAt: new Date()
				});

			return true;
		} catch (error) {
			console.error('Error auto-approving invoice:', error);
			return false;
		}
	}

	// Bulk approve invoices
	static async bulkApprove(
		invoiceIds: string[],
		approverEmail: string,
		comments?: string
	): Promise<{ success: boolean; approvedCount: number; errors: string[] }> {
		let approvedCount = 0;
		const errors: string[] = [];

		for (const invoiceId of invoiceIds) {
			try {
				// Get pending approvals for this invoice
				const pendingApprovals = await db
					.select()
					.from(invoiceApprovals)
					.where(
						and(
							eq(invoiceApprovals.invoiceId, invoiceId),
							eq(invoiceApprovals.approverEmail, approverEmail),
							eq(invoiceApprovals.status, 'pending')
						)
					);

				if (pendingApprovals.length > 0) {
					const approvalId = pendingApprovals[0].id;
					const result = await this.processApproval(approvalId, {
						approvalId,
						status: 'approved',
						comments
					});

					if (result.success) {
						approvedCount++;
					} else {
						errors.push(`Failed to approve invoice ${invoiceId}`);
					}
				} else {
					errors.push(`No pending approval found for invoice ${invoiceId}`);
				}
			} catch (error) {
				errors.push(`Error approving invoice ${invoiceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}

		return {
			success: errors.length === 0,
			approvedCount,
			errors
		};
	}

	// Get approval statistics
	static async getApprovalStats(dateRange?: { start: Date; end: Date }): Promise<{
		totalPending: number;
		totalApproved: number;
		totalRejected: number;
		averageApprovalTime: number; // in hours
	}> {
		// This would include date range filtering in a real implementation
		const allApprovals = await db.select().from(invoiceApprovals);

		const pending = allApprovals.filter(a => a.status === 'pending').length;
		const approved = allApprovals.filter(a => a.status === 'approved').length;
		const rejected = allApprovals.filter(a => a.status === 'rejected').length;

		// Calculate average approval time
		const approvedWithTimes = allApprovals.filter(a => 
			a.status === 'approved' && a.approvedAt && a.createdAt
		);

		let averageApprovalTime = 0;
		if (approvedWithTimes.length > 0) {
			const totalTime = approvedWithTimes.reduce((sum, approval) => {
				const created = new Date(approval.createdAt).getTime();
				const approved = new Date(approval.approvedAt!).getTime();
				return sum + (approved - created);
			}, 0);

			averageApprovalTime = totalTime / approvedWithTimes.length / (1000 * 60 * 60); // Convert to hours
		}

		return {
			totalPending: pending,
			totalApproved: approved,
			totalRejected: rejected,
			averageApprovalTime
		};
	}

	// Private helper methods
	private static calculateFinalApprovalStatus(approvals: InvoiceApproval[]): 'pending' | 'approved' | 'rejected' | 'revision_requested' {
		// If any approval is rejected, the whole invoice is rejected
		if (approvals.some(a => a.status === 'rejected')) {
			return 'rejected';
		}

		// If any approval requests revision, the whole invoice needs revision
		if (approvals.some(a => a.status === 'revision_requested')) {
			return 'revision_requested';
		}

		// If all approvals are approved, the invoice is approved
		if (approvals.length > 0 && approvals.every(a => a.status === 'approved')) {
			return 'approved';
		}

		// Otherwise, still pending
		return 'pending';
	}

	private static async sendApprovalNotification(
		invoiceId: string,
		approverEmail: string,
		message?: string
	): Promise<void> {
		// In real app, send email notification
		console.log(`Approval notification sent to ${approverEmail} for invoice ${invoiceId}`);
		
		// Could integrate with email service here
		// await emailService.sendApprovalRequest({
		//   to: approverEmail,
		//   invoiceId,
		//   message,
		//   approvalLink: `${baseUrl}/approvals/${invoiceId}`
		// });
	}

	private static async sendApprovalStatusNotification(
		invoiceId: string,
		status: string
	): Promise<void> {
		// In real app, notify relevant parties about status change
		console.log(`Invoice ${invoiceId} approval status changed to: ${status}`);
	}

	// Generate approval link for external approvers
	static generateApprovalLink(approvalId: string, baseUrl: string): string {
		// In real app, this would include a secure token
		return `${baseUrl}/approvals/${approvalId}?token=${this.generateSecureToken(approvalId)}`;
	}

	private static generateSecureToken(approvalId: string): string {
		// In real app, generate a secure JWT or similar token
		return Buffer.from(`${approvalId}:${Date.now()}`).toString('base64');
	}

	// Validate approval token
	static validateApprovalToken(approvalId: string, token: string): boolean {
		// In real app, validate the secure token
		try {
			const decoded = Buffer.from(token, 'base64').toString();
			const [id, timestamp] = decoded.split(':');
			
			// Check if token is for the correct approval and not expired (24 hours)
			const tokenAge = Date.now() - parseInt(timestamp);
			const maxAge = 24 * 60 * 60 * 1000; // 24 hours
			
			return id === approvalId && tokenAge < maxAge;
		} catch {
			return false;
		}
	}
}