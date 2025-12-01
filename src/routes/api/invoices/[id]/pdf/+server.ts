import { db } from '$lib/server/db';
import { invoices, invoiceItems, settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { EnhancedPDFGenerator } from '$lib/server/pdf-generator-enhanced';

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const [invoice] = await db.select().from(invoices).where(eq(invoices.id, params.id));
console.log(invoice);
		if (!invoice) {
			return new Response('Invoice not found', { status: 404 });
		}

		const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, params.id));
		
		if (!items || items.length === 0) {
			return new Response('Invoice items not found', { status: 404 });
		}
		
		// Get company settings for logo, stamp, and signature
		const [companySettings] = await db.select().from(settings).limit(1);

		console.log('Generating PDF for invoice:', invoice.invoiceNumber);
		console.log('Items count:', items.length);
		console.log('Has settings:', !!companySettings);

		const pdfGenerator = new EnhancedPDFGenerator();
		const pdfBuffer = await pdfGenerator.generateInvoicePDF(invoice, items, {
			settings: companySettings || undefined,
			logoBase64: companySettings?.companyLogo || undefined,
			stampBase64: companySettings?.companyStamp || undefined,
			signatureBase64: companySettings?.companySignature || undefined,
			showWatermark: !!companySettings?.companyLogo
		});

		console.log('PDF generated successfully, size:', pdfBuffer.length);

        const arrayBuffer: ArrayBuffer = pdfBuffer.buffer as ArrayBuffer;
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        return new Response(pdfBlob, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`
            }
        });
	} catch (error) {
		console.error('Failed to generate PDF:', error);
		console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
		console.error('Stack:', error instanceof Error ? error.stack : '');
		return new Response(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
	}
};
