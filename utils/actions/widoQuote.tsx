import {quote, QuoteRequest, QuoteResult} from 'wido';

export async function widoQuote(request: QuoteRequest): Promise<QuoteResult> {
	try {
		const quoteResult = await quote(request);
		
		return quoteResult;
	} catch (error) {
		throw new Error(`Failed to fetch quote details: ${error}.`);
	}
}
