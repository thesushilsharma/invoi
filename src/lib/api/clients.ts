import type { Client, NewClient } from '$lib/server/db/schema';

export class ClientAPI {
	static async getAll(params?: { search?: string; limit?: number; offset?: number }) {
		const searchParams = new URLSearchParams();
		if (params?.search) searchParams.set('search', params.search);
		if (params?.limit) searchParams.set('limit', params.limit.toString());
		if (params?.offset) searchParams.set('offset', params.offset.toString());

		const response = await fetch(`/api/clients?${searchParams.toString()}`);
		if (!response.ok) {
			throw new Error('Failed to fetch clients');
		}
		return response.json() as Promise<{ clients: Client[]; total: number }>;
	}

	static async getById(id: string) {
		const response = await fetch(`/api/clients/${id}`);
		if (!response.ok) {
			throw new Error('Failed to fetch client');
		}
		return response.json() as Promise<Client>;
	}

	static async create(client: Omit<NewClient, 'id' | 'createdAt' | 'updatedAt'>) {
		const response = await fetch('/api/clients', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(client)
		});
		if (!response.ok) {
			throw new Error('Failed to create client');
		}
		return response.json() as Promise<Client>;
	}

	static async update(id: string, client: Partial<Omit<NewClient, 'id' | 'createdAt' | 'updatedAt'>>) {
		const response = await fetch(`/api/clients/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(client)
		});
		if (!response.ok) {
			throw new Error('Failed to update client');
		}
		return response.json() as Promise<Client>;
	}

	static async delete(id: string) {
		const response = await fetch(`/api/clients/${id}`, {
			method: 'DELETE'
		});
		if (!response.ok) {
			throw new Error('Failed to delete client');
		}
		return response.json();
	}
}