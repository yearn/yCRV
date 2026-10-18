import useSWR from 'swr';
import {isTAddress, toAddress} from '@builtbymom/web3/utils';

import type {TAddress, TDict} from '@builtbymom/web3/types';

const MAX_SPOT_TOKENS = 50;
const PRICE_REFRESH_INTERVAL = 120_000;
const PRICE_PROXY_URL = process.env.NEXT_PUBLIC_PRICES_PROXY_URL || '/api/prices/spot';

type TPriceError = {code: string; message: string};
type TSpotResponse = {
	prices: Record<string, number>;
	missing: string[];
	stale: string[];
	errors: Record<string, TPriceError>;
};

export type TPriceResult = Partial<Record<TAddress, number>>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseSpotResponse(value: unknown): TSpotResponse {
	if (
		!isRecord(value) ||
		!isRecord(value.prices) ||
		!Array.isArray(value.missing) ||
		!Array.isArray(value.stale) ||
		!isRecord(value.errors)
	) {
		throw new Error('Price proxy response was malformed');
	}
	for (const price of Object.values(value.prices)) {
		if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
			throw new Error('Price proxy returned an invalid quote');
		}
	}
	if (
		value.missing.some((key): boolean => typeof key !== 'string') ||
		value.stale.some((key): boolean => typeof key !== 'string')
	) {
		throw new Error('Price proxy response was malformed');
	}
	for (const error of Object.values(value.errors)) {
		if (!isRecord(error) || typeof error.code !== 'string' || typeof error.message !== 'string') {
			throw new Error('Price proxy response was malformed');
		}
	}
	return {
		prices: value.prices as Record<string, number>,
		missing: value.missing as string[],
		stale: value.stale as string[],
		errors: value.errors as Record<string, TPriceError>
	};
}

function splitIntoBatches<T>(values: T[], batchSize: number): T[][] {
	const batches: T[][] = [];
	for (let index = 0; index < values.length; index += batchSize) {
		batches.push(values.slice(index, index + batchSize));
	}
	return batches;
}

async function fetchPriceBatches(serializedBatches: string): Promise<TSpotResponse[]> {
	const batches = JSON.parse(serializedBatches) as string[][];
	return Promise.all(
		batches.map(async (coins): Promise<TSpotResponse> => {
			const separator = PRICE_PROXY_URL.includes('?') ? '&' : '?';
			const endpoint = `${PRICE_PROXY_URL}${separator}coins=${encodeURIComponent(JSON.stringify(coins))}`;
			const response = await fetch(endpoint);
			if (!response.ok) {
				throw new Error(`Price Service request failed (${response.status})`);
			}
			return parseSpotResponse(await response.json());
		})
	);
}

export function usePrices({
	tokens,
	chainId
}: {
	tokens: TAddress[];
	chainId: number;
}): {
	data: TPriceResult | undefined;
	priceErrors: TDict<TPriceError>;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
} {
	const addresses = tokens
		.filter((token): boolean => isTAddress(token))
		.map((token): TAddress => toAddress(token));
	const keys = chainId === 1 ? addresses.map((address): string => `ethereum:${address.toLowerCase()}`) : [];
	const batches = splitIntoBatches(keys, MAX_SPOT_TOKENS);
	const serializedBatches = batches.length ? JSON.stringify(batches) : null;
	const {data: responses, error, isLoading} = useSWR<TSpotResponse[]>(serializedBatches, fetchPriceBatches, {
		errorRetryInterval: PRICE_REFRESH_INTERVAL,
		revalidateOnFocus: false,
		refreshInterval: PRICE_REFRESH_INTERVAL
	});
	const data: TPriceResult = {};
	const priceErrors: TDict<TPriceError> = {};
	if (!error) {
		for (const response of responses || []) {
			for (const [key, price] of Object.entries(response.prices)) {
				const [, address] = key.split(':');
				if (isTAddress(address)) {
					data[toAddress(address)] = price;
				}
			}
			for (const [key, priceError] of Object.entries(response.errors)) {
				const [, address] = key.split(':');
				if (isTAddress(address)) {
					const normalizedAddress = toAddress(address);
					delete data[normalizedAddress];
					priceErrors[normalizedAddress] = priceError;
				}
			}
			for (const key of [...response.missing, ...response.stale]) {
				const [, address] = key.split(':');
				if (isTAddress(address)) {
					const normalizedAddress = toAddress(address);
					delete data[normalizedAddress];
					priceErrors[normalizedAddress] = {
						code: response.stale.includes(key) ? 'STALE_PRICE' : 'MISSING_PRICE',
						message: response.stale.includes(key) ? 'Price is stale' : 'Price is unavailable'
					};
				}
			}
		}
	}
	return {
		data: error ? undefined : responses ? data : undefined,
		priceErrors,
		isLoading,
		isSuccess: !isLoading && !error && responses !== undefined,
		isError: Boolean(error)
	};
}
