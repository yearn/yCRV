import {useMemo} from 'react';
import {useYearn} from '@yearn-finance/web-lib/contexts/useYearn';
import {formatToNormalizedValue, toBigInt} from '@yearn-finance/web-lib/utils/format.bigNumber';

import type {TAddress} from '@yearn-finance/web-lib/types';

export function useTokenPrice({address, chainID}: {address: TAddress; chainID: number}): number {
	const {prices} = useYearn();

	const tokenPrice = useMemo(
		(): number => formatToNormalizedValue(toBigInt(prices?.[chainID]?.[address] || 0), 6),
		[address, prices, chainID]
	);

	return tokenPrice;
}
