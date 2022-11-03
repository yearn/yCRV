import {BigNumber} from 'ethers';

import type {TBalanceData} from '@yearn-finance/web-lib/hooks/types.d';
import type {Dict, TClaimable} from 'types/types';

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
	isLoading: boolean,
	allowances: Dict<BigNumber>,
	yveCRVClaimable: TClaimable;
	useWalletNonce: number,
	refresh: () => Promise<Dict<TBalanceData>>,
	slippage: number,
	set_slippage: (slippage: number) => void,
}