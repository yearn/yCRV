import React, {createContext, useContext} from 'react';
import {ethers} from 'ethers';
import axios from 'axios';
import useSWR from 'swr';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {toAddress} from '@yearn-finance/web-lib/utils';

import type {Dict} from 'types/types.d';
import type {TYDaemonHarvests, TYearnVault} from 'types/yearn.d';

export type	TYearnContext = {
	prices: Dict<string>,
	yCRVHarvests: TYDaemonHarvests[],
	vaults: Dict<TYearnVault | undefined>,
	earned: any
}
const	defaultProps: TYearnContext = {
	prices: {},
	yCRVHarvests: [],
	vaults: {[ethers.constants.AddressZero]: undefined},
	earned: {}
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
	const	{address} = useWeb3();
	/* 🔵 - Yearn Finance ******************************************************
	**	We will play with the some Yearn vaults. To correctly play with them,
	**	we need to fetch the data from the API, especially to get the
	**	apy.net_apy
	***************************************************************************/
	const	{data: yveCRVdata} = useSWR('https://api.yearn.finance/v1/chains/1/vaults/all', fetcherLegacy);
	const	{data: prices} = useSWR(`${process.env.YDAEMON_BASE_URI}/1/prices/some/${process.env.YCRV_TOKEN_ADDRESS},${process.env.YCRV_CURVE_POOL_ADDRESS},${process.env.CRV_TOKEN_ADDRESS}`, baseFetcher);
	const	{data} = useSWR(`${process.env.YDAEMON_BASE_URI}/1/vaults/all`, fetcher);
	const	{data: yCRVHarvests} = useSWR(`${process.env.YDAEMON_BASE_URI}/1/vaults/harvests/${process.env.STYCRV_TOKEN_ADDRESS},${process.env.LPYCRV_TOKEN_ADDRESS}`, baseFetcher);
	const	{data: earned} = useSWR(address ? `${process.env.YDAEMON_BASE_URI}/1/earned/${address}/${process.env.STYCRV_TOKEN_ADDRESS},${process.env.LPYCRV_TOKEN_ADDRESS}` : null, baseFetcher);


	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<YearnContext.Provider
			value={{
				prices,
				yCRVHarvests,
				earned,
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