import { db } from '$lib/server/db';
import { payments } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		const allPayments = await db
			.select()
			.from(payments)
			.orderBy(desc(payments.createdAt));

		return {
			payments: allPayments
		};
	} catch (error) {
		console.error('Error loading payments:', error);
		return {
			payments: []
		};
	}
};