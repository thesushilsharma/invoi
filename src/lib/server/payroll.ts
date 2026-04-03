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

export type TimesheetMemberSummary = {
	staffId: string;
	employeeId: string;
	name: string;
	position: string;
	department: string | null;
	status: Staff['status'];
	workingDays: number;
	paidDays: number;
	lopDays: number;
	totalHours: number;
	overtimeHours: number;
	trackedEntries: number;
	expectedEntries: number;
	coveragePercent: number;
	averageHoursPerPaidDay: number;
};

export type TimesheetRecommendation = {
	type: 'missing' | 'overtime' | 'undertracked';
	title: string;
	message: string;
	staffId?: string;
};

export type TeamTimesheetData = {
	month: string;
	totals: {
		staffCount: number;
		totalHours: number;
		paidDays: number;
		lopDays: number;
		overtimeHours: number;
		coveragePercent: number;
	};
	members: TimesheetMemberSummary[];
	recommendations: TimesheetRecommendation[];
	recentEntries: Array<{
		id: string;
		staffId: string;
		name: string;
		date: string;
		status: Attendance['status'];
		hoursWorked: number;
		checkIn: string | null;
		checkOut: string | null;
		notes: string | null;
	}>;
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

export async function getTeamTimesheetData(month: string): Promise<TeamTimesheetData> {
	const staffMembers = await db.select().from(staff).orderBy(asc(staff.firstName), asc(staff.lastName));

	if (staffMembers.length === 0) {
		return {
			month,
			totals: {
				staffCount: 0,
				totalHours: 0,
				paidDays: 0,
				lopDays: 0,
				overtimeHours: 0,
				coveragePercent: 0
			},
			members: [],
			recommendations: [],
			recentEntries: []
		};
	}

	const monthBounds = getMonthBounds(month);
	const allRecords = await db
		.select()
		.from(attendance)
		.where(and(gte(attendance.date, toDateString(monthBounds.start)), lte(attendance.date, toDateString(monthBounds.end))))
		.orderBy(asc(attendance.date));

	const recordsByStaff = new Map<string, Attendance[]>();
	for (const record of allRecords) {
		const existing = recordsByStaff.get(record.staffId) ?? [];
		existing.push(record);
		recordsByStaff.set(record.staffId, existing);
	}

	const members = staffMembers.map((staffMember) => {
		const records = recordsByStaff.get(staffMember.id) ?? [];
		const summary = calculateAttendanceSummary(staffMember, records, month);
		const expectedEntries = summary.workingDays;
		const trackedEntries = records.length;
		const coveragePercent =
			expectedEntries > 0 ? Number(((trackedEntries / expectedEntries) * 100).toFixed(1)) : 0;
		const averageHoursPerPaidDay =
			summary.paidDays > 0 ? Number((summary.totalHours / summary.paidDays).toFixed(2)) : 0;

		return {
			staffId: staffMember.id,
			employeeId: staffMember.employeeId,
			name: `${staffMember.firstName} ${staffMember.lastName}`.trim(),
			position: staffMember.position,
			department: staffMember.department,
			status: staffMember.status,
			workingDays: summary.workingDays,
			paidDays: summary.paidDays,
			lopDays: summary.lopDays,
			totalHours: summary.totalHours,
			overtimeHours: summary.overtimeHours,
			trackedEntries,
			expectedEntries,
			coveragePercent,
			averageHoursPerPaidDay
		};
	});

	const totals = members.reduce(
		(acc, member) => {
			acc.totalHours += member.totalHours;
			acc.paidDays += member.paidDays;
			acc.lopDays += member.lopDays;
			acc.overtimeHours += member.overtimeHours;
			acc.expectedEntries += member.expectedEntries;
			acc.trackedEntries += member.trackedEntries;
			return acc;
		},
		{
			totalHours: 0,
			paidDays: 0,
			lopDays: 0,
			overtimeHours: 0,
			expectedEntries: 0,
			trackedEntries: 0
		}
	);

	const recommendations: TimesheetRecommendation[] = [];
	for (const member of members) {
		if (member.expectedEntries > 0 && member.trackedEntries === 0) {
			recommendations.push({
				type: 'missing',
				title: `${member.name} has no timesheets logged`,
				message: `No daily entries were recorded for ${month}. Add attendance records to avoid payroll and billing gaps.`,
				staffId: member.staffId
			});
			continue;
		}

		if (member.coveragePercent > 0 && member.coveragePercent < 70) {
			recommendations.push({
				type: 'undertracked',
				title: `${member.name} has incomplete timesheets`,
				message: `Only ${member.coveragePercent}% of expected working days have entries this month.`,
				staffId: member.staffId
			});
		}

		if (member.overtimeHours >= 12) {
			recommendations.push({
				type: 'overtime',
				title: `${member.name} is trending into overtime`,
				message: `${member.overtimeHours.toFixed(1)} overtime hours are already recorded for ${month}.`,
				staffId: member.staffId
			});
		}
	}

	const staffMap = new Map(staffMembers.map((staffMember) => [staffMember.id, staffMember]));
	const recentEntries = [...allRecords]
		.sort((left, right) => right.date.localeCompare(left.date))
		.slice(0, 12)
		.map((record) => {
			const staffMember = staffMap.get(record.staffId);
			return {
				id: record.id,
				staffId: record.staffId,
				name: staffMember ? `${staffMember.firstName} ${staffMember.lastName}`.trim() : 'Unknown staff',
				date: record.date,
				status: record.status,
				hoursWorked: Number(record.hoursWorked || 0),
				checkIn: record.checkIn,
				checkOut: record.checkOut,
				notes: record.notes
			};
		});

	return {
		month,
		totals: {
			staffCount: staffMembers.length,
			totalHours: Number(totals.totalHours.toFixed(2)),
			paidDays: Number(totals.paidDays.toFixed(2)),
			lopDays: Number(totals.lopDays.toFixed(2)),
			overtimeHours: Number(totals.overtimeHours.toFixed(2)),
			coveragePercent:
				totals.expectedEntries > 0
					? Number(((totals.trackedEntries / totals.expectedEntries) * 100).toFixed(1))
					: 0
		},
		members,
		recommendations: recommendations.slice(0, 6),
		recentEntries
	};
}
