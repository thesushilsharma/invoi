import { db } from '$lib/server/db';
import { currencyRates } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export interface CurrencyInfo {
	code: string;
	name: string;
	symbol: string;
	decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
	USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
	EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
	GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
	CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
	AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
	JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
	CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
	CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
	INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 }
};

export class CurrencyService {
	private static readonly BASE_CURRENCY = 'USD';
	private static readonly EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest';

	// Get exchange rate between two currencies
	static async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
		if (fromCurrency === toCurrency) return 1;

		try {
			// Try to get from database first
			const cachedRate = await db
				.select()
				.from(currencyRates)
				.where(
					and(
						eq(currencyRates.fromCurrency, fromCurrency as any),
						eq(currencyRates.toCurrency, toCurrency as any)
					)
				)
				.limit(1);

			// Check if cached rate is recent (less than 1 hour old)
			if (cachedRate.length > 0) {
				const lastUpdated = new Date(cachedRate[0].lastUpdated);
				const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
				
				if (lastUpdated > oneHourAgo) {
					return cachedRate[0].rate;
				}
			}

			// Fetch fresh rate from API
			const rate = await this.fetchExchangeRateFromAPI(fromCurrency, toCurrency);
			
			// Cache the rate
			await this.cacheExchangeRate(fromCurrency, toCurrency, rate);
			
			return rate;
		} catch (error) {
			console.error('Error getting exchange rate:', error);
			// Return cached rate if available, otherwise return 1
			if (cachedRate && cachedRate.length > 0) {
				return cachedRate[0].rate;
			}
			return 1;
		}
	}

	// Convert amount from one currency to another
	static async convertCurrency(
		amount: number,
		fromCurrency: string,
		toCurrency: string
	): Promise<number> {
		const rate = await this.getExchangeRate(fromCurrency, toCurrency);
		return amount * rate;
	}

	// Format currency amount with proper symbol and decimals
	static formatCurrency(amount: number, currencyCode: string): string {
		const currency = SUPPORTED_CURRENCIES[currencyCode];
		if (!currency) return amount.toString();

		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currencyCode,
			minimumFractionDigits: currency.decimals,
			maximumFractionDigits: currency.decimals
		}).format(amount);
	}

	// Get currency symbol
	static getCurrencySymbol(currencyCode: string): string {
		return SUPPORTED_CURRENCIES[currencyCode]?.symbol || currencyCode;
	}

	// Get all supported currencies
	static getSupportedCurrencies(): CurrencyInfo[] {
		return Object.values(SUPPORTED_CURRENCIES);
	}

	// Detect client currency based on location (placeholder - would use IP geolocation)
	static async detectClientCurrency(clientIP?: string): Promise<string> {
		// Placeholder implementation - in real app, use IP geolocation service
		// For now, return USD as default
		return 'USD';
	}

	// Update all exchange rates
	static async updateAllExchangeRates(): Promise<void> {
		const currencies = Object.keys(SUPPORTED_CURRENCIES);
		
		for (const fromCurrency of currencies) {
			for (const toCurrency of currencies) {
				if (fromCurrency !== toCurrency) {
					try {
						const rate = await this.fetchExchangeRateFromAPI(fromCurrency, toCurrency);
						await this.cacheExchangeRate(fromCurrency, toCurrency, rate);
					} catch (error) {
						console.error(`Failed to update rate ${fromCurrency} -> ${toCurrency}:`, error);
					}
				}
			}
		}
	}

	// Private methods
	private static async fetchExchangeRateFromAPI(
		fromCurrency: string,
		toCurrency: string
	): Promise<number> {
		try {
			// Using a free exchange rate API (in production, use a reliable paid service)
			const response = await fetch(`${this.EXCHANGE_API_URL}/${fromCurrency}`);
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			
			const data = await response.json();
			
			if (!data.rates || !data.rates[toCurrency]) {
				throw new Error(`Exchange rate not found for ${fromCurrency} -> ${toCurrency}`);
			}
			
			return data.rates[toCurrency];
		} catch (error) {
			console.error('API fetch error:', error);
			// Fallback to approximate rates (in production, use a backup service)
			return this.getFallbackRate(fromCurrency, toCurrency);
		}
	}

	private static async cacheExchangeRate(
		fromCurrency: string,
		toCurrency: string,
		rate: number
	): Promise<void> {
		try {
			// Check if rate exists
			const existing = await db
				.select()
				.from(currencyRates)
				.where(
					and(
						eq(currencyRates.fromCurrency, fromCurrency as any),
						eq(currencyRates.toCurrency, toCurrency as any)
					)
				)
				.limit(1);

			if (existing.length > 0) {
				// Update existing rate
				await db
					.update(currencyRates)
					.set({
						rate,
						lastUpdated: new Date()
					})
					.where(
						and(
							eq(currencyRates.fromCurrency, fromCurrency as any),
							eq(currencyRates.toCurrency, toCurrency as any)
						)
					);
			} else {
				// Insert new rate
				await db.insert(currencyRates).values({
					fromCurrency: fromCurrency as any,
					toCurrency: toCurrency as any,
					rate,
					lastUpdated: new Date()
				});
			}
		} catch (error) {
			console.error('Error caching exchange rate:', error);
		}
	}

	private static getFallbackRate(fromCurrency: string, toCurrency: string): number {
		// Simplified fallback rates (in production, use more accurate fallback data)
		const fallbackRates: Record<string, Record<string, number>> = {
			USD: { EUR: 0.85, GBP: 0.73, CAD: 1.25, AUD: 1.35, JPY: 110, CHF: 0.92, CNY: 6.45, INR: 74 },
			EUR: { USD: 1.18, GBP: 0.86, CAD: 1.47, AUD: 1.59, JPY: 129, CHF: 1.08, CNY: 7.59, INR: 87 },
			GBP: { USD: 1.37, EUR: 1.16, CAD: 1.71, AUD: 1.85, JPY: 151, CHF: 1.26, CNY: 8.84, INR: 101 }
		};

		return fallbackRates[fromCurrency]?.[toCurrency] || 1;
	}

	// Calculate invoice totals in multiple currencies
	static async calculateMultiCurrencyTotals(
		subtotal: number,
		taxAmount: number,
		invoiceCurrency: string,
		displayCurrencies: string[] = ['USD', 'EUR']
	): Promise<Array<{ currency: string; subtotal: number; tax: number; total: number }>> {
		const results = [];
		const total = subtotal + taxAmount;

		// Add original currency
		results.push({
			currency: invoiceCurrency,
			subtotal,
			tax: taxAmount,
			total
		});

		// Add converted currencies
		for (const currency of displayCurrencies) {
			if (currency !== invoiceCurrency) {
				const convertedSubtotal = await this.convertCurrency(subtotal, invoiceCurrency, currency);
				const convertedTax = await this.convertCurrency(taxAmount, invoiceCurrency, currency);
				const convertedTotal = await this.convertCurrency(total, invoiceCurrency, currency);

				results.push({
					currency,
					subtotal: convertedSubtotal,
					tax: convertedTax,
					total: convertedTotal
				});
			}
		}

		return results;
	}
}