import {createContext, useContext, useMemo, useState} from 'react';
import {useAllowances} from 'app/hooks/useAllowanceHook';
import {defaultHoldings, useHoldings} from 'app/hooks/useHoldingsHook';
import {usePrices} from 'app/hooks/usePrices';
import {useFetch} from '@builtbymom/web3/hooks/useFetch';
import {CRV_TOKEN_ADDRESS} from '@builtbymom/web3/utils';
import {useYDaemonBaseURI} from '@yearn-finance/web-lib/hooks/useYDaemonBaseURI';
import {
	LPYCRV_TOKEN_ADDRESS,
	LPYCRV_V2_TOKEN_ADDRESS,
	STYCRV_TOKEN_ADDRESS,
	VLYCRV_TOKEN_ADDRESS,
	YCRV_TOKEN_ADDRESS,
	YVBOOST_TOKEN_ADDRESS,
	YVECRV_TOKEN_ADDRESS
} from '@yearn-finance/web-lib/utils/constants';
import {
	yDaemonVaultHarvestsSchema,
	yDaemonVaultSchema
} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';

import type {TCRVHoldings} from 'app/hooks/useHoldingsHook';
import type {TPriceResult} from 'app/hooks/usePrices';
import type {ReactElement} from 'react';
import type {TYDaemonVault, TYDaemonVaultHarvests} from '@yearn-finance/web-lib/utils/schemas/yDaemonVaultsSchemas';
import type {TDict} from '@builtbymom/web3/types';

type TYCRVContext = {
	styCRVAPY: number;
	slippage: number;
	allowances: TDict<bigint>;
	holdings: TCRVHoldings;
	harvests: TYDaemonVaultHarvests;
	prices: TPriceResult;
	set_slippage: (slippage: number) => void;
	refetchAllowances: () => void;
};

const defaultProps = {
	styCRVAPY: 0,
	harvests: [],
	allowances: {},
	slippage: 0.03,
	holdings: defaultHoldings,
	prices: {},
	set_slippage: (): void => undefined,
	refetchAllowances: (): void => undefined
};

/* 🔵 - Yearn Finance **********************************************************
 ** This context controls the Holdings computation.
 ******************************************************************************/
const YCRVContext = createContext<TYCRVContext>(defaultProps);
export const YCRVContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const {yDaemonBaseUri} = useYDaemonBaseURI({chainID: 1});
	const [slippage, set_slippage] = useState<number>(0.03);
	const holdings = useHoldings();
	const allowances = useAllowances();
	const {data: prices} = usePrices({
		tokens: [
			CRV_TOKEN_ADDRESS,
			STYCRV_TOKEN_ADDRESS,
			LPYCRV_TOKEN_ADDRESS,
			LPYCRV_V2_TOKEN_ADDRESS,
			VLYCRV_TOKEN_ADDRESS,
			YCRV_TOKEN_ADDRESS,
			LPYCRV_V2_TOKEN_ADDRESS,
			YVECRV_TOKEN_ADDRESS,
			YVBOOST_TOKEN_ADDRESS
		],
		chainId: 1
	});

	const {data: styCRVVault} = useFetch<TYDaemonVault>({
		endpoint: `${yDaemonBaseUri}/vaults/${STYCRV_TOKEN_ADDRESS}`,
		schema: yDaemonVaultSchema
	});

	const {data: yCRVHarvests} = useFetch<TYDaemonVaultHarvests>({
		endpoint: `${yDaemonBaseUri}/vaults/harvests/${STYCRV_TOKEN_ADDRESS},${LPYCRV_TOKEN_ADDRESS},${LPYCRV_V2_TOKEN_ADDRESS}`,
		schema: yDaemonVaultHarvestsSchema
	});

	/* 🔵 - Yearn Finance ******************************************************
	 ** Compute the styCRV APY based on the experimental APY and the mega boost.
	 **************************************************************************/
	const styCRVAPY = useMemo((): number => {
		return (styCRVVault?.apr?.netAPR || 0) * 100;
	}, [styCRVVault]);

	/* 🔵 - Yearn Finance ******************************************************
	 **	Setup and render the Context provider to use in the app.
	 ***************************************************************************/
	const contextValue = useMemo(
		(): TYCRVContext => ({
			harvests: yCRVHarvests ?? [],
			holdings: holdings,
			allowances: allowances[0],
			refetchAllowances: allowances[1],
			styCRVAPY,
			slippage,
			set_slippage,
			prices: prices ?? {}
		}),
		[yCRVHarvests, holdings, allowances, styCRVAPY, slippage, set_slippage, prices]
	);

	return <YCRVContext.Provider value={contextValue}>{children}</YCRVContext.Provider>;
};

export const useYCRV = (): TYCRVContext => useContext(YCRVContext);
