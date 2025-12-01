import { jsPDF } from 'jspdf';
import type { Invoice, InvoiceItem, Settings } from '$lib/server/db/schema';

export interface EnhancedPDFOptions {
	settings?: Settings;
	logoBase64?: string;
	stampBase64?: string;
	signatureBase64?: string;
	showWatermark?: boolean;
}

export class EnhancedPDFGenerator {
	private doc: jsPDF;
	private pageWidth: number;
	private pageHeight: number;
	private margin: number = 15;

	constructor() {
		this.doc = new jsPDF();
		this.pageWidth = this.doc.internal.pageSize.getWidth();
		this.pageHeight = this.doc.internal.pageSize.getHeight();
	}

	async generateInvoicePDF(
		invoice: Invoice,
		items: InvoiceItem[],
		options: EnhancedPDFOptions = {}
	): Promise<Uint8Array> {
		this.doc = new jsPDF();

		// Add watermark logo in background
		if (options.showWatermark && options.logoBase64) {
			await this.addWatermarkLogo(options.logoBase64);
		}

		// Add header with company info and logo
		await this.addHeader(invoice, options);

		// Add "Tax Invoice" title
		this.addInvoiceTitle();

		// Add client info and invoice details
		this.addClientAndInvoiceInfo(invoice);

		// Add items table
		this.addItemsTable(items, invoice);

		// Add totals section
		this.addTotalsSection(invoice, items);

		// Add amount in words, stamp, and signature
		await this.addFooterSection(invoice, options);

		const arrayBuffer = this.doc.output('arraybuffer');
		return new Uint8Array(arrayBuffer);
	}

	private async addWatermarkLogo(logoBase64: string) {
		try {
			// Add semi-transparent watermark in center
			const imgWidth = 80;
			const imgHeight = 80;
			const x = (this.pageWidth - imgWidth) / 2;
			const y = (this.pageHeight - imgHeight) / 2;

			// Set opacity for watermark effect
			this.doc.saveGraphicsState();
			this.doc.setGState(new this.doc.GState({ opacity: 0.1 }));
			this.doc.addImage(logoBase64, 'PNG', x, y, imgWidth, imgHeight);
			this.doc.restoreGraphicsState();
		} catch (error) {
			console.error('Error adding watermark:', error);
		}
	}

	private async addHeader(invoice: Invoice, options: EnhancedPDFOptions) {
		const settings = options.settings;
		
		// Draw border around header
		this.doc.setDrawColor(0, 0, 0);
		this.doc.setLineWidth(0.5);
		this.doc.rect(this.margin, this.margin, this.pageWidth - 2 * this.margin, 50);

		let yPos = this.margin + 8;

		// Add company logo if available
		if (options.logoBase64) {
			try {
				this.doc.addImage(options.logoBase64, 'PNG', this.margin + 5, yPos, 30, 30);
			} catch (error) {
				console.error('Error adding logo:', error);
			}
		}

		// Company name in Arabic and English
		const companyNameAr = settings?.companyName || 'شركة الأحداث المنظمة';
		const companyNameEn = settings?.companyName || 'SUNLIGHT EVENTS ORGANIZING LLC';
		
		this.doc.setFontSize(10);
		this.doc.setFont('helvetica', 'bold');
		
		// Arabic name (right-aligned)
		const arabicX = this.pageWidth - this.margin - 5;
		this.doc.text(companyNameAr, arabicX, yPos + 5, { align: 'right' });
		
		// English name (centered)
		this.doc.setFontSize(14);
		this.doc.text(companyNameEn, this.pageWidth / 2, yPos + 12, { align: 'center' });

		// Contact details (centered)
		this.doc.setFontSize(9);
		this.doc.setFont('helvetica', 'normal');
		yPos += 18;

		const phone = settings?.companyPhone || '+971 586 15 7015';
		const address = settings?.companyAddress || 'M 346, Humsah-A, Al Karama P.O. BOX- 8077';
		const email = settings?.companyEmail || 'sunlighteeventsorganizing@gmail.com';
		const trn = settings?.companyTaxId || '100549677100003';

		this.doc.text(`Mob : ${phone}`, this.pageWidth / 2, yPos, { align: 'center' });
		yPos += 5;
		this.doc.text(address, this.pageWidth / 2, yPos, { align: 'center' });
		yPos += 5;
		this.doc.text(`Email: ${email}`, this.pageWidth / 2, yPos, { align: 'center' });
		yPos += 5;
		this.doc.text(`TRN No. : ${trn}`, this.pageWidth / 2, yPos, { align: 'center' });
	}

	private addInvoiceTitle() {
		const yPos = this.margin + 70;
		
		// Gray background for title
		this.doc.setFillColor(220, 220, 220);
		this.doc.rect(this.margin, yPos, this.pageWidth - 2 * this.margin, 8, 'F');
		
		// "Tax Invoice" text
		this.doc.setFontSize(12);
		this.doc.setFont('helvetica', 'bold');
		this.doc.setTextColor(0, 0, 0);
		this.doc.text('Tax Invoice', this.pageWidth / 2, yPos + 6, { align: 'center' });
	}

	private addClientAndInvoiceInfo(invoice: Invoice) {
		let yPos = this.margin + 82;
		
		// Draw border
		this.doc.setDrawColor(0, 0, 0);
		this.doc.rect(this.margin, yPos, this.pageWidth - 2 * this.margin, 30);

		yPos += 6;
		this.doc.setFontSize(9);
		this.doc.setFont('helvetica', 'normal');

		// Left side - Client info
		const leftX = this.margin + 3;
		this.doc.text(invoice.clientName, leftX, yPos);
		yPos += 4;
		
		const addressLines = invoice.clientAddress.split('\n');
		addressLines.forEach(line => {
			this.doc.text(line, leftX, yPos);
			yPos += 4;
		});
		
		if (invoice.clientTrn) {
			this.doc.text(`TRN : ${invoice.clientTrn}`, leftX, yPos);
		}

		// Right side - Invoice details (right-aligned)
		const rightX = this.pageWidth - this.margin - 5;
		yPos = this.margin + 88;
		
		this.doc.text(`Date -`, rightX - 60, yPos);
		this.doc.text(new Date(invoice.issueDate).toLocaleDateString('en-GB'), rightX, yPos, { align: 'right' });
		yPos += 5;
		
		this.doc.text('Invoice #:', rightX - 60, yPos);
		this.doc.text(invoice.invoiceNumber, rightX, yPos, { align: 'right' });
		
		if (invoice.poNumber) {
			yPos += 5;
			this.doc.text('PO #:', rightX - 60, yPos);
			this.doc.text(invoice.poNumber, rightX, yPos, { align: 'right' });
		}

		// Department label
		if (invoice.department) {
			yPos = this.margin + 108;
			this.doc.setFont('helvetica', 'bold');
			this.doc.text(`Department : ${invoice.department}`, this.pageWidth - this.margin - 3, yPos, { align: 'right' });
		}
	}

	private addItemsTable(items: InvoiceItem[], invoice: Invoice) {
		const startY = this.margin + 115;
		let currentY = startY;

		const colWidths = {
			sno: 12,
			date: 20,
			particulars: 45,
			quantity: 18,
			hour: 15,
			perHour: 20,
			vat: 18,
			amount: 25
		};

		// Draw header row with light gray background
		this.doc.setDrawColor(0, 0, 0);
		this.doc.setLineWidth(0.5);
		this.doc.setFillColor(200, 200, 200); // Light gray
		
		let xPos = this.margin;
		const headerHeight = 10;
		
		// Draw all header cells with fill
		this.doc.rect(xPos, currentY, colWidths.sno, headerHeight, 'FD');
		xPos += colWidths.sno;
		this.doc.rect(xPos, currentY, colWidths.date, headerHeight, 'FD');
		xPos += colWidths.date;
		this.doc.rect(xPos, currentY, colWidths.particulars, headerHeight, 'FD');
		xPos += colWidths.particulars;
		this.doc.rect(xPos, currentY, colWidths.quantity, headerHeight, 'FD');
		xPos += colWidths.quantity;
		this.doc.rect(xPos, currentY, colWidths.hour, headerHeight, 'FD');
		xPos += colWidths.hour;
		this.doc.rect(xPos, currentY, colWidths.perHour, headerHeight, 'FD');
		xPos += colWidths.perHour;
		this.doc.rect(xPos, currentY, colWidths.vat, headerHeight, 'FD');
		xPos += colWidths.vat;
		this.doc.rect(xPos, currentY, colWidths.amount, headerHeight, 'FD');
		
		// Add header text
		xPos = this.margin;
		this.doc.setFontSize(8);
		this.doc.setFont('helvetica', 'bold');
		this.doc.setTextColor(0, 0, 0);
		
		this.doc.text('S.NO', xPos + 2, currentY + 6);
		xPos += colWidths.sno;
		this.doc.text('Date', xPos + 2, currentY + 6);
		xPos += colWidths.date;
		this.doc.text('Particulars', xPos + 2, currentY + 6);
		xPos += colWidths.particulars;
		this.doc.text('Quantity', xPos + 2, currentY + 6);
		xPos += colWidths.quantity;
		this.doc.text('Hour', xPos + 2, currentY + 6);
		xPos += colWidths.hour;
		this.doc.text('Per Hour', xPos + 2, currentY + 6);
		xPos += colWidths.perHour;
		this.doc.text('VAT 5%', xPos + 2, currentY + 6);
		xPos += colWidths.vat;
		this.doc.text('Amount', xPos + 2, currentY + 6);

		currentY += headerHeight;

		// Table rows - white background
		this.doc.setFont('helvetica', 'normal');
		this.doc.setFillColor(255, 255, 255);
		
		items.forEach((item, index) => {
			const rowHeight = 8;
			xPos = this.margin;

			this.doc.rect(xPos, currentY, colWidths.sno, rowHeight, 'D');
			this.doc.text((index + 1).toString(), xPos + 2, currentY + 5);
			xPos += colWidths.sno;

			this.doc.rect(xPos, currentY, colWidths.date, rowHeight, 'D');
			if (item.date) {
				this.doc.text(item.date, xPos + 2, currentY + 5);
			}
			xPos += colWidths.date;

			this.doc.rect(xPos, currentY, colWidths.particulars, rowHeight, 'D');
			const descLines = this.doc.splitTextToSize(item.description, colWidths.particulars - 4);
			this.doc.text(descLines[0] || '', xPos + 2, currentY + 5);
			xPos += colWidths.particulars;

			this.doc.rect(xPos, currentY, colWidths.quantity, rowHeight, 'D');
			this.doc.text(item.quantity.toString(), xPos + 2, currentY + 5);
			xPos += colWidths.quantity;

			this.doc.rect(xPos, currentY, colWidths.hour, rowHeight, 'D');
			if (item.hours) {
				this.doc.text(item.hours.toString(), xPos + 2, currentY + 5);
			}
			xPos += colWidths.hour;

			this.doc.rect(xPos, currentY, colWidths.perHour, rowHeight, 'D');
			this.doc.text(`${invoice.currency}${item.unitPrice.toFixed(2)}`, xPos + 2, currentY + 5);
			xPos += colWidths.perHour;

			this.doc.rect(xPos, currentY, colWidths.vat, rowHeight, 'D');
			const vatAmt = item.vatAmount || (item.total * (item.vatPercentage || 5) / 100);
			this.doc.text(`${invoice.currency}${vatAmt.toFixed(2)}`, xPos + 2, currentY + 5);
			xPos += colWidths.vat;

			this.doc.rect(xPos, currentY, colWidths.amount, rowHeight, 'D');
			this.doc.text(`${invoice.currency}${item.total.toFixed(2)}`, xPos + 2, currentY + 5);

			currentY += rowHeight;
		});

		// Fill remaining rows with empty cells
		const minRows = 10;
		const remainingRows = minRows - items.length;
		for (let i = 0; i < remainingRows; i++) {
			xPos = this.margin;
			const rowHeight = 8;
			
			Object.values(colWidths).forEach(width => {
				this.doc.rect(xPos, currentY, width, rowHeight, 'D');
				xPos += width;
			});
			
			currentY += rowHeight;
		}
	}

	private addTotalsSection(invoice: Invoice, items: InvoiceItem[]) {
		const startY = this.margin + 115 + 10 + (10 * 8) + 2; // After table with small gap
		let currentY = startY;

		// Right-aligned totals table
		const labelWidth = 50;
		const valueWidth = 30;
		const totalWidth = labelWidth + valueWidth;
		const boxX = this.pageWidth - this.margin - totalWidth;

		this.doc.setFontSize(9);
		this.doc.setFont('helvetica', 'bold');
		this.doc.setDrawColor(0, 0, 0);
		this.doc.setLineWidth(0.5);

		const rowHeight = 7;

		// Total Amt Excl VAT
		this.doc.rect(boxX, currentY, labelWidth, rowHeight, 'D');
		this.doc.text('Total Amt Excl VAT', boxX + 2, currentY + 5);
		this.doc.rect(boxX + labelWidth, currentY, valueWidth, rowHeight, 'D');
		this.doc.text(`${invoice.currency}${invoice.subtotal.toFixed(2)}`, boxX + labelWidth + valueWidth - 2, currentY + 5, { align: 'right' });
		currentY += rowHeight;

		// Total Quantity
		const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
		this.doc.rect(boxX, currentY, labelWidth, rowHeight, 'D');
		this.doc.text('Total Quantity', boxX + 2, currentY + 5);
		this.doc.rect(boxX + labelWidth, currentY, valueWidth, rowHeight, 'D');
		this.doc.text(totalQty.toFixed(2), boxX + labelWidth + valueWidth - 2, currentY + 5, { align: 'right' });
		currentY += rowHeight;

		// Total VAT %
		this.doc.rect(boxX, currentY, labelWidth, rowHeight, 'D');
		this.doc.text('Total VAT %', boxX + 2, currentY + 5);
		this.doc.rect(boxX + labelWidth, currentY, valueWidth, rowHeight, 'D');
		this.doc.text(`${invoice.currency}${invoice.taxAmount.toFixed(2)}`, boxX + labelWidth + valueWidth - 2, currentY + 5, { align: 'right' });
		currentY += rowHeight;

		// Total Amt Incl VAT - slightly larger
		this.doc.setFontSize(10);
		this.doc.rect(boxX, currentY, labelWidth, rowHeight, 'D');
		this.doc.text('Total Amt Incl VAT', boxX + 2, currentY + 5);
		this.doc.rect(boxX + labelWidth, currentY, valueWidth, rowHeight, 'D');
		this.doc.text(`${invoice.currency}${invoice.total.toFixed(2)}`, boxX + labelWidth + valueWidth - 2, currentY + 5, { align: 'right' });
	}

	private async addFooterSection(invoice: Invoice, options: EnhancedPDFOptions) {
		const footerY = this.pageHeight - 50;

		// Amount in words box
		this.doc.setDrawColor(0, 0, 0);
		this.doc.rect(this.margin, footerY, 100, 25);
		
		this.doc.setFontSize(9);
		this.doc.setFont('helvetica', 'bold');
		this.doc.text('AMOUNT IN WORDS:', this.margin + 2, footerY + 5);
		
		this.doc.setFont('helvetica', 'normal');
		const amountWords = invoice.amountInWords || this.numberToWords(invoice.total);
		const wordLines = this.doc.splitTextToSize(amountWords.toUpperCase(), 95);
		this.doc.text(wordLines, this.margin + 2, footerY + 10);

		// Stamp area
		if (options.stampBase64) {
			try {
				this.doc.addImage(options.stampBase64, 'PNG', this.margin + 35, footerY + 12, 25, 25);
			} catch (error) {
				console.error('Error adding stamp:', error);
			}
		} else {
			// Draw placeholder circle for stamp
			this.doc.setDrawColor(150, 150, 150);
			this.doc.circle(this.margin + 47, footerY + 18, 12);
			this.doc.setFontSize(7);
			this.doc.setTextColor(150, 150, 150);
			this.doc.text('STAMP', this.margin + 40, footerY + 19);
		}

		// Signature area
		const sigX = this.pageWidth - this.margin - 50;
		if (options.signatureBase64) {
			try {
				this.doc.addImage(options.signatureBase64, 'PNG', sigX, footerY + 5, 40, 15);
			} catch (error) {
				console.error('Error adding signature:', error);
			}
		} else {
			// Signature line
			this.doc.setDrawColor(0, 0, 0);
			this.doc.line(sigX, footerY + 20, sigX + 40, footerY + 20);
		}
		
		this.doc.setFontSize(8);
		this.doc.setTextColor(0, 0, 0);
		this.doc.setFont('helvetica', 'italic');
		this.doc.text('Authorized Signature', sigX + 5, footerY + 24);
	}

	private numberToWords(num: number): string {
		const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
		const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
		const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];

		if (num === 0) return 'ZERO DIRHAMS ONLY';

		const convert = (n: number): string => {
			if (n < 10) return ones[n];
			if (n < 20) return teens[n - 10];
			if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
			if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convert(n % 100) : '');
			if (n < 1000000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
			return convert(Math.floor(n / 1000000)) + ' MILLION' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
		};

		const [whole, decimal] = num.toFixed(2).split('.');
		let result = convert(parseInt(whole)) + ' DIRHAMS';
		
		if (parseInt(decimal) > 0) {
			result += ' AND ' + convert(parseInt(decimal)) + ' FILS';
		} else {
			result += ' ONLY';
		}

		return result;
	}
}
