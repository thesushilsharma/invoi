import { json } from '@sveltejs/kit';
import { CurrencyService } from '$lib/server/currency-service';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const from = url.searchParams.get('from');
		const to = url.searchParams.get('to');

		if (from && to) {
			// Get specific exchange rate
			const rate = await CurrencyService.getExchangeRate(from, to);
			return json({ 
				from, 
				to, 
				rate,
				formatted: CurrencyService.formatCurrency(1, from) + ' = ' + CurrencyService.formatCurrency(rate, to)
			});
		} else {
			// Get all supported currencies
			const currencies = CurrencyService.getSupportedCurrencies();
			return json({ currencies });
		}
	} catch (error) {
		console.error('Error fetching currency data:', error);
		return json({ error: 'Failed to fetch currency data' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { amount, from, to } = await request.json();

		if (!amount || !from || !to) {
			return json({ error: 'Missing required parameters: amount, from, to' }, { status: 400 });
		}

		const convertedAmount = await CurrencyService.convertCurrency(amount, from, to);
		const rate = await CurrencyService.getExchangeRate(from, to);

		return json({
			originalAmount: amount,
			convertedAmount,
			fromCurrency: from,
			toCurrency: to,
			exchangeRate: rate,
			formatted: {
				original: CurrencyService.formatCurrency(amount, from),
				converted: CurrencyService.formatCurrency(convertedAmount, to)
			}
		});
	} catch (error) {
		console.error('Error converting currency:', error);
		return json({ error: 'Failed to convert currency' }, { status: 500 });
	}
};