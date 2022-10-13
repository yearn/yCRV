import {QuoteRequest, QuoteResult, quote} from 'wido';

export async function widoQuote(request: QuoteRequest): Promise<QuoteResult> {
	console.log('widoQuote() request', request);
	
	try {
		const quoteResult = await quote(request);

		console.log('quoteResult', quoteResult);
		
		return quoteResult;
	} catch (error) {
		throw new Error(`Failed to fetch quote details: ${error}.`);
	}
}
