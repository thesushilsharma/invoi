import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { attendance, payslips, staff, type Attendance, type NewPayslip, type Staff } from '$lib/server/db/schema';

export type AttendanceSummary = {
	month: string;
	workingDays: number;
	paidDays: number;
	lopDays: number;
	absentDays: number;
	halfDays: number;
	presentDays: number;
	totalHours: number;
	overtimeHours: number;
};

export type PayslipPreviewData = {
	month: string;
	year: number;
	paymentDate: string;
	basicSalary: number;
	allowances: number;
	overtime: number;
	bonus: number;
	taxDeduction: number;
	otherDeductions: number;
	grossSalary: number;
	netSalary: number;
	attendance: AttendanceSummary;
};

function getMonthBounds(month: string) {
	const [year, monthIndex] = month.split('-').map(Number);
	const start = new Date(year, monthIndex - 1, 1);
	const end = new Date(year, monthIndex, 0);
	return { start, end, year };
}

function toDateString(value: Date) {
	return value.toISOString().split('T')[0];
}

function getEmploymentRange(staffMember: Staff, month: string) {
	const { start, end } = getMonthBounds(month);
	const joinDate = staffMember.joinDate ? new Date(staffMember.joinDate) : start;
	const rangeStart = joinDate > start ? joinDate : start;

	if (rangeStart > end) {
		return { start: null, end: null, workingDays: 0 };
	}

	const startAt = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
	const endAt = new Date(end.getFullYear(), end.getMonth(), end.getDate());
	const workingDays =
		Math.floor((endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;

	return { start: startAt, end: endAt, workingDays };
}

export function calculateAttendanceSummary(staffMember: Staff, records: Attendance[], month: string): AttendanceSummary {
	const { workingDays } = getEmploymentRange(staffMember, month);
	let paidDays = 0;
	let absentDays = 0;
	let halfDays = 0;
	let presentDays = 0;
	let totalHours = 0;

	for (const record of records) {
		totalHours += Number(record.hoursWorked || 0);

		switch (record.status) {
			case 'present':
			case 'late':
			case 'on_leave':
				paidDays += 1;
				presentDays += 1;
				break;
			case 'half_day':
				paidDays += 0.5;
				halfDays += 1;
				break;
			case 'absent':
			default:
				absentDays += 1;
				break;
		}
	}

	const lopDays = Math.max(workingDays - paidDays, 0);
	const overtimeHours = Math.max(totalHours - paidDays * 8, 0);

	return {
		month,
		workingDays,
		paidDays: Number(paidDays.toFixed(2)),
		lopDays: Number(lopDays.toFixed(2)),
		absentDays,
		halfDays,
		presentDays,
		totalHours: Number(totalHours.toFixed(2)),
		overtimeHours: Number(overtimeHours.toFixed(2))
	};
}

export async function getAttendanceForMonth(staffId: string, month: string) {
	const [staffMember] = await db.select().from(staff).where(eq(staff.id, staffId));
	if (!staffMember) {
		throw new Error('Staff member not found');
	}

	const { start, end } = getEmploymentRange(staffMember, month);
	if (!start || !end) {
		return {
			staff: staffMember,
			records: [],
			summary: calculateAttendanceSummary(staffMember, [], month)
		};
	}

	const records = await db
		.select()
		.from(attendance)
		.where(
			and(
				eq(attendance.staffId, staffId),
				gte(attendance.date, toDateString(start)),
				lte(attendance.date, toDateString(end))
			)
		)
		.orderBy(asc(attendance.date));

	return {
		staff: staffMember,
		records,
		summary: calculateAttendanceSummary(staffMember, records, month)
	};
}

export function buildPayslipPreview(
	staffMember: Staff,
	attendanceSummary: AttendanceSummary,
	values?: Partial<Pick<
		NewPayslip,
		'overtime' | 'bonus' | 'taxDeduction' | 'otherDeductions' | 'paidDate'
	>>
): PayslipPreviewData {
	const baseSalary = Number(staffMember.basicSalary || 0);
	const baseAllowances = Number(staffMember.allowances || 0);
	const divisor = attendanceSummary.workingDays || 1;

	const earnedBasicSalary = (baseSalary / divisor) * attendanceSummary.paidDays;
	const earnedAllowances = (baseAllowances / divisor) * attendanceSummary.paidDays;
	const overtime = Number(values?.overtime || 0);
	const bonus = Number(values?.bonus || 0);
	const taxDeduction = Number(values?.taxDeduction || 0);
	const otherDeductions = Number(values?.otherDeductions || 0);
	const grossSalary = earnedBasicSalary + earnedAllowances + overtime + bonus;
	const netSalary = grossSalary - taxDeduction - otherDeductions;
	const { year } = getMonthBounds(attendanceSummary.month);

	return {
		month: attendanceSummary.month,
		year,
		paymentDate: values?.paidDate || toDateString(new Date()),
		basicSalary: Number(earnedBasicSalary.toFixed(2)),
		allowances: Number(earnedAllowances.toFixed(2)),
		overtime: Number(overtime.toFixed(2)),
		bonus: Number(bonus.toFixed(2)),
		taxDeduction: Number(taxDeduction.toFixed(2)),
		otherDeductions: Number(otherDeductions.toFixed(2)),
		grossSalary: Number(grossSalary.toFixed(2)),
		netSalary: Number(netSalary.toFixed(2)),
		attendance: attendanceSummary
	};
}

export async function getPayslipPreview(staffId: string, month: string, values?: Partial<NewPayslip>) {
	const { staff: staffMember, summary } = await getAttendanceForMonth(staffId, month);
	return buildPayslipPreview(staffMember, summary, values);
}

export async function listPayslipsForStaff(staffId: string) {
	return db.select().from(payslips).where(eq(payslips.staffId, staffId)).orderBy(asc(payslips.month));
}
