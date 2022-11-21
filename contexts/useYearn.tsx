import React, {createContext, useContext} from 'react';
import {ethers} from 'ethers';
import axios from 'axios';
import useSWR from 'swr';
import {useSettings} from '@yearn-finance/web-lib/contexts';
import {format, TDict, toAddress} from '@yearn-finance/web-lib/utils';

import type {TYDaemonHarvests, TYearnVault, TYearnVaultWrapper} from 'types/types';

export type	TYearnContext = {
	crvPrice: number,
	ycrvPrice: number,
	ycrvCurvePoolPrice: number,
	prices: TDict<string>,
	yCRVHarvests: TYDaemonHarvests[],
	vaults: TYearnVaultWrapper
}
const	defaultProps: TYearnContext = {
	crvPrice: 0,
	ycrvPrice: 0,
	ycrvCurvePoolPrice: 0,
	prices: {},
	yCRVHarvests: [],
	vaults: {[ethers.constants.AddressZero]: undefined}
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseFetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data.filter((item: TYearnVault): boolean => (
	toAddress(item.address) === toAddress(process.env.YVBOOST_TOKEN_ADDRESS)
	|| toAddress(item.address) === toAddress(process.env.STYCRV_TOKEN_ADDRESS)
	|| toAddress(item.address) === toAddress(process.env.LPYCRV_TOKEN_ADDRESS)
)));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetcherLegacy = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data.filter((item: TYearnVault): boolean => (
	toAddress(item.address) === toAddress(process.env.YVECRV_TOKEN_ADDRESS)
)));

const	YearnContext = createContext<TYearnContext>(defaultProps);
export const YearnContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	/* 🔵 - Yearn Finance ******************************************************
	**	We will play with the some Yearn vaults. To correctly play with them,
	**	we need to fetch the data from the API, especially to get the
	**	apy.net_apy
	***************************************************************************/

	const {settings} = useSettings();
	const	{data: yveCRVdata} = useSWR(`${settings.apiBaseURI}/v1/chains/1/vaults/all`, fetcherLegacy);
	const	{data: prices} = useSWR(`${settings.yDaemonBaseURI}/1/prices/some/${process.env.YCRV_TOKEN_ADDRESS},${process.env.YCRV_CURVE_POOL_ADDRESS},${process.env.CRV_TOKEN_ADDRESS}?humanized=true`, baseFetcher);
	const	{data} = useSWR(`${settings.yDaemonBaseURI}/1/vaults/all`, fetcher);
	const	{data: yCRVHarvests} = useSWR(`${settings.yDaemonBaseURI}/1/vaults/harvests/${process.env.STYCRV_TOKEN_ADDRESS},${process.env.LPYCRV_TOKEN_ADDRESS}`, baseFetcher);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<YearnContext.Provider
			value={{
				yCRVHarvests,
				prices,
				crvPrice: format.toNormalizedValue((prices?.[toAddress(process.env.CRV_TOKEN_ADDRESS as string)] || 0), 6),
				ycrvPrice: format.toNormalizedValue((prices?.[toAddress(process.env.YCRV_TOKEN_ADDRESS as string)] || 0), 6),
				ycrvCurvePoolPrice: format.toNormalizedValue((prices?.[toAddress(process.env.YCRV_CURVE_POOL_ADDRESS as string)] || 0), 6),
				vaults: {
					[toAddress(process.env.YVECRV_TOKEN_ADDRESS)]: (yveCRVdata || []).find((item: TYearnVault): boolean => toAddress(item.address) === toAddress(process.env.YVECRV_TOKEN_ADDRESS)),
					[toAddress(process.env.YVBOOST_TOKEN_ADDRESS)]: (data || []).find((item: TYearnVault): boolean => toAddress(item.address) === toAddress(process.env.YVBOOST_TOKEN_ADDRESS)),
					[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]: (data || []).find((item: TYearnVault): boolean => toAddress(item.address) === toAddress(process.env.STYCRV_TOKEN_ADDRESS)),
					[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]: (data || []).find((item: TYearnVault): boolean => toAddress(item.address) === toAddress(process.env.LPYCRV_TOKEN_ADDRESS))
				}
			}}>
			{children}
		</YearnContext.Provider>
	);
};


export const useYearn = (): TYearnContext => useContext(YearnContext);
export default useYearn;