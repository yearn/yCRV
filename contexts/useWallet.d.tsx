import {BigNumber} from 'ethers';

import type {TClaimable} from 'types/types';

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
	allowances: {[key: string]: BigNumber},
	yveCRVClaimable: TClaimable;
	useWalletNonce: number,
	refresh: () => Promise<void>,
	slippage: number,
	set_slippage: (slippage: number) => void,
}