import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { staff } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;
        if (!id) {
            return json({ error: 'Staff ID is required' }, { status: 400 });
        }

        const [staffMember] = await db.select().from(staff).where(eq(staff.id, id));

        if (!staffMember) {
            return json({ error: 'Staff member not found' }, { status: 404 });
        }

        return json(staffMember);
    } catch (error) {
        console.error('Failed to fetch staff member:', error);
        return json({ error: 'Failed to fetch staff member' }, { status: 500 });
    }
};

export const PUT: RequestHandler = async ({ params, request }) => {
    try {
        const { id } = params;
        if (!id) {
            return json({ error: 'Staff ID is required' }, { status: 400 });
        }

        const data = await request.json();

        const [updatedStaff] = await db
            .update(staff)
            .set({
                ...data,
                updatedAt: new Date().toISOString()
            })
            .where(eq(staff.id, id))
            .returning();

        if (!updatedStaff) {
            return json({ error: 'Staff member not found' }, { status: 404 });
        }

        return json(updatedStaff);
    } catch (error) {
        console.error('Failed to update staff member:', error);
        return json({ error: 'Failed to update staff member' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;
        if (!id) {
            return json({ error: 'Staff ID is required' }, { status: 400 });
        }

        const [deletedStaff] = await db
            .delete(staff)
            .where(eq(staff.id, id))
            .returning();

        if (!deletedStaff) {
            return json({ error: 'Staff member not found' }, { status: 404 });
        }

        return json(deletedStaff);
    } catch (error) {
        console.error('Failed to delete staff member:', error);
        return json({ error: 'Failed to delete staff member' }, { status: 500 });
    }
};
