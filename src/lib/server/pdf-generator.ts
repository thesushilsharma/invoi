import jsPDF from 'jspdf';
import type { Invoice, InvoiceItem, InvoiceTemplate } from '$lib/server/db/schema';

export interface PDFGenerationOptions {
	template?: InvoiceTemplate;
	logoUrl?: string;
	companyInfo?: CompanyInfo;
	customization?: PDFCustomization;
}

export interface CompanyInfo {
	name: string;
	address: string;
	phone?: string;
	email?: string;
	website?: string;
	taxId?: string;
}

export interface PDFCustomization {
	primaryColor?: string;
	secondaryColor?: string;
	fontFamily?: string;
	fontSize?: number;
	showLogo?: boolean;
	showWatermark?: boolean;
	watermarkText?: string;
}

export class PDFGenerator {
	private doc: jsPDF;
	private pageWidth: number;
	private pageHeight: number;
	private margin: number = 20;

	constructor() {
		this.doc = new jsPDF();
		this.pageWidth = this.doc.internal.pageSize.getWidth();
		this.pageHeight = this.doc.internal.pageSize.getHeight();
	}

	async generateInvoicePDF(
		invoice: Invoice,
		items: InvoiceItem[],
		options: PDFGenerationOptions = {}
	): Promise<Uint8Array> {
		const template = options.template || this.getDefaultTemplate();
		const companyInfo = options.companyInfo || this.getDefaultCompanyInfo();
		
		// Set colors from template
		const primaryColor = template.primaryColor || '#3b82f6';
		const secondaryColor = template.secondaryColor || '#64748b';

		// Reset document
		this.doc = new jsPDF();

		// Add header
		await this.addHeader(invoice, companyInfo, template, options);

		// Add invoice details
		this.addInvoiceDetails(invoice);

		// Add client information
		this.addClientInfo(invoice);

		// Add items table
		this.addItemsTable(items, invoice.currency);

		// Add totals
		this.addTotals(invoice);

		// Add footer
		this.addFooter(invoice, template);

		// Add watermark if needed
		if (options.customization?.showWatermark) {
			this.addWatermark(options.customization.watermarkText || 'INVOICE');
		}

		return this.doc.output('arraybuffer') as Uint8Array;
	}

	private async addHeader(
		invoice: Invoice,
		companyInfo: CompanyInfo,
		template: InvoiceTemplate,
		options: PDFGenerationOptions
	) {
		const primaryColor = this.hexToRgb(template.primaryColor || '#3b82f6');
		
		// Header background
		this.doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
		this.doc.rect(0, 0, this.pageWidth, 60, 'F');

		// Company name
		this.doc.setTextColor(255, 255, 255);
		this.doc.setFontSize(24);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text(companyInfo.name, this.margin, 30);

		// Invoice title
		this.doc.setFontSize(16);
		this.doc.text('INVOICE', this.pageWidth - this.margin - 40, 30);

		// Company info
		this.doc.setFontSize(10);
		this.doc.setFont('helvetica', 'normal');
		let yPos = 45;
		if (companyInfo.address) {
			this.doc.text(companyInfo.address, this.margin, yPos);
			yPos += 5;
		}
		if (companyInfo.phone) {
			this.doc.text(`Phone: ${companyInfo.phone}`, this.margin, yPos);
			yPos += 5;
		}
		if (companyInfo.email) {
			this.doc.text(`Email: ${companyInfo.email}`, this.margin, yPos);
		}

		// Invoice number and date
		this.doc.setTextColor(255, 255, 255);
		this.doc.text(`#${invoice.invoiceNumber}`, this.pageWidth - this.margin - 40, 45);
		this.doc.text(new Date(invoice.issueDate).toLocaleDateString(), this.pageWidth - this.margin - 40, 52);
	}

	private addInvoiceDetails(invoice: Invoice) {
		this.doc.setTextColor(0, 0, 0);
		this.doc.setFontSize(12);
		this.doc.setFont('helvetica', 'bold');

		let yPos = 80;
		
		// Invoice details section
		this.doc.text('Invoice Details', this.margin, yPos);
		yPos += 10;

		this.doc.setFont('helvetica', 'normal');
		this.doc.setFontSize(10);

		const details = [
			['Invoice Number:', invoice.invoiceNumber],
			['Issue Date:', new Date(invoice.issueDate).toLocaleDateString()],
			['Due Date:', new Date(invoice.dueDate).toLocaleDateString()],
			['Currency:', invoice.currency],
			['Status:', invoice.status.toUpperCase()]
		];

		details.forEach(([label, value]) => {
			this.doc.setFont('helvetica', 'bold');
			this.doc.text(label, this.margin, yPos);
			this.doc.setFont('helvetica', 'normal');
			this.doc.text(value, this.margin + 40, yPos);
			yPos += 6;
		});
	}

	private addClientInfo(invoice: Invoice) {
		this.doc.setFontSize(12);
		this.doc.setFont('helvetica', 'bold');

		let yPos = 80;
		const clientX = this.pageWidth - this.margin - 80;

		// Bill to section
		this.doc.text('Bill To:', clientX, yPos);
		yPos += 10;

		this.doc.setFont('helvetica', 'normal');
		this.doc.setFontSize(10);

		// Client name
		this.doc.setFont('helvetica', 'bold');
		this.doc.text(invoice.clientName, clientX, yPos);
		yPos += 6;

		// Client email
		this.doc.setFont('helvetica', 'normal');
		this.doc.text(invoice.clientEmail, clientX, yPos);
		yPos += 6;

		// Client address (split by lines)
		if (invoice.clientAddress) {
			const addressLines = invoice.clientAddress.split('\n');
			addressLines.forEach(line => {
				this.doc.text(line.trim(), clientX, yPos);
				yPos += 5;
			});
		}
	}

	private addItemsTable(items: InvoiceItem[], currency: string) {
		const startY = 160;
		let currentY = startY;

		// Table header
		this.doc.setFillColor(248, 250, 252);
		this.doc.rect(this.margin, currentY - 8, this.pageWidth - 2 * this.margin, 15, 'F');

		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(10);
		this.doc.setTextColor(0, 0, 0);

		// Header columns
		this.doc.text('Description', this.margin + 5, currentY);
		this.doc.text('Qty', this.pageWidth - 120, currentY);
		this.doc.text('Rate', this.pageWidth - 80, currentY);
		this.doc.text('Amount', this.pageWidth - 40, currentY);

		currentY += 15;

		// Table rows
		this.doc.setFont('helvetica', 'normal');
		items.forEach((item, index) => {
			// Alternate row colors
			if (index % 2 === 0) {
				this.doc.setFillColor(252, 252, 252);
				this.doc.rect(this.margin, currentY - 8, this.pageWidth - 2 * this.margin, 12, 'F');
			}

			// Item data
			this.doc.text(item.description, this.margin + 5, currentY);
			this.doc.text(item.quantity.toString(), this.pageWidth - 120, currentY);
			this.doc.text(this.formatCurrency(item.unitPrice, currency), this.pageWidth - 80, currentY);
			this.doc.text(this.formatCurrency(item.total || (item.quantity * item.unitPrice), currency), this.pageWidth - 40, currentY);

			currentY += 12;
		});

		// Table border
		this.doc.setDrawColor(200, 200, 200);
		this.doc.rect(this.margin, startY - 8, this.pageWidth - 2 * this.margin, currentY - startY + 8);
	}

	private addTotals(invoice: Invoice) {
		const startY = 200 + (invoice.items?.length || 0) * 12;
		let currentY = startY + 20;

		const totalsX = this.pageWidth - 100;

		// Subtotal
		this.doc.setFont('helvetica', 'normal');
		this.doc.text('Subtotal:', totalsX - 40, currentY);
		this.doc.text(this.formatCurrency(invoice.subtotal, invoice.currency), totalsX, currentY);
		currentY += 8;

		// Tax
		if (invoice.taxRate > 0) {
			this.doc.text(`Tax (${invoice.taxRate}%):`, totalsX - 40, currentY);
			this.doc.text(this.formatCurrency(invoice.taxAmount, invoice.currency), totalsX, currentY);
			currentY += 8;
		}

		// Total
		this.doc.setFont('helvetica', 'bold');
		this.doc.setFontSize(12);
		this.doc.text('Total:', totalsX - 40, currentY);
		this.doc.text(this.formatCurrency(invoice.total, invoice.currency), totalsX, currentY);

		// Total line
		this.doc.setDrawColor(0, 0, 0);
		this.doc.line(totalsX - 45, currentY - 5, this.pageWidth - this.margin, currentY - 5);
	}

	private addFooter(invoice: Invoice, template: InvoiceTemplate) {
		const footerY = this.pageHeight - 40;

		// Notes
		if (invoice.notes) {
			this.doc.setFont('helvetica', 'bold');
			this.doc.setFontSize(10);
			this.doc.text('Notes:', this.margin, footerY - 20);
			
			this.doc.setFont('helvetica', 'normal');
			this.doc.setFontSize(9);
			const noteLines = this.doc.splitTextToSize(invoice.notes, this.pageWidth - 2 * this.margin);
			this.doc.text(noteLines, this.margin, footerY - 12);
		}

		// Footer template
		if (template.footerTemplate) {
			this.doc.setFont('helvetica', 'normal');
			this.doc.setFontSize(8);
			this.doc.setTextColor(128, 128, 128);
			this.doc.text(template.footerTemplate, this.margin, footerY);
		} else {
			// Default footer
			this.doc.setFont('helvetica', 'normal');
			this.doc.setFontSize(8);
			this.doc.setTextColor(128, 128, 128);
			this.doc.text('Thank you for your business!', this.margin, footerY);
		}

		// Page number
		this.doc.text(
			`Page 1 of 1`,
			this.pageWidth - this.margin - 20,
			footerY
		);
	}

	private addWatermark(text: string) {
		this.doc.setTextColor(200, 200, 200);
		this.doc.setFontSize(60);
		this.doc.setFont('helvetica', 'bold');
		
		// Rotate and center the watermark
		const centerX = this.pageWidth / 2;
		const centerY = this.pageHeight / 2;
		
		this.doc.text(text, centerX, centerY, {
			angle: 45,
			align: 'center'
		});
	}

	private formatCurrency(amount: number, currency: string): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency
		}).format(amount);
	}

	private hexToRgb(hex: string): { r: number; g: number; b: number } {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : { r: 59, g: 130, b: 246 }; // Default blue
	}

	private getDefaultTemplate(): InvoiceTemplate {
		return {
			id: 'default',
			name: 'Default Template',
			type: 'standard',
			description: 'Standard invoice template',
			primaryColor: '#3b82f6',
			secondaryColor: '#64748b',
			fontFamily: 'Inter',
			isDefault: true,
			isActive: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		} as InvoiceTemplate;
	}

	private getDefaultCompanyInfo(): CompanyInfo {
		return {
			name: 'Your Company Name',
			address: '123 Business Street\nCity, State 12345',
			phone: '+1 (555) 123-4567',
			email: 'contact@yourcompany.com',
			website: 'www.yourcompany.com'
		};
	}

	// Generate multiple invoice PDFs for bulk operations
	static async generateBulkPDFs(
		invoices: Array<{ invoice: Invoice; items: InvoiceItem[] }>,
		options: PDFGenerationOptions = {}
	): Promise<Array<{ invoiceId: string; pdf: Uint8Array; error?: string }>> {
		const results = [];

		for (const { invoice, items } of invoices) {
			try {
				const generator = new PDFGenerator();
				const pdf = await generator.generateInvoicePDF(invoice, items, options);
				results.push({
					invoiceId: invoice.id,
					pdf
				});
			} catch (error) {
				results.push({
					invoiceId: invoice.id,
					pdf: new Uint8Array(),
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}

		return results;
	}
}