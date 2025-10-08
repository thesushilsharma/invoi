import { db } from '$lib/server/db';
import { clients } from '$lib/server/db/schema';
import { desc, ilike } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	try {
		let query = db.select().from(clients).orderBy(desc(clients.createdAt));

		if (search) {
			query = query.where(ilike(clients.name, `%${search}%`));
		}

		const clientList = await query.limit(limit).offset(offset);
		
		// Get total count for pagination
		const totalQuery = db.select({ count: clients.id }).from(clients);
		const totalResult = await (search ? 
			totalQuery.where(ilike(clients.name, `%${search}%`)) : 
			totalQuery
		);

		return {
			clients: clientList,
			pagination: {
				page,
				limit,
				total: totalResult.length,
				totalPages: Math.ceil(totalResult.length / limit)
			},
			search
		};
	} catch (error) {
		console.error('Error loading clients:', error);
		return {
			clients: [],
			pagination: { page: 1, limit, total: 0, totalPages: 0 },
			search: ''
		};
	}
};