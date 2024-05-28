import {z} from 'zod';
import {useFetch} from '@builtbymom/web3/hooks/useFetch';
import {addressSchema} from '@builtbymom/web3/types';
import {toAddress, toNormalizedBN, zeroNormalizedBN} from '@builtbymom/web3/utils';
import {useYDaemonBaseURI} from '@yearn-finance/web-lib/hooks/useYDaemonBaseURI';

import type {TAddress, TNormalizedBN} from '@builtbymom/web3/types';

export const yDaemonPriceSchema = z.string();
export const yDaemonPricesSchema = z.record(addressSchema, yDaemonPriceSchema);

type TResponse = {[key: TAddress]: string};

export type TPriceResult = {[key: TAddress]: TNormalizedBN};

export const usePrices = ({
	tokens,
	chainId
}: {
	tokens: TAddress[];
	chainId: number;
}): {data: TPriceResult | undefined; isLoading: boolean; isSuccess: boolean} => {
	const {yDaemonBaseUri: yDaemonBaseUriWithoutChain} = useYDaemonBaseURI();

	const addressesString = tokens.map(token => token).join(',');
	const url = tokens.length ? `${yDaemonBaseUriWithoutChain}/${chainId}/prices/some/${addressesString}` : null;
	const {data: rawData, isLoading, isSuccess} = useFetch<TResponse>({endpoint: url, schema: yDaemonPricesSchema});

	const data = rawData
		? tokens.reduce((acc, current) => {
				return {
					...acc,
					[toAddress(current)]: toNormalizedBN(rawData[toAddress(current)] || 0, 6) || zeroNormalizedBN
				};
			}, {})
		: undefined;
	return {data, isLoading, isSuccess};
};
