import { db } from '$lib/server/db';
import { invoices, invoiceItems, bulkInvoiceOperations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Invoice, InvoiceItem, BulkInvoiceOperation, NewInvoice, NewInvoiceItem } from '$lib/server/db/schema';
import { PDFGenerator } from './pdf-generator';
import { generateInvoiceNumber } from '$lib/utils/calculations';

export interface BulkInvoiceData {
	clientName: string;
	clientEmail: string;
	clientAddress: string;
	currency: string;
	taxRate: number;
	items: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
	}>;
	notes?: string;
	dueDate: string;
}

export interface BulkOperationResult {
	operationId: string;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	totalItems: number;
	processedItems: number;
	failedItems: number;
	errors: string[];
	results: Array<{
		success: boolean;
		invoiceId?: string;
		error?: string;
	}>;
}

export class BulkOperationsService {
	// Create multiple invoices at once
	static async createBulkInvoices(
		invoicesData: BulkInvoiceData[],
		options: {
			templateId?: string;
			autoSend?: boolean;
			generatePDF?: boolean;
		} = {}
	): Promise<BulkOperationResult> {
		// Create bulk operation record
		const operation = await db
			.insert(bulkInvoiceOperations)
			.values({
				operationType: 'create',
				status: 'pending',
				totalItems: invoicesData.length,
				processedItems: 0,
				failedItems: 0,
				createdBy: 'system' // In real app, get from auth context
			})
			.returning();

		const operationId = operation[0].id;
		const results: Array<{ success: boolean; invoiceId?: string; error?: string }> = [];
		const errors: string[] = [];
		let processedItems = 0;
		let failedItems = 0;

		try {
			// Update status to processing
			await this.updateOperationStatus(operationId, 'processing');

			// Process each invoice
			for (const invoiceData of invoicesData) {
				try {
					const result = await this.createSingleInvoice(invoiceData, options);
					results.push({
						success: true,
						invoiceId: result.invoiceId
					});
					processedItems++;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					results.push({
						success: false,
						error: errorMessage
					});
					errors.push(errorMessage);
					failedItems++;
				}

				// Update progress
				await this.updateOperationProgress(operationId, processedItems, failedItems);
			}

			// Mark as completed
			await this.updateOperationStatus(operationId, 'completed', errors.join('\n'));

			return {
				operationId,
				status: 'completed',
				totalItems: invoicesData.length,
				processedItems,
				failedItems,
				errors,
				results
			};
		} catch (error) {
			// Mark as failed
			await this.updateOperationStatus(operationId, 'failed', error instanceof Error ? error.message : 'Unknown error');
			
			return {
				operationId,
				status: 'failed',
				totalItems: invoicesData.length,
				processedItems,
				failedItems,
				errors: [error instanceof Error ? error.message : 'Unknown error'],
				results
			};
		}
	}

	// Send multiple invoices at once
	static async sendBulkInvoices(invoiceIds: string[]): Promise<BulkOperationResult> {
		const operation = await db
			.insert(bulkInvoiceOperations)
			.values({
				operationType: 'send',
				status: 'pending',
				totalItems: invoiceIds.length,
				processedItems: 0,
				failedItems: 0,
				createdBy: 'system'
			})
			.returning();

		const operationId = operation[0].id;
		const results: Array<{ success: boolean; invoiceId?: string; error?: string }> = [];
		const errors: string[] = [];
		let processedItems = 0;
		let failedItems = 0;

		try {
			await this.updateOperationStatus(operationId, 'processing');

			for (const invoiceId of invoiceIds) {
				try {
					await this.sendSingleInvoice(invoiceId);
					results.push({
						success: true,
						invoiceId
					});
					processedItems++;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					results.push({
						success: false,
						invoiceId,
						error: errorMessage
					});
					errors.push(`Invoice ${invoiceId}: ${errorMessage}`);
					failedItems++;
				}

				await this.updateOperationProgress(operationId, processedItems, failedItems);
			}

			await this.updateOperationStatus(operationId, 'completed', errors.join('\n'));

			return {
				operationId,
				status: 'completed',
				totalItems: invoiceIds.length,
				processedItems,
				failedItems,
				errors,
				results
			};
		} catch (error) {
			await this.updateOperationStatus(operationId, 'failed', error instanceof Error ? error.message : 'Unknown error');
			
			return {
				operationId,
				status: 'failed',
				totalItems: invoiceIds.length,
				processedItems,
				failedItems,
				errors: [error instanceof Error ? error.message : 'Unknown error'],
				results
			};
		}
	}

	// Generate PDFs for multiple invoices
	static async generateBulkPDFs(invoiceIds: string[]): Promise<BulkOperationResult> {
		const operation = await db
			.insert(bulkInvoiceOperations)
			.values({
				operationType: 'generate_pdf',
				status: 'pending',
				totalItems: invoiceIds.length,
				processedItems: 0,
				failedItems: 0,
				createdBy: 'system'
			})
			.returning();

		const operationId = operation[0].id;
		const results: Array<{ success: boolean; invoiceId?: string; error?: string }> = [];
		const errors: string[] = [];
		let processedItems = 0;
		let failedItems = 0;

		try {
			await this.updateOperationStatus(operationId, 'processing');

			// Get all invoices with their items
			const invoicesWithItems = await this.getInvoicesWithItems(invoiceIds);

			// Generate PDFs
			const pdfResults = await PDFGenerator.generateBulkPDFs(invoicesWithItems);

			for (const pdfResult of pdfResults) {
				if (pdfResult.error) {
					results.push({
						success: false,
						invoiceId: pdfResult.invoiceId,
						error: pdfResult.error
					});
					errors.push(`Invoice ${pdfResult.invoiceId}: ${pdfResult.error}`);
					failedItems++;
				} else {
					// Save PDF (in real app, save to file system or cloud storage)
					const pdfPath = await this.savePDF(pdfResult.invoiceId, pdfResult.pdf);
					
					// Update invoice with PDF path
					await db
						.update(invoices)
						.set({ pdfPath })
						.where(eq(invoices.id, pdfResult.invoiceId));

					results.push({
						success: true,
						invoiceId: pdfResult.invoiceId
					});
					processedItems++;
				}

				await this.updateOperationProgress(operationId, processedItems, failedItems);
			}

			await this.updateOperationStatus(operationId, 'completed', errors.join('\n'));

			return {
				operationId,
				status: 'completed',
				totalItems: invoiceIds.length,
				processedItems,
				failedItems,
				errors,
				results
			};
		} catch (error) {
			await this.updateOperationStatus(operationId, 'failed', error instanceof Error ? error.message : 'Unknown error');
			
			return {
				operationId,
				status: 'failed',
				totalItems: invoiceIds.length,
				processedItems,
				failedItems,
				errors: [error instanceof Error ? error.message : 'Unknown error'],
				results
			};
		}
	}

	// Get bulk operation status
	static async getBulkOperationStatus(operationId: string): Promise<BulkInvoiceOperation | null> {
		const operations = await db
			.select()
			.from(bulkInvoiceOperations)
			.where(eq(bulkInvoiceOperations.id, operationId))
			.limit(1);

		return operations.length > 0 ? operations[0] : null;
	}

	// Get all bulk operations
	static async getAllBulkOperations(limit: number = 50): Promise<BulkInvoiceOperation[]> {
		return await db
			.select()
			.from(bulkInvoiceOperations)
			.orderBy(bulkInvoiceOperations.createdAt)
			.limit(limit);
	}

	// Import invoices from CSV
	static async importInvoicesFromCSV(csvData: string): Promise<BulkOperationResult> {
		const lines = csvData.split('\n');
		const headers = lines[0].split(',').map(h => h.trim());
		
		const invoicesData: BulkInvoiceData[] = [];
		const errors: string[] = [];

		// Parse CSV data
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			try {
				const values = line.split(',').map(v => v.trim());
				const invoiceData = this.parseCSVRow(headers, values);
				invoicesData.push(invoiceData);
			} catch (error) {
				errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
			}
		}

		if (errors.length > 0) {
			throw new Error(`CSV parsing errors:\n${errors.join('\n')}`);
		}

		return await this.createBulkInvoices(invoicesData);
	}

	// Private helper methods
	private static async createSingleInvoice(
		invoiceData: BulkInvoiceData,
		options: { templateId?: string; autoSend?: boolean; generatePDF?: boolean }
	): Promise<{ invoiceId: string }> {
		// Calculate totals
		const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
		const taxAmount = subtotal * (invoiceData.taxRate / 100);
		const total = subtotal + taxAmount;

		// Create invoice
		const newInvoice: NewInvoice = {
			invoiceNumber: generateInvoiceNumber(),
			clientName: invoiceData.clientName,
			clientEmail: invoiceData.clientEmail,
			clientAddress: invoiceData.clientAddress,
			issueDate: new Date().toISOString(),
			dueDate: invoiceData.dueDate,
			subtotal,
			taxRate: invoiceData.taxRate,
			taxAmount,
			total,
			currency: invoiceData.currency,
			templateId: options.templateId,
			status: options.autoSend ? 'sent' : 'draft',
			notes: invoiceData.notes,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const createdInvoice = await db.insert(invoices).values(newInvoice).returning();
		const invoiceId = createdInvoice[0].id;

		// Create invoice items
		const invoiceItemsData: NewInvoiceItem[] = invoiceData.items.map(item => ({
			invoiceId,
			description: item.description,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
			total: item.quantity * item.unitPrice,
			createdAt: new Date()
		}));

		await db.insert(invoiceItems).values(invoiceItemsData);

		return { invoiceId };
	}

	private static async sendSingleInvoice(invoiceId: string): Promise<void> {
		// Update invoice status to sent
		await db
			.update(invoices)
			.set({ 
				status: 'sent',
				updatedAt: new Date()
			})
			.where(eq(invoices.id, invoiceId));

		// In real app, send email notification here
		console.log(`Invoice ${invoiceId} sent`);
	}

	private static async getInvoicesWithItems(invoiceIds: string[]): Promise<Array<{ invoice: Invoice; items: InvoiceItem[] }>> {
		const results = [];

		for (const invoiceId of invoiceIds) {
			const invoice = await db
				.select()
				.from(invoices)
				.where(eq(invoices.id, invoiceId))
				.limit(1);

			if (invoice.length === 0) continue;

			const items = await db
				.select()
				.from(invoiceItems)
				.where(eq(invoiceItems.invoiceId, invoiceId));

			results.push({
				invoice: invoice[0],
				items
			});
		}

		return results;
	}

	private static async savePDF(invoiceId: string, pdfData: Uint8Array): Promise<string> {
		// In real app, save to file system or cloud storage
		// For now, return a placeholder path
		return `/pdfs/invoice-${invoiceId}.pdf`;
	}

	private static async updateOperationStatus(
		operationId: string,
		status: string,
		errorLog?: string
	): Promise<void> {
		const updateData: any = { status };
		
		if (status === 'completed' || status === 'failed') {
			updateData.completedAt = new Date();
		}
		
		if (errorLog) {
			updateData.errorLog = errorLog;
		}

		await db
			.update(bulkInvoiceOperations)
			.set(updateData)
			.where(eq(bulkInvoiceOperations.id, operationId));
	}

	private static async updateOperationProgress(
		operationId: string,
		processedItems: number,
		failedItems: number
	): Promise<void> {
		await db
			.update(bulkInvoiceOperations)
			.set({
				processedItems,
				failedItems
			})
			.where(eq(bulkInvoiceOperations.id, operationId));
	}

	private static parseCSVRow(headers: string[], values: string[]): BulkInvoiceData {
		const data: any = {};
		
		headers.forEach((header, index) => {
			data[header] = values[index] || '';
		});

		// Validate required fields
		if (!data.clientName) throw new Error('Client name is required');
		if (!data.clientEmail) throw new Error('Client email is required');
		if (!data.itemDescription) throw new Error('Item description is required');

		return {
			clientName: data.clientName,
			clientEmail: data.clientEmail,
			clientAddress: data.clientAddress || '',
			currency: data.currency || 'USD',
			taxRate: parseFloat(data.taxRate) || 0,
			items: [{
				description: data.itemDescription,
				quantity: parseFloat(data.quantity) || 1,
				unitPrice: parseFloat(data.unitPrice) || 0
			}],
			notes: data.notes,
			dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
		};
	}
}