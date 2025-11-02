import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, invoiceItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { PDFGenerator } from '$lib/server/pdf-generator';
import { TemplateService } from '$lib/server/template-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const invoiceId = params.id;
		const download = url.searchParams.get('download') === 'true';
		const templateId = url.searchParams.get('template');

		// Get invoice
		const invoice = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, invoiceId))
			.limit(1);

		if (!invoice.length) {
			return json({ error: 'Invoice not found' }, { status: 404 });
		}

		// Get invoice items
		const items = await db
			.select()
			.from(invoiceItems)
			.where(eq(invoiceItems.invoiceId, invoiceId));

		// Get template
		let template = null;
		if (templateId) {
			template = await TemplateService.getTemplateById(templateId);
		} else if (invoice[0].templateId) {
			template = await TemplateService.getTemplateById(invoice[0].templateId);
		}

		if (!template) {
			template = await TemplateService.getDefaultTemplate();
		}

		// Generate PDF
		const generator = new PDFGenerator();
		const pdfBuffer = await generator.generateInvoicePDF(
			invoice[0],
			items,
			{
				template,
				companyInfo: {
					name: 'Your Company Name',
					address: '123 Business Street\nCity, State 12345',
					phone: '+1 (555) 123-4567',
					email: 'contact@yourcompany.com'
				}
			}
		);

		// Set response headers
		const headers = new Headers();
		headers.set('Content-Type', 'application/pdf');
		
		if (download) {
			headers.set('Content-Disposition', `attachment; filename="invoice-${invoice[0].invoiceNumber}.pdf"`);
		} else {
			headers.set('Content-Disposition', `inline; filename="invoice-${invoice[0].invoiceNumber}.pdf"`);
		}

		return new Response(pdfBuffer, { headers });
	} catch (error) {
		console.error('Error generating PDF:', error);
		return json({ error: 'Failed to generate PDF' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const invoiceId = params.id;
		const { templateId, customization } = await request.json();

		// Get invoice and items (same as GET)
		const invoice = await db
			.select()
			.from(invoices)
			.where(eq(invoices.id, invoiceId))
			.limit(1);

		if (!invoice.length) {
			return json({ error: 'Invoice not found' }, { status: 404 });
		}

		const items = await db
			.select()
			.from(invoiceItems)
			.where(eq(invoiceItems.invoiceId, invoiceId));

		// Get template
		let template = null;
		if (templateId) {
			template = await TemplateService.getTemplateById(templateId);
		}

		if (!template) {
			template = await TemplateService.getDefaultTemplate();
		}

		// Generate PDF with customization
		const generator = new PDFGenerator();
		const pdfBuffer = await generator.generateInvoicePDF(
			invoice[0],
			items,
			{
				template,
				customization,
				companyInfo: {
					name: 'Your Company Name',
					address: '123 Business Street\nCity, State 12345',
					phone: '+1 (555) 123-4567',
					email: 'contact@yourcompany.com'
				}
			}
		);

		// Save PDF path to invoice (in real app, save to file system)
		const pdfPath = `/pdfs/invoice-${invoiceId}.pdf`;
		await db
			.update(invoices)
			.set({ pdfPath })
			.where(eq(invoices.id, invoiceId));

		return json({
			success: true,
			pdfPath,
			size: pdfBuffer.length
		});
	} catch (error) {
		console.error('Error generating custom PDF:', error);
		return json({ error: 'Failed to generate PDF' }, { status: 500 });
	}
};