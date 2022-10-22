import {ethers} from 'ethers';
import {quote, QuoteRequest} from 'wido';

export async function widoZap(
	provider: ethers.providers.Web3Provider,
	request: QuoteRequest
): Promise<boolean> {
	const signer = provider.getSigner();

	try {
		const {data, to} = await quote(request);

		const tx = await signer.sendTransaction({data, to});

		await tx.wait();

		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}
