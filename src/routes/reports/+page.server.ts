import { db } from '$lib/server/db';
import { invoices, invoiceItems, payments } from '$lib/server/db/schema';
import { sql, and, gte, lte, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const startDate = url.searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
	const endDate = url.searchParams.get('endDate') || new Date().toISOString().split('T')[0];

	// VAT Report Data
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

	// Calculate VAT summary
	const vatSummary = vatData.reduce(
		(acc, inv) => {
			acc.totalSales += inv.subtotal || 0;
			acc.totalVat += inv.taxAmount || 0;
			acc.totalWithVat += inv.total || 0;
			return acc;
		},
		{ totalSales: 0, totalVat: 0, totalWithVat: 0 }
	);

	// Petty Cash Report Data (using payments table)
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

	// Calculate petty cash summary
	const pettyCashSummary = pettyCashData.reduce(
		(acc, payment) => {
			acc.totalCash += payment.amount || 0;
			acc.transactionCount += 1;
			return acc;
		},
		{ totalCash: 0, transactionCount: 0 }
	);

	return {
		vatReport: {
			data: vatData,
			summary: vatSummary
		},
		pettyCashReport: {
			data: pettyCashData,
			summary: pettyCashSummary
		},
		filters: {
			startDate,
			endDate
		}
	};
};
