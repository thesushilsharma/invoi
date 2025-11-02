import { json } from '@sveltejs/kit';
import { TemplateService } from '$lib/server/template-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const template = await TemplateService.getTemplateById(params.id);
		
		if (!template) {
			return json({ error: 'Template not found' }, { status: 404 });
		}

		return json({ template });
	} catch (error) {
		console.error('Error fetching template:', error);
		return json({ error: 'Failed to fetch template' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const updates = await request.json();

		// Validate updates
		const validation = TemplateService.validateTemplate(updates);
		if (!validation.isValid) {
			return json({ 
				error: 'Validation failed', 
				details: validation.errors 
			}, { status: 400 });
		}

		const template = await TemplateService.updateTemplate(params.id, updates);
		
		if (!template) {
			return json({ error: 'Template not found' }, { status: 404 });
		}

		return json({ template });
	} catch (error) {
		console.error('Error updating template:', error);
		return json({ error: 'Failed to update template' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const success = await TemplateService.deleteTemplate(params.id);
		
		if (!success) {
			return json({ error: 'Template not found or cannot be deleted' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting template:', error);
		return json({ error: 'Failed to delete template' }, { status: 500 });
	}
};