import { z } from 'zod';

export const clientSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
	email: z.string().email('Invalid email address').max(255, 'Email is too long'),
	phone: z.string().max(50, 'Phone number is too long').optional().nullable(),
	address: z.string().max(500, 'Address is too long').optional().nullable(),
	city: z.string().max(100, 'City name is too long').optional().nullable(),
	state: z.string().max(100, 'State name is too long').optional().nullable(),
	zipCode: z.string().max(20, 'ZIP code is too long').optional().nullable(),
	country: z.string().max(100, 'Country name is too long').optional().nullable(),
	taxId: z.string().max(50, 'Tax ID is too long').optional().nullable(),
	notes: z.string().max(1000, 'Notes are too long').optional().nullable(),
	isActive: z.boolean().default(true)
});

export const updateClientSchema = clientSchema.partial();

export type ClientFormData = z.infer<typeof clientSchema>;
export type UpdateClientFormData = z.infer<typeof updateClientSchema>;