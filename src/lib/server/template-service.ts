import { db } from '$lib/server/db';
import { invoiceTemplates } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { InvoiceTemplate, NewInvoiceTemplate } from '$lib/server/db/schema';

export interface TemplatePreview {
	id: string;
	name: string;
	type: string;
	previewUrl: string;
	thumbnail: string;
}

export class TemplateService {
	// Get all available templates
	static async getAllTemplates(): Promise<InvoiceTemplate[]> {
		return await db
			.select()
			.from(invoiceTemplates)
			.where(eq(invoiceTemplates.isActive, true))
			.orderBy(desc(invoiceTemplates.isDefault), desc(invoiceTemplates.createdAt));
	}

	// Get template by ID
	static async getTemplateById(id: string): Promise<InvoiceTemplate | null> {
		const templates = await db
			.select()
			.from(invoiceTemplates)
			.where(eq(invoiceTemplates.id, id))
			.limit(1);

		return templates.length > 0 ? templates[0] : null;
	}

	// Get default template
	static async getDefaultTemplate(): Promise<InvoiceTemplate> {
		const defaultTemplates = await db
			.select()
			.from(invoiceTemplates)
			.where(eq(invoiceTemplates.isDefault, true))
			.limit(1);

		if (defaultTemplates.length > 0) {
			return defaultTemplates[0];
		}

		// Create default template if none exists
		return await this.createDefaultTemplate();
	}

	// Create a new template
	static async createTemplate(templateData: Omit<NewInvoiceTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvoiceTemplate> {
		// If this is set as default, unset other defaults
		if (templateData.isDefault) {
			await db
				.update(invoiceTemplates)
				.set({ isDefault: false })
				.where(eq(invoiceTemplates.isDefault, true));
		}

		const newTemplate = await db
			.insert(invoiceTemplates)
			.values({
				...templateData,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		return newTemplate[0];
	}

	// Update template
	static async updateTemplate(id: string, updates: Partial<NewInvoiceTemplate>): Promise<InvoiceTemplate | null> {
		// If this is set as default, unset other defaults
		if (updates.isDefault) {
			await db
				.update(invoiceTemplates)
				.set({ isDefault: false })
				.where(eq(invoiceTemplates.isDefault, true));
		}

		const updatedTemplate = await db
			.update(invoiceTemplates)
			.set({
				...updates,
				updatedAt: new Date()
			})
			.where(eq(invoiceTemplates.id, id))
			.returning();

		return updatedTemplate.length > 0 ? updatedTemplate[0] : null;
	}

	// Delete template
	static async deleteTemplate(id: string): Promise<boolean> {
		const template = await this.getTemplateById(id);
		if (!template) return false;

		// Don't allow deleting the default template
		if (template.isDefault) {
			throw new Error('Cannot delete the default template');
		}

		await db
			.update(invoiceTemplates)
			.set({ isActive: false })
			.where(eq(invoiceTemplates.id, id));

		return true;
	}

	// Get template previews
	static async getTemplatePreviews(): Promise<TemplatePreview[]> {
		const templates = await this.getAllTemplates();
		
		return templates.map(template => ({
			id: template.id,
			name: template.name,
			type: template.type,
			previewUrl: `/api/templates/${template.id}/preview`,
			thumbnail: `/api/templates/${template.id}/thumbnail`
		}));
	}

	// Clone template
	static async cloneTemplate(id: string, newName: string): Promise<InvoiceTemplate> {
		const originalTemplate = await this.getTemplateById(id);
		if (!originalTemplate) {
			throw new Error('Template not found');
		}

		const clonedTemplate = await this.createTemplate({
			name: newName,
			type: originalTemplate.type,
			description: `Cloned from ${originalTemplate.name}`,
			logoUrl: originalTemplate.logoUrl,
			primaryColor: originalTemplate.primaryColor,
			secondaryColor: originalTemplate.secondaryColor,
			fontFamily: originalTemplate.fontFamily,
			headerTemplate: originalTemplate.headerTemplate,
			footerTemplate: originalTemplate.footerTemplate,
			customCss: originalTemplate.customCss,
			isDefault: false,
			isActive: true
		});

		return clonedTemplate;
	}

	// Get predefined template types
	static getTemplateTypes(): Array<{ value: string; label: string; description: string }> {
		return [
			{
				value: 'standard',
				label: 'Standard',
				description: 'Clean and professional layout suitable for most businesses'
			},
			{
				value: 'modern',
				label: 'Modern',
				description: 'Contemporary design with bold colors and modern typography'
			},
			{
				value: 'classic',
				label: 'Classic',
				description: 'Traditional business invoice with conservative styling'
			},
			{
				value: 'minimal',
				label: 'Minimal',
				description: 'Simple and clean design with minimal visual elements'
			},
			{
				value: 'custom',
				label: 'Custom',
				description: 'Fully customizable template with advanced options'
			}
		];
	}

	// Generate CSS for template
	static generateTemplateCSS(template: InvoiceTemplate): string {
		const css = `
			:root {
				--primary-color: ${template.primaryColor || '#3b82f6'};
				--secondary-color: ${template.secondaryColor || '#64748b'};
				--font-family: ${template.fontFamily || 'Inter, sans-serif'};
			}

			.invoice-header {
				background-color: var(--primary-color);
				color: white;
				padding: 20px;
			}

			.invoice-body {
				font-family: var(--font-family);
				color: var(--secondary-color);
			}

			.invoice-table th {
				background-color: var(--primary-color);
				color: white;
			}

			.invoice-total {
				background-color: var(--primary-color);
				color: white;
			}

			${template.customCss || ''}
		`;

		return css;
	}

	// Create default template
	private static async createDefaultTemplate(): Promise<InvoiceTemplate> {
		const defaultTemplate = await this.createTemplate({
			name: 'Default Template',
			type: 'standard',
			description: 'Default invoice template',
			primaryColor: '#3b82f6',
			secondaryColor: '#64748b',
			fontFamily: 'Inter',
			headerTemplate: 'Professional Invoice',
			footerTemplate: 'Thank you for your business!',
			isDefault: true,
			isActive: true
		});

		return defaultTemplate;
	}

	// Validate template data
	static validateTemplate(templateData: Partial<NewInvoiceTemplate>): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!templateData.name || templateData.name.trim().length === 0) {
			errors.push('Template name is required');
		}

		if (templateData.name && templateData.name.length > 100) {
			errors.push('Template name must be less than 100 characters');
		}

		if (templateData.primaryColor && !this.isValidHexColor(templateData.primaryColor)) {
			errors.push('Primary color must be a valid hex color');
		}

		if (templateData.secondaryColor && !this.isValidHexColor(templateData.secondaryColor)) {
			errors.push('Secondary color must be a valid hex color');
		}

		if (templateData.customCss && templateData.customCss.length > 10000) {
			errors.push('Custom CSS must be less than 10,000 characters');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	private static isValidHexColor(color: string): boolean {
		return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
	}

	// Get template usage statistics
	static async getTemplateUsage(templateId: string): Promise<{ totalInvoices: number; lastUsed: Date | null }> {
		// This would query the invoices table to get usage stats
		// For now, return placeholder data
		return {
			totalInvoices: 0,
			lastUsed: null
		};
	}
}