import { json } from '@sveltejs/kit';
import { TemplateService } from '$lib/server/template-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const includePreview = url.searchParams.get('preview') === 'true';

		if (includePreview) {
			const previews = await TemplateService.getTemplatePreviews();
			return json({ templates: previews });
		} else {
			const templates = await TemplateService.getAllTemplates();
			return json({ templates });
		}
	} catch (error) {
		console.error('Error fetching templates:', error);
		return json({ error: 'Failed to fetch templates' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const templateData = await request.json();

		// Validate template data
		const validation = TemplateService.validateTemplate(templateData);
		if (!validation.isValid) {
			return json({ 
				error: 'Validation failed', 
				details: validation.errors 
			}, { status: 400 });
		}

		const template = await TemplateService.createTemplate(templateData);
		return json({ template }, { status: 201 });
	} catch (error) {
		console.error('Error creating template:', error);
		return json({ error: 'Failed to create template' }, { status: 500 });
	}
};