import React, {createContext, useContext} from 'react';
import useSWR from 'swr';
import axios from 'axios';
import {ethers} from 'ethers';
import {toAddress} from '@yearn-finance/web-lib/utils';
import type {TYearnVault} from 'types/types';

export type	TYearnContext = {
	yveCRVData: TYearnVault | undefined,
	yvBoostData: TYearnVault | undefined,
	vaults: {[key: string]: TYearnVault | undefined},
}
const	defaultProps: TYearnContext = {
	yveCRVData: undefined,
	yvBoostData: undefined,
	vaults: {[ethers.constants.AddressZero]: undefined}
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data.filter((item: TYearnVault): boolean => (
	toAddress(item.address) === toAddress(process.env.YVECRV_TOKEN_ADDRESS)
	|| toAddress(item.address) === toAddress(process.env.YVBOOST_TOKEN_ADDRESS)
)));

const	YearnContext = createContext<TYearnContext>(defaultProps);
export const YearnContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	/* 🔵 - Yearn Finance ******************************************************
	**	We will play with the some Yearn vaults. To correctly play with them,
	**	we need to fetch the data from the API, especially to get the
	**	apy.net_apy
	***************************************************************************/
	const	{data} = useSWR('https://api.yearn.finance/v1/chains/1/vaults/all', fetcher);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<YearnContext.Provider value={{
			yveCRVData: (data || []).find((item: TYearnVault): boolean => toAddress(item.address) === toAddress(process.env.YVECRV_TOKEN_ADDRESS)),
			yvBoostData: (data || []).find((item: TYearnVault): boolean => toAddress(item.address) === toAddress(process.env.YVBOOST_TOKEN_ADDRESS)),
			vaults: {
				[toAddress(process.env.YVBOOST_TOKEN_ADDRESS)]: (data || []).find((item: TYearnVault): boolean => toAddress(item.address) === toAddress(process.env.YVBOOST_TOKEN_ADDRESS)),
				[toAddress(process.env.YVECRV_TOKEN_ADDRESS)]: (data || []).find((item: TYearnVault): boolean => toAddress(item.address) === toAddress(process.env.YVECRV_TOKEN_ADDRESS))
			}
		}}>
			{children}
		</YearnContext.Provider>
	);
};


export const useYearn = (): TYearnContext => useContext(YearnContext);
export default useYearn;