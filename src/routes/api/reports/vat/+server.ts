import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices } from '$lib/server/db/schema';
import { sql, and, gte, lte } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const startDate = url.searchParams.get('startDate');
	const endDate = url.searchParams.get('endDate');
	const format = url.searchParams.get('format') || 'json';

	if (!startDate || !endDate) {
		return json({ error: 'Start date and end date are required' }, { status: 400 });
	}

	try {
		const vatData = await db
			.select({
				invoiceNumber: invoices.invoiceNumber,
				clientName: invoices.clientName,
				issueDate: invoices.issueDate,
				subtotal: invoices.subtotal,
				taxRate: invoices.taxRate,
				taxAmount: invoices.taxAmount,
				total: invoices.total,
				status: invoices.status,
				currency: invoices.currency
			})
			.from(invoices)
			.where(
				and(
					gte(invoices.issueDate, startDate),
					lte(invoices.issueDate, endDate),
					sql`${invoices.status} != 'cancelled'`
				)
			)
			.orderBy(invoices.issueDate);

		const summary = vatData.reduce(
			(acc, inv) => {
				acc.totalSales += inv.subtotal || 0;
				acc.totalVat += inv.taxAmount || 0;
				acc.totalWithVat += inv.total || 0;
				return acc;
			},
			{ totalSales: 0, totalVat: 0, totalWithVat: 0 }
		);

		if (format === 'csv') {
			let csv = 'Invoice Number,Client Name,Date,Subtotal,VAT Rate,VAT Amount,Total,Status,Currency\n';
			vatData.forEach((row) => {
				csv += `${row.invoiceNumber},"${row.clientName}",${row.issueDate},${row.subtotal},${row.taxRate}%,${row.taxAmount},${row.total},${row.status},${row.currency}\n`;
			});

			return new Response(csv, {
				headers: {
					'Content-Type': 'text/csv',
					'Content-Disposition': `attachment; filename="vat-report-${startDate}-to-${endDate}.csv"`
				}
			});
		}

		return json({
			data: vatData,
			summary,
			period: { startDate, endDate }
		});
	} catch (error) {
		console.error('Error generating VAT report:', error);
		return json({ error: 'Failed to generate VAT report' }, { status: 500 });
	}
};
