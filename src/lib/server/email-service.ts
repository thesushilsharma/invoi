import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import type { Invoice } from './db/schema';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendInvoiceEmail(invoice: Invoice, pdfBuffer?: Buffer) {
	if (!resend) {
		console.warn('Resend API key not configured. Email not sent.');
		return { success: false, error: 'Email service not configured' };
	}

	try {
		const { data, error } = await resend.emails.send({
			from: env.EMAIL_FROM || 'invoices@yourdomain.com',
			to: invoice.clientEmail,
			subject: `Invoice ${invoice.invoiceNumber} from ${env.COMPANY_NAME || 'Your Company'}`,
			html: generateInvoiceEmailHTML(invoice),
			attachments: pdfBuffer
				? [
						{
							filename: `${invoice.invoiceNumber}.pdf`,
							content: pdfBuffer
						}
					]
				: undefined
		});

		if (error) {
			console.error('Failed to send email:', error);
			return { success: false, error: error.message };
		}

		return { success: true, data };
	} catch (error) {
		console.error('Failed to send email:', error);
		return { success: false, error: String(error) };
	}
}

export async function sendPaymentReminderEmail(invoice: Invoice) {
	if (!resend) {
		console.warn('Resend API key not configured. Email not sent.');
		return { success: false, error: 'Email service not configured' };
	}

	try {
		const { data, error } = await resend.emails.send({
			from: env.EMAIL_FROM || 'invoices@yourdomain.com',
			to: invoice.clientEmail,
			subject: `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
			html: generateReminderEmailHTML(invoice)
		});

		if (error) {
			console.error('Failed to send reminder email:', error);
			return { success: false, error: error.message };
		}

		return { success: true, data };
	} catch (error) {
		console.error('Failed to send reminder email:', error);
		return { success: false, error: String(error) };
	}
}

function generateInvoiceEmailHTML(invoice: Invoice): string {
	return `
<!DOCTYPE html>
<html>
<head>
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
		.content { padding: 20px; background: #f9fafb; }
		.invoice-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
		.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
		.button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>New Invoice</h1>
		</div>
		<div class="content">
			<p>Dear ${invoice.clientName},</p>
			<p>Please find attached your invoice details:</p>
			
			<div class="invoice-details">
				<p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
				<p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
				<p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
				<p><strong>Amount Due:</strong> ${invoice.currency} ${invoice.total.toFixed(2)}</p>
			</div>
			
			<p>Please process the payment by the due date to avoid any late fees.</p>
			
			<p>Thank you for your business!</p>
		</div>
		<div class="footer">
			<p>This is an automated email. Please do not reply.</p>
		</div>
	</div>
</body>
</html>
	`;
}

function generateReminderEmailHTML(invoice: Invoice): string {
	const daysUntilDue = Math.ceil(
		(new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
	);

	return `
<!DOCTYPE html>
<html>
<head>
	<style>
		body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
		.content { padding: 20px; background: #f9fafb; }
		.invoice-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
		.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
		.urgent { color: #dc2626; font-weight: bold; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>Payment Reminder</h1>
		</div>
		<div class="content">
			<p>Dear ${invoice.clientName},</p>
			<p>This is a friendly reminder that payment for the following invoice is ${daysUntilDue > 0 ? `due in ${daysUntilDue} days` : '<span class="urgent">overdue</span>'}:</p>
			
			<div class="invoice-details">
				<p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
				<p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
				<p><strong>Amount Due:</strong> ${invoice.currency} ${invoice.total.toFixed(2)}</p>
			</div>
			
			<p>Please process the payment at your earliest convenience.</p>
			
			<p>If you have already made the payment, please disregard this reminder.</p>
			
			<p>Thank you!</p>
		</div>
		<div class="footer">
			<p>This is an automated email. Please do not reply.</p>
		</div>
	</div>
</body>
</html>
	`;
}
