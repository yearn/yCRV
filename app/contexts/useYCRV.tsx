import {createContext, useContext, useMemo, useState} from 'react';
import useSWR from 'swr';
import {useAllowances} from 'app/hooks/useAllowanceHook';
import {defaultHoldings, useHoldings} from 'app/hooks/useHoldingsHook';
import {usePrices} from 'app/hooks/usePrices';
import {CRV_TOKEN_ADDRESS, isTAddress, toAddress} from '@builtbymom/web3/utils';
import {
	CVXCRV_TOKEN_ADDRESS,
	LPYCRV_TOKEN_ADDRESS,
	LPYCRV_V2_TOKEN_ADDRESS,
	STYCRV_TOKEN_ADDRESS,
	YCRV_CURVE_POOL_ADDRESS,
	YCRV_CURVE_POOL_V2_ADDRESS,
	YCRV_TOKEN_ADDRESS,
	YVBOOST_TOKEN_ADDRESS,
	YVECRV_TOKEN_ADDRESS
} from '@yearn-finance/web-lib/utils/constants';
import {useKongVaults} from 'app/contexts/useYearn';

import type {TCRVHoldings} from 'app/hooks/useHoldingsHook';
import type {TPriceResult} from 'app/hooks/usePrices';
import type {ReactElement} from 'react';
import type {TAddress, TDict} from '@builtbymom/web3/types';

const KONG_REST_URL = 'https://kong.yearn.fi/api/rest';
const HARVEST_VAULTS = [STYCRV_TOKEN_ADDRESS, LPYCRV_TOKEN_ADDRESS, LPYCRV_V2_TOKEN_ADDRESS];
const HARVEST_REFRESH_INTERVAL = 300_000;

export type TYCRVHarvest = {
	vaultAddress: TAddress;
	profit: string;
	loss: string;
	profitValue: string;
	lossValue: string;
	timestamp: string;
	txHash: string;
	blockNumber: string;
	logIndex: number;
};

type TKongReport = {
	chainId?: unknown;
	address?: unknown;
	eventName?: unknown;
	gain?: unknown;
	loss?: unknown;
	gainUsd?: unknown;
	lossUsd?: unknown;
	blockTime?: unknown;
	transactionHash?: unknown;
	blockNumber?: unknown;
	logIndex?: unknown;
};

type THarvestData = {
	harvests: TYCRVHarvest[];
	unavailableVaults: TAddress[];
	partialVaults: TAddress[];
};

type TYCRVContext = {
	styCRVAPY: number | undefined;
	slippage: number;
	allowances: TDict<bigint>;
	holdings: TCRVHoldings;
	harvests: TYCRVHarvest[];
	harvestsUnavailableVaults: TAddress[];
	harvestsPartialVaults: TAddress[];
	isHarvestsLoading: boolean;
	prices: TPriceResult;
	priceErrors: TDict<{code: string; message: string}>;
	isPriceError: boolean;
	set_slippage: (slippage: number) => void;
	refetchAllowances: () => void;
};

const defaultHarvestData: THarvestData = {harvests: [], unavailableVaults: [], partialVaults: []};
const defaultProps: TYCRVContext = {
	styCRVAPY: undefined,
	harvests: [],
	harvestsUnavailableVaults: [],
	harvestsPartialVaults: [],
	isHarvestsLoading: true,
	allowances: {},
	slippage: 0.03,
	holdings: defaultHoldings,
	prices: {},
	priceErrors: {},
	isPriceError: false,
	set_slippage: (): void => undefined,
	refetchAllowances: (): void => undefined
};

const YCRVContext = createContext<TYCRVContext>(defaultProps);

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseFiniteNumber(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}
	return undefined;
}

function parseInteger(value: unknown): number | undefined {
	const parsed = parseFiniteNumber(value);
	return parsed !== undefined && Number.isInteger(parsed) ? parsed : undefined;
}

function parseRawAmount(value: unknown): string | undefined {
	return typeof value === 'string' && /^\d+$/.test(value) ? value : undefined;
}

function parseReport(value: unknown, address: TAddress): TYCRVHarvest | undefined {
	if (!isRecord(value) || value.eventName !== 'StrategyReported') {
		return undefined;
	}
	const report = value as TKongReport;
	const chainId = parseInteger(report.chainId);
	const reportAddress = report.address;
	const gain = parseRawAmount(report.gain);
	const loss = parseRawAmount(report.loss);
	const gainUsd = parseFiniteNumber(report.gainUsd);
	const lossUsd = parseFiniteNumber(report.lossUsd);
	const timestamp = parseFiniteNumber(report.blockTime);
	const blockNumber = parseRawAmount(report.blockNumber);
	const logIndex = parseInteger(report.logIndex);
	const transactionHash = report.transactionHash;
	if (
		chainId !== 1 ||
		typeof reportAddress !== 'string' ||
		!isTAddress(reportAddress) ||
		toAddress(reportAddress) !== toAddress(address) ||
		gain === undefined ||
		loss === undefined ||
		gainUsd === undefined ||
		lossUsd === undefined ||
		timestamp === undefined ||
		timestamp <= 0 ||
		blockNumber === undefined ||
		logIndex === undefined ||
		logIndex < 0 ||
		typeof transactionHash !== 'string' ||
		!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)
	) {
		return undefined;
	}
	return {
		vaultAddress: toAddress(reportAddress),
		profit: gain,
		loss,
		profitValue: String(gainUsd),
		lossValue: String(lossUsd),
		timestamp: String(timestamp),
		txHash: transactionHash,
		blockNumber,
		logIndex
	};
}

async function fetchKongHarvests(): Promise<THarvestData> {
	const results = await Promise.allSettled(
		HARVEST_VAULTS.map(async (address): Promise<unknown> => {
			const response = await fetch(`${KONG_REST_URL}/reports/1/${address}`);
			if (!response.ok) {
				throw new Error(`Kong reports request failed (${response.status})`);
			}
			return response.json();
		})
	);
	const harvests: TYCRVHarvest[] = [];
	const unavailableVaults: TAddress[] = [];
	const partialVaults: TAddress[] = [];
	for (let index = 0; index < results.length; index += 1) {
		const address = HARVEST_VAULTS[index];
		const result = results[index];
		if (result.status === 'rejected' || !Array.isArray(result.value)) {
			unavailableVaults.push(address);
			continue;
		}
		let hasInvalidReport = false;
		for (const item of result.value) {
			if (isRecord(item) && item.eventName !== 'StrategyReported') {
				continue;
			}
			const report = parseReport(item, address);
			if (report) {
				harvests.push(report);
			} else {
				hasInvalidReport = true;
			}
		}
		if (hasInvalidReport) {
			partialVaults.push(address);
		}
	}
	const uniqueHarvests = new Map<string, TYCRVHarvest>();
	for (const harvest of harvests) {
		const identity = `${harvest.vaultAddress.toLowerCase()}:${harvest.txHash.toLowerCase()}:${harvest.logIndex}`;
		uniqueHarvests.set(identity, harvest);
	}
	return {
		harvests: [...uniqueHarvests.values()].sort((a, b): number => {
			const timestampDelta = Number(b.timestamp) - Number(a.timestamp);
			if (timestampDelta !== 0) {
				return timestampDelta;
			}
			const blockA = BigInt(a.blockNumber);
			const blockB = BigInt(b.blockNumber);
			if (blockA !== blockB) {
				return blockA > blockB ? -1 : 1;
			}
			return b.logIndex - a.logIndex;
		}),
		unavailableVaults,
		partialVaults
	};
}

export const YCRVContextApp = ({children}: {children: ReactElement}): ReactElement => {
	const [slippage, set_slippage] = useState<number>(0.03);
	const holdings = useHoldings();
	const allowances = useAllowances();
	const {vaults} = useKongVaults();
	const {data: prices, priceErrors, isError: isPriceError} = usePrices({
		tokens: [
			CRV_TOKEN_ADDRESS,
			CVXCRV_TOKEN_ADDRESS,
			STYCRV_TOKEN_ADDRESS,
			LPYCRV_TOKEN_ADDRESS,
			LPYCRV_V2_TOKEN_ADDRESS,
			YCRV_CURVE_POOL_ADDRESS,
			YCRV_CURVE_POOL_V2_ADDRESS,
			YCRV_TOKEN_ADDRESS,
			YVECRV_TOKEN_ADDRESS,
			YVBOOST_TOKEN_ADDRESS
		],
		chainId: 1
	});
	const {data: harvestData, error: harvestsError, isLoading: isHarvestsLoading} = useSWR<THarvestData>(
		'ycrv-kong-harvests',
		fetchKongHarvests,
		{
			errorRetryInterval: HARVEST_REFRESH_INTERVAL,
			revalidateOnFocus: false,
			refreshInterval: HARVEST_REFRESH_INTERVAL
		}
	);
	const styCRVNetAPR = vaults[toAddress(STYCRV_TOKEN_ADDRESS)]?.apr.netAPR;
	const styCRVAPY = styCRVNetAPR === undefined ? undefined : styCRVNetAPR * 100;
	const currentHarvestData = harvestsError
		? {...defaultHarvestData, unavailableVaults: HARVEST_VAULTS}
		: harvestData || defaultHarvestData;

	const contextValue = useMemo(
		(): TYCRVContext => ({
			harvests: currentHarvestData.harvests,
			harvestsUnavailableVaults: currentHarvestData.unavailableVaults,
			harvestsPartialVaults: currentHarvestData.partialVaults,
			isHarvestsLoading,
			holdings,
			allowances: allowances[0],
			refetchAllowances: allowances[1],
			styCRVAPY,
			slippage,
			set_slippage,
			prices: prices ?? {},
			priceErrors,
			isPriceError
		}),
		[currentHarvestData, holdings, allowances, styCRVAPY, slippage, set_slippage, prices, priceErrors, isPriceError, isHarvestsLoading]
	);

	return (
		<YCRVContext.Provider value={contextValue}>
			{(isPriceError || Object.keys(priceErrors).length > 0) && (
				<div
					role={'alert'}
					className={'mx-auto mt-4 max-w-6xl bg-amber-100 px-4 py-3 text-sm text-amber-900'}>
					{'Some token prices are unavailable or stale. Affected USD valuations and price-derived APRs show N/A.'}
				</div>
			)}
			{children}
		</YCRVContext.Provider>
	);
};

export const useYCRV = (): TYCRVContext => useContext(YCRVContext);
