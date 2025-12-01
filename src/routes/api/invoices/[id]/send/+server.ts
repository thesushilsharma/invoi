import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, invoiceItems } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendInvoiceEmail } from '$lib/server/email-service';
import { PDFGenerator } from '$lib/server/pdf-generator';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	try {
		const [invoice] = await db.select().from(invoices).where(eq(invoices.id, params.id));

		if (!invoice) {
			return json({ error: 'Invoice not found' }, { status: 404 });
		}

		const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, params.id));

		// Generate PDF
		const pdfGenerator = new PDFGenerator();
		const pdfBuffer = await pdfGenerator.generateInvoicePDF(invoice, items);

		// Send email
		const result = await sendInvoiceEmail(invoice, Buffer.from(pdfBuffer));

		if (!result.success) {
			return json({ error: result.error }, { status: 500 });
		}

		// Update invoice status to sent
		await db
			.update(invoices)
			.set({ status: 'sent', updatedAt: new Date() })
			.where(eq(invoices.id, params.id));

		return json({ success: true, message: 'Invoice sent successfully' });
	} catch (error) {
		console.error('Failed to send invoice:', error);
		return json({ error: 'Failed to send invoice' }, { status: 500 });
	}
};
