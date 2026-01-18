import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { payments, invoices } from '$lib/server/db/schema';
import { and, gte, lte, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const startDate = url.searchParams.get('startDate');
	const endDate = url.searchParams.get('endDate');
	const format = url.searchParams.get('format') || 'json';

	if (!startDate || !endDate) {
		return json({ error: 'Start date and end date are required' }, { status: 400 });
	}

	try {
		const pettyCashData = await db
			.select({
				id: payments.id,
				invoiceId: payments.invoiceId,
				amount: payments.amount,
				paymentDate: payments.paymentDate,
				paymentMethod: payments.paymentMethod,
				transactionId: payments.transactionId,
				notes: payments.notes,
				invoiceNumber: invoices.invoiceNumber,
				clientName: invoices.clientName
			})
			.from(payments)
			.leftJoin(invoices, eq(payments.invoiceId, invoices.id))
			.where(
				and(
					gte(payments.paymentDate, startDate),
					lte(payments.paymentDate, endDate),
					eq(payments.paymentMethod, 'cash')
				)
			)
			.orderBy(payments.paymentDate);

		const summary = pettyCashData.reduce(
			(acc, payment) => {
				acc.totalCash += payment.amount || 0;
				acc.transactionCount += 1;
				return acc;
			},
			{ totalCash: 0, transactionCount: 0 }
		);

		if (format === 'csv') {
			let csv = 'Date,Invoice Number,Client,Amount,Payment Method,Transaction ID,Notes\n';
			pettyCashData.forEach((row) => {
				csv += `${row.paymentDate},"${row.invoiceNumber || 'N/A'}","${row.clientName || 'N/A'}",${row.amount},${row.paymentMethod},"${row.transactionId || ''}","${row.notes || ''}"\n`;
			});

			return new Response(csv, {
				headers: {
					'Content-Type': 'text/csv',
					'Content-Disposition': `attachment; filename="petty-cash-report-${startDate}-to-${endDate}.csv"`
				}
			});
		}

		return json({
			data: pettyCashData,
			summary,
			period: { startDate, endDate }
		});
	} catch (error) {
		console.error('Error generating petty cash report:', error);
		return json({ error: 'Failed to generate petty cash report' }, { status: 500 });
	}
};
