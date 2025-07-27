import type { Invoice, InvoiceItem } from "$lib/server/db/schema"
import { writable } from "svelte/store"


export interface InvoiceStore extends Invoice {
  items: InvoiceItem[]
}

export const currentInvoice = writable<InvoiceStore | null>(null)
export const invoiceList = writable<Invoice[]>([])
export const isLoading = writable(false)
export const error = writable<string | null>(null)

export function resetInvoice() {
  currentInvoice.set(null)
  error.set(null)
}

export function setError(message: string) {
  error.set(message)
}

export function clearError() {
  error.set(null)
}
