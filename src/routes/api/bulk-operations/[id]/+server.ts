import { json } from '@sveltejs/kit';
import { BulkOperationsService } from '$lib/server/bulk-operations';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const operation = await BulkOperationsService.getBulkOperationStatus(params.id);
		
		if (!operation) {
			return json({ error: 'Operation not found' }, { status: 404 });
		}

		return json({ operation });
	} catch (error) {
		console.error('Error fetching bulk operation status:', error);
		return json({ error: 'Failed to fetch operation status' }, { status: 500 });
	}
};