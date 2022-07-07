import	React, {ReactElement, useContext, createContext}		from	'react';
import	{BigNumber, ethers}										from	'ethers';
import	{Contract}												from	'ethcall';
import	{useWeb3}												from	'@yearn-finance/web-lib/contexts';
import	{toAddress, providers, format}							from	'@yearn-finance/web-lib/utils';
import	{useBalances}											from	'@yearn-finance/web-lib/hooks';
import	YVECRV_ABI												from	'utils/abi/yveCRV.abi';
import type * as TWalletTypes									from	'contexts/useWallet.d';
import type {TClaimable}										from	'types/types';

const	defaultProps = {
	balances: {},
	yveCRVClaimable: {raw: ethers.constants.Zero, normalized: 0},
	useWalletNonce: 0
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
	const	{provider, address, isActive} = useWeb3();
	const	{data} = useBalances({
		key: 0,
		tokens: [
			{token: process.env.YVBOOST_TOKEN_ADDRESS},
			{token: process.env.YVECRV_TOKEN_ADDRESS, for: '0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a'},
			{token: process.env.CRV_TOKEN_ADDRESS, for: '0x32d03db62e464c9168e41028ffa6e9a05d8c6451'},
			{token: process.env.THREECRV_TOKEN_ADDRESS, for: '0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a'},
			{token: process.env.CVXCRV_TOKEN_ADDRESS, for: '0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a'}
		]
	});
	const	[nonce] = React.useState<number>(0);
	const	[yveCRVClaimable, set_yveCRVClaimable] = React.useState<TClaimable>({raw: ethers.constants.Zero, normalized: 0});

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
		const	userAddress = '0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a' || address;
		const	calls = [];

		const	yveCRVContract = new Contract(process.env.YVECRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		calls.push(yveCRVContract.claimable(userAddress));

		const	[claimable] = await ethcallProvider.tryAll(calls) as [BigNumber];

		set_yveCRVClaimable({
			raw: claimable,
			normalized: format.toNormalizedValue(claimable, 18)
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
					[toAddress(process.env.CRV_TOKEN_ADDRESS)]: data[toAddress(process.env.CRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.THREECRV_TOKEN_ADDRESS)]: data[toAddress(process.env.THREECRV_TOKEN_ADDRESS)] || defaultData,
					[toAddress(process.env.CVXCRV_TOKEN_ADDRESS)]: data[toAddress(process.env.CVXCRV_TOKEN_ADDRESS)] || defaultData
				},
				yveCRVClaimable,
				useWalletNonce: nonce
			}}>
			{children}
		</WalletContext.Provider>
	);
};


export const useWallet = (): TWalletTypes.TWalletContext => useContext(WalletContext);
export default useWallet;