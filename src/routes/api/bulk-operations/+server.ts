import { json } from '@sveltejs/kit';
import { BulkOperationsService } from '$lib/server/bulk-operations';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { operation, data, options = {} } = await request.json();

		let result;

		switch (operation) {
			case 'create_invoices':
				result = await BulkOperationsService.createBulkInvoices(data, options);
				break;

			case 'send_invoices':
				result = await BulkOperationsService.sendBulkInvoices(data);
				break;

			case 'generate_pdfs':
				result = await BulkOperationsService.generateBulkPDFs(data);
				break;

			case 'import_csv':
				result = await BulkOperationsService.importInvoicesFromCSV(data);
				break;

			default:
				return json({ error: 'Invalid operation type' }, { status: 400 });
		}

		return json(result);
	} catch (error) {
		console.error('Error processing bulk operation:', error);
		return json({ 
			error: 'Failed to process bulk operation',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url }) => {
	try {
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const operations = await BulkOperationsService.getAllBulkOperations(limit);
		
		return json({ operations });
	} catch (error) {
		console.error('Error fetching bulk operations:', error);
		return json({ error: 'Failed to fetch bulk operations' }, { status: 500 });
	}
};