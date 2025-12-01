import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const allSettings = await db.select().from(settings).limit(1);
		
		if (allSettings.length === 0) {
			// Return default settings if none exist
			return json({
				companyName: '',
				companyEmail: '',
				companyAddress: '',
				companyCity: 'Dubai',
				companyCountry: 'United Arab Emirates',
				companyTaxId: '',
				defaultCurrency: 'AED',
				defaultTaxRate: 5,
				invoicePrefix: 'INV',
				paymentTermsDays: 30,
				emailNotifications: true,
				reminderDaysBeforeDue: 3
			});
		}

		return json(allSettings[0]);
	} catch (error) {
		console.error('Failed to fetch settings:', error);
		return json({ error: 'Failed to fetch settings' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();

		// Check if settings exist
		const existing = await db.select().from(settings).limit(1);

		let result;
		if (existing.length === 0) {
			// Create new settings
			[result] = await db.insert(settings).values(data).returning();
		} else {
			// Update existing settings - remove timestamp and id fields from data
			const { id, createdAt, updatedAt, ...updateData } = data;
			[result] = await db
				.update(settings)
				.set({
					...updateData,
					updatedAt: new Date().toISOString()
				})
				.where(eq(settings.id, existing[0].id))
				.returning();
		}

		return json(result);
	} catch (error) {
		console.error('Failed to save settings:', error);
		return json({ error: 'Failed to save settings' }, { status: 500 });
	}
};
