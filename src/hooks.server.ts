import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Add any server-side hooks here
	// For example: authentication, logging, etc.

	const response = await resolve(event);
	return response;
};
