import 	{BigNumber}			from	'ethers';
import type {TClaimable}	from	'types/types';

export type	TBalances = {
	[address: string]: {
		decimals: number,
		symbol: string,
		raw: BigNumber,
		rawPrice: BigNumber,
		normalized: number,
		normalizedPrice: number,
		normalizedValue: number
	}
}

export type	TWalletContext = {
	balances: TBalances,
	yveCRVClaimable: TClaimable;
	useWalletNonce: number
}