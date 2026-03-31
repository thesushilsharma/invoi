import { db } from '$lib/server/db';
import { clients } from '$lib/server/db/schema';
import { count, desc, ilike } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('search') || '';
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	try {
		const filter = search ? ilike(clients.name, `%${search}%`) : undefined;
		const clientList = await (filter
			? db.select().from(clients).where(filter).orderBy(desc(clients.createdAt)).limit(limit).offset(offset)
			: db.select().from(clients).orderBy(desc(clients.createdAt)).limit(limit).offset(offset));
		
		const totalResult = await (filter
			? db.select({ count: count() }).from(clients).where(filter)
			: db.select({ count: count() }).from(clients));
		const total = totalResult[0]?.count ?? 0;

		return {
			clients: clientList,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit)
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
