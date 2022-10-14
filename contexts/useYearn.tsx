import React, {createContext, useContext} from 'react';
import useSWR from 'swr';
import axios from 'axios';
import {ethers} from 'ethers';
import {toAddress} from '@yearn-finance/web-lib/utils';
import type {TYearnVault, TYearnVaultWrapper} from 'types/types';

export type	TYearnContext = {
	ycrvPrice: number,
	ycrvCurvePoolPrice: number,
	vaults: TYearnVaultWrapper
}
const	defaultProps: TYearnContext = {
	ycrvPrice: 0,
	ycrvCurvePoolPrice: 0,
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
	const	{data: yveCRVdata} = useSWR('https://api.yearn.finance/v1/chains/1/vaults/all', fetcherLegacy);
	const	{data: ycrvPrice} = useSWR(`${process.env.YDAEMON_BASE_URI}/1/prices/${process.env.YCRV_TOKEN_ADDRESS}?humanized=true`, baseFetcher);
	const	{data: ycrvCurvePoolPrice} = useSWR(`${process.env.YDAEMON_BASE_URI}/1/prices/${process.env.YCRV_CURVE_POOL_ADDRESS}?humanized=true`, baseFetcher);
	const	{data} = useSWR(`${process.env.YDAEMON_BASE_URI}/1/vaults/all`, fetcher);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<YearnContext.Provider
			value={{
				ycrvPrice: ycrvPrice,
				ycrvCurvePoolPrice: ycrvCurvePoolPrice,
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