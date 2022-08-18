import	React, {ReactElement, useContext, createContext}			from	'react';
import	{BigNumber, ethers}											from	'ethers';
import	{Contract}													from	'ethcall';
import	NProgress													from	'nprogress';
import	{useWeb3}													from	'@yearn-finance/web-lib/contexts';
import	{toAddress, providers, format, ABI, performBatchedUpdates}	from	'@yearn-finance/web-lib/utils';
import	{useBalances, useClientEffect}								from	'@yearn-finance/web-lib/hooks';
import	YVECRV_ABI													from	'utils/abi/yveCRV.abi';
import	{allowanceKey}												from	'utils';
import type * as TWalletTypes										from	'contexts/useWallet.d';
import type {TClaimable}											from	'types/types';
import VAULT_ABI from 'utils/abi/vault.abi';

const	defaultProps = {
	balances: {},
	allowances: {[ethers.constants.AddressZero]: ethers.constants.Zero},
	yveCRVClaimable: {raw: ethers.constants.Zero, normalized: 0},
	useWalletNonce: 0,
	refresh: async (): Promise<void> => undefined
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
	const	[nonce] = React.useState<number>(0);
	const	{provider, address, isActive} = useWeb3();
	const	{data, update: updateBalances, isLoading} = useBalances({
		key: nonce,
		provider: provider || providers.getProvider(1),
		tokens: [
			{token: process.env.YVBOOST_TOKEN_ADDRESS},
			{token: process.env.YVECRV_TOKEN_ADDRESS},
			{token: process.env.YVECRV_POOL_LP_ADDRESS},
			{token: process.env.CRV_TOKEN_ADDRESS},
			{token: process.env.THREECRV_TOKEN_ADDRESS},
			{token: process.env.CVXCRV_TOKEN_ADDRESS}
		]
	});
	const	[yveCRVClaimable, set_yveCRVClaimable] = React.useState<TClaimable>({raw: ethers.constants.Zero, normalized: 0});
	const	[allowances, set_allowances] = React.useState<{[key: string]: BigNumber}>({[ethers.constants.AddressZero]: ethers.constants.Zero});

	useClientEffect((): () => void => {
		if (isLoading)
			NProgress.start();
		else 
			NProgress.done();
		return (): unknown => NProgress.done();
	}, [isLoading]);

	/* 🔵 - Yearn Finance ******************************************************
	**	Once the wallet is connected and a provider is available, we can fetch
	**	the informations for a specific wallet about the claimable amount
	***************************************************************************/
	const getExtraData = React.useCallback(async (): Promise<void> => {
		if (!isActive || !provider) {
			return;
		}
		const	currentProvider = provider || providers.getProvider(1);
		const	ethcallProvider = await providers.newEthCallProvider(currentProvider);
		const	userAddress = address;
		const	yveCRVContract = new Contract(process.env.YVECRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		const	crvContract = new Contract(process.env.CRV_TOKEN_ADDRESS as string, ABI.ERC20_ABI);
		const	cvxcrvContract = new Contract(process.env.CVXCRV_TOKEN_ADDRESS as string, ABI.ERC20_ABI);
		const	yvBoostContract = new Contract(process.env.YVBOOST_TOKEN_ADDRESS as string, ABI.ERC20_ABI);

		const	YVDAI = '0xdA816459F1AB5631232FE5e97a05BBBb94970c95';
		const	vault = new Contract(YVDAI, VAULT_ABI);

		const	[
			pricePerShare,
			claimable,
			yveCRVAllowanceZap, crvAllowanceZap, cvxcrvAllowanceZap, yvBoostAllowanceZap,
			yveCRVAllowanceLP, crvAllowanceLP
		] = await ethcallProvider.tryAll([
			vault.pricePerShare(),
			yveCRVContract.claimable(userAddress),
			yveCRVContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			crvContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			cvxcrvContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			yvBoostContract.allowance(userAddress, process.env.ZAP_YEARN_VE_CRV_ADDRESS),
			yveCRVContract.allowance(userAddress, process.env.YVECRV_POOL_LP_ADDRESS),
			crvContract.allowance(userAddress, process.env.YVECRV_POOL_LP_ADDRESS)
		]) as [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber];

		const	inputValue = BigNumber.from(10000000000000000000n);
		console.log({
			inputValue: inputValue.toString(),
			pps: pricePerShare.toString()
		});
		const	expectedShares = inputValue.mul(BigNumber.from(10).pow(18)).div(pricePerShare);
		console.log(expectedShares.toString());
  
		performBatchedUpdates((): void => {
			set_yveCRVClaimable({
				raw: claimable,
				normalized: format.toNormalizedValue(claimable, 18)
			});
			set_allowances({
				// ZAP_YEARN_VE_CRV_ADDRESS
				[allowanceKey(process.env.YVECRV_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]: yveCRVAllowanceZap,
				[allowanceKey(process.env.CRV_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]:  crvAllowanceZap,
				[allowanceKey(process.env.CVXCRV_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]: cvxcrvAllowanceZap,
				[allowanceKey(process.env.YVBOOST_TOKEN_ADDRESS, process.env.ZAP_YEARN_VE_CRV_ADDRESS)]: yvBoostAllowanceZap,
				// YVECRV_POOL_LP_ADDRESS
				[allowanceKey(process.env.YVECRV_TOKEN_ADDRESS, process.env.YVECRV_POOL_LP_ADDRESS)]: yveCRVAllowanceLP,
				[allowanceKey(process.env.CRV_TOKEN_ADDRESS, process.env.YVECRV_POOL_LP_ADDRESS)]:  crvAllowanceLP
			});
		});
	}, [provider, address, isActive]);
	React.useEffect((): void => {
		getExtraData();
	}, [getExtraData]);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<WalletContext.Provider
			value={{
				balances: {
					[toAddress(process.env.YVBOOST_TOKEN_ADDRESS)]: data[toAddress(process.env.YVBOOST_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.YVECRV_TOKEN_ADDRESS)]: data[toAddress(process.env.YVECRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.YVECRV_POOL_LP_ADDRESS)]: data[toAddress(process.env.YVECRV_POOL_LP_ADDRESS)] || defaultData,
					[toAddress(process.env.CRV_TOKEN_ADDRESS)]: data[toAddress(process.env.CRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.THREECRV_TOKEN_ADDRESS)]: data[toAddress(process.env.THREECRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.CVXCRV_TOKEN_ADDRESS)]: data[toAddress(process.env.CVXCRV_TOKEN_ADDRESS)] || defaultData
				},
				yveCRVClaimable,
				allowances,
				refresh: async (): Promise<void> => {
					await Promise.all([
						updateBalances(),
						getExtraData()
					]);
				},
				useWalletNonce: nonce
			}}>
			{children}
		</WalletContext.Provider>
	);
};


export const useWallet = (): TWalletTypes.TWalletContext => useContext(WalletContext);
export default useWallet;