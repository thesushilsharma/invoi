import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { payslips } from '$lib/server/db/schema';
import { buildPayslipPreview, getAttendanceForMonth, listPayslipsForStaff } from '$lib/server/payroll';
import type { RequestHandler } from './$types';

function getDefaultMonth() {
	return new Date().toISOString().slice(0, 7);
}

export const GET: RequestHandler = async ({ params, url }) => {
	try {
		const month = url.searchParams.get('month') || getDefaultMonth();
		const [{ staff: staffMember, summary }, existingPayslips] = await Promise.all([
			getAttendanceForMonth(params.id, month),
			listPayslipsForStaff(params.id)
		]);

		return json({
			staff: staffMember,
			summary,
			preview: buildPayslipPreview(staffMember, summary),
			payslips: existingPayslips
		});
	} catch (error) {
		console.error('Failed to fetch payslips:', error);
		return json({ error: 'Failed to fetch payslips' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const payload = await request.json();
		const month = payload.month || getDefaultMonth();
		const { staff: staffMember, summary } = await getAttendanceForMonth(params.id, month);
		const preview = buildPayslipPreview(staffMember, summary, payload);
		const [year] = [preview.year];

		const [payslip] = await db
			.insert(payslips)
			.values({
				staffId: params.id,
				month,
				year,
				basicSalary: preview.basicSalary,
				allowances: preview.allowances,
				overtime: preview.overtime,
				bonus: preview.bonus,
				taxDeduction: preview.taxDeduction,
				otherDeductions: preview.otherDeductions,
				grossSalary: preview.grossSalary,
				netSalary: preview.netSalary,
				workingDays: preview.attendance.workingDays,
				presentDays: Math.round(preview.attendance.paidDays),
				absentDays: Math.round(preview.attendance.lopDays),
				isPaid: Boolean(payload.isPaid),
				paidDate: payload.paidDate || preview.paymentDate,
				notes: payload.notes || null
			} as any)
			.returning();

		return json({ payslip, preview }, { status: 201 });
	} catch (error) {
		console.error('Failed to create payslip:', error);
		return json({ error: 'Failed to create payslip' }, { status: 500 });
	}
};
