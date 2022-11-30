import React, {createContext, ReactElement, useCallback, useContext, useEffect, useState} from 'react';
import {Contract} from 'ethcall';
import {BigNumber, ethers} from 'ethers';
// eslint-disable-next-line import/no-named-as-default
import NProgress from 'nprogress';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {useBalances, useClientEffect} from '@yearn-finance/web-lib/hooks';
import {ABI, format, performBatchedUpdates, providers, toAddress} from '@yearn-finance/web-lib/utils';
import {useYearn} from 'contexts/useYearn';
import {allowanceKey} from 'utils';
import YVECRV_ABI from 'utils/abi/yveCRV.abi';

import type * as TWalletTypes from 'contexts/useWallet.d';
import type {TClaimable} from 'types/types';

const	defaultProps = {
	balances: {},
	allowances: {[ethers.constants.AddressZero]: ethers.constants.Zero},
	yveCRVClaimable: {raw: ethers.constants.Zero, normalized: 0},
	useWalletNonce: 0,
	refresh: async (): Promise<void> => undefined,
	slippage: 0.6,
	set_slippage: (): void => undefined
};

const	defaultData = {
	decimals: 0,
	normalized: 0,
	symbol: '',
	raw: ethers.constants.Zero,
	rawPrice: ethers.constants.Zero,
	normalizedPrice: 0,
	normalizedValue: 0
};

/* 🔵 - Yearn Finance **********************************************************
** This context controls most of the user's wallet data we may need to
** interact with our app, aka mostly the balances and the token prices.
******************************************************************************/
const	WalletContext = createContext<TWalletTypes.TWalletContext>(defaultProps);
export const WalletContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const	[nonce] = useState<number>(0);
	const	{prices} = useYearn();
	const	{provider, address, isActive} = useWeb3();
	const	{data, update: updateBalances, isLoading} = useBalances({
		key: nonce,
		provider: provider || providers.getProvider(1),
		prices,
		tokens: [
			{token: process.env.YVBOOST_TOKEN_ADDRESS as string},
			{token: process.env.YCRV_TOKEN_ADDRESS as string},
			{token: process.env.YCRV_CURVE_POOL_ADDRESS as string},
			{token: process.env.STYCRV_TOKEN_ADDRESS as string},
			{token: process.env.LPYCRV_TOKEN_ADDRESS as string},
			{token: process.env.YVECRV_TOKEN_ADDRESS as string},
			{token: process.env.YVECRV_POOL_LP_ADDRESS as string},
			{token: process.env.CRV_TOKEN_ADDRESS as string},
			{token: process.env.THREECRV_TOKEN_ADDRESS as string}
		],
		effectDependencies: []
	});
	const	[yveCRVClaimable, set_yveCRVClaimable] = useState<TClaimable>({raw: ethers.constants.Zero, normalized: 0});
	const	[allowances, set_allowances] = useState<{[key: string]: BigNumber}>({[ethers.constants.AddressZero]: ethers.constants.Zero});
	const	[slippage, set_slippage] = useState<number>(1);

	useClientEffect((): () => void => {
		if (isLoading) {
			NProgress.start();
		} else {
			NProgress.done();
		}
		return (): unknown => NProgress.done();
	}, [isLoading]);

	/* 🔵 - Yearn Finance ******************************************************
	**	Once the wallet is connected and a provider is available, we can fetch
	**	the informations for a specific wallet about the claimable amount
	***************************************************************************/
	const getExtraData = useCallback(async (): Promise<void> => {
		if (!isActive || !provider) {
			return;
		}
		const	currentProvider = provider || providers.getProvider(1);
		const	ethcallProvider = await providers.newEthCallProvider(currentProvider);
		const	userAddress = address;
		const	yCRVContract = new Contract(process.env.YCRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		const	styCRVContract = new Contract(process.env.STYCRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		const	lpyCRVContract = new Contract(process.env.LPYCRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		const	yveCRVContract = new Contract(process.env.YVECRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		const	crvContract = new Contract(process.env.CRV_TOKEN_ADDRESS as string, ABI.ERC20_ABI);
		const	yvBoostContract = new Contract(process.env.YVBOOST_TOKEN_ADDRESS as string, ABI.ERC20_ABI);
		const	yCRVPoolContract = new Contract(process.env.YCRV_CURVE_POOL_ADDRESS as string, YVECRV_ABI);

		const	[
			claimable,
			yCRVAllowanceZap, styCRVAllowanceZap, lpyCRVAllowanceZap,
			yveCRVAllowanceZap, crvAllowanceZap, yvBoostAllowanceZap,
			yveCRVAllowanceLP, crvAllowanceLP,
			yCRVPoolAllowanceVault
		] = await ethcallProvider.tryAll([
			yveCRVContract.claimable(userAddress),
			yCRVContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			styCRVContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			lpyCRVContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			yveCRVContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			crvContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			yvBoostContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			yveCRVContract.allowance(userAddress, process.env.YVECRV_POOL_LP_ADDRESS),
			crvContract.allowance(userAddress, process.env.YVECRV_POOL_LP_ADDRESS),
			yCRVPoolContract.allowance(userAddress, process.env.LPYCRV_TOKEN_ADDRESS)
		]) as [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber];

		performBatchedUpdates((): void => {
			set_yveCRVClaimable({
				raw: claimable,
				normalized: format.toNormalizedValue(claimable, 18)
			});
			set_allowances({
				// YCRV ECOSYSTEM
				[allowanceKey(process.env.YCRV_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]: yCRVAllowanceZap,
				[allowanceKey(process.env.STYCRV_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]: styCRVAllowanceZap,
				[allowanceKey(process.env.LPYCRV_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]: lpyCRVAllowanceZap,
				[allowanceKey(process.env.YCRV_CURVE_POOL_ADDRESS, process.env.LPYCRV_TOKEN_ADDRESS)]: yCRVPoolAllowanceVault,
				// CRV ECOSYSTEM
				[allowanceKey(process.env.YVECRV_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]: yveCRVAllowanceZap,
				[allowanceKey(process.env.CRV_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]:  crvAllowanceZap,
				[allowanceKey(process.env.YVBOOST_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]: yvBoostAllowanceZap,
				[allowanceKey(process.env.YVECRV_TOKEN_ADDRESS, process.env.YVECRV_POOL_LP_ADDRESS)]: yveCRVAllowanceLP,
				[allowanceKey(process.env.CRV_TOKEN_ADDRESS, process.env.YVECRV_POOL_LP_ADDRESS)]:  crvAllowanceLP
			});
		});
	}, [provider, address, isActive]);
	useEffect((): void => {
		getExtraData();
	}, [getExtraData]);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<WalletContext.Provider
			value={{
				balances: {
					// YCRV ECOSYSTEM
					[toAddress(process.env.YCRV_TOKEN_ADDRESS)]: data[toAddress(process.env.YCRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]: data[toAddress(process.env.STYCRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]: data[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)]: data[toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)] || defaultData,
					// CRV ECOSYSTEM
					[toAddress(process.env.YVBOOST_TOKEN_ADDRESS)]: data[toAddress(process.env.YVBOOST_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.YVECRV_TOKEN_ADDRESS)]: data[toAddress(process.env.YVECRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.YVECRV_POOL_LP_ADDRESS)]: data[toAddress(process.env.YVECRV_POOL_LP_ADDRESS)] || defaultData,
					[toAddress(process.env.CRV_TOKEN_ADDRESS)]: data[toAddress(process.env.CRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.THREECRV_TOKEN_ADDRESS)]: data[toAddress(process.env.THREECRV_TOKEN_ADDRESS)] || defaultData
				},
				yveCRVClaimable,
				allowances,
				refresh: async (): Promise<void> => {
					await Promise.all([
						updateBalances(),
						getExtraData()
					]);
				},
				useWalletNonce: nonce,
				slippage,
				set_slippage
			}}>
			{children}
		</WalletContext.Provider>
	);
};


export const useWallet = (): TWalletTypes.TWalletContext => useContext(WalletContext);
export default useWallet;