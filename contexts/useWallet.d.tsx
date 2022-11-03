import {BigNumber} from 'ethers';

import type {TBalanceData} from '@yearn-finance/web-lib/hooks/types.d';
import type {Dict, TClaimable} from 'types/types';

export type	TWalletContext = {
	balances: Dict<TBalanceData>,
	allowances: Dict<BigNumber>,
	yveCRVClaimable: TClaimable;
	useWalletNonce: number,
	isLoading: boolean,
	slippage: number,
	refresh: () => Promise<Dict<TBalanceData>>,
	set_slippage: (slippage: number) => void,
}