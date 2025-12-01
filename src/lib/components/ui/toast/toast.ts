import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	type: ToastType;
	message: string;
	duration?: number;
}

const toasts = writable<Toast[]>([]);

export function toast(message: string, type: ToastType = 'info', duration = 3000) {
	const id = Math.random().toString(36).substring(7);
	const newToast: Toast = { id, type, message, duration };

	toasts.update((all) => [...all, newToast]);

	if (duration > 0) {
		setTimeout(() => {
			toasts.update((all) => all.filter((t) => t.id !== id));
		}, duration);
	}

	return id;
}

export { toasts };
