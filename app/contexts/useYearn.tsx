import {createContext, useContext, useMemo} from 'react';
import useSWR from 'swr';
import {isTAddress, toAddress} from '@builtbymom/web3/utils';
import {
	LPYCRV_TOKEN_ADDRESS,
	LPYCRV_V2_TOKEN_ADDRESS,
	STYCRV_TOKEN_ADDRESS,
	ZERO_ADDRESS
} from '@yearn-finance/web-lib/utils/constants';

import type {ReactElement, ReactNode} from 'react';
import type {TAddress, TDict} from '@builtbymom/web3/types';

const KONG_REST_URL = 'https://kong.yearn.fi/api/rest';
const VAULT_ADDRESSES = [STYCRV_TOKEN_ADDRESS, LPYCRV_TOKEN_ADDRESS, LPYCRV_V2_TOKEN_ADDRESS];
const ZERO_ADDRESS_LOWER = ZERO_ADDRESS.toLowerCase();

type TKongMigration = {
	available: true;
	target: TAddress;
	contract: TAddress;
};

export type TYCRVKongVault = {
	address: TAddress;
	chainID: 1;
	name: string;
	token: {
		address: TAddress;
		name: string;
		symbol: string;
		decimals: number;
	};
	apr: {netAPR?: number};
	migration?: TKongMigration;
};

type TKongVaultData = {
	vaults: TDict<TYCRVKongVault | undefined>;
	vaultsMigrations: TDict<TYCRVKongVault | undefined>;
	unavailableVaults: TAddress[];
};

type TKongSnapshot = {
	address?: unknown;
	chainId?: unknown;
	name?: unknown;
	asset?: unknown;
	performance?: unknown;
	meta?: unknown;
};

type TParsedSnapshot = {
	vault: TYCRVKongVault;
	migrationError: boolean;
};

const defaultValue: TKongVaultData = {
	vaults: {},
	vaultsMigrations: {},
	unavailableVaults: []
};

const KongVaultContext = createContext<TKongVaultData>(defaultValue);

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseInteger(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isInteger(value)) {
		return value;
	}
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isInteger(parsed)) {
			return parsed;
		}
	}
	return undefined;
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

function parseMigration(value: unknown): TKongMigration | undefined {
	if (!isRecord(value) || value.available !== true) {
		return undefined;
	}
	const target = value.target;
	const contract = value.contract;
	if (
		typeof target !== 'string' ||
		typeof contract !== 'string' ||
		!isTAddress(target) ||
		!isTAddress(contract) ||
		target.toLowerCase() === ZERO_ADDRESS_LOWER ||
		contract.toLowerCase() === ZERO_ADDRESS_LOWER
	) {
		return undefined;
	}
	return {available: true, target: toAddress(target), contract: toAddress(contract)};
}

function parseSnapshot(value: unknown, expectedAddress: TAddress): TParsedSnapshot | undefined {
	if (!isRecord(value)) {
		return undefined;
	}
	const snapshot = value as TKongSnapshot;
	const chainId = parseInteger(snapshot.chainId);
	if (
		chainId !== 1 ||
		typeof snapshot.address !== 'string' ||
		!isTAddress(snapshot.address) ||
		toAddress(snapshot.address) !== toAddress(expectedAddress) ||
		typeof snapshot.name !== 'string' ||
		!isRecord(snapshot.asset)
	) {
		return undefined;
	}

	const asset = snapshot.asset;
	const assetAddress = asset.address;
	const assetName = asset.name;
	const assetSymbol = asset.symbol;
	const assetDecimals = parseInteger(asset.decimals);
	if (
		typeof assetAddress !== 'string' ||
		!isTAddress(assetAddress) ||
		typeof assetName !== 'string' ||
		typeof assetSymbol !== 'string' ||
		assetDecimals === undefined ||
		assetDecimals < 0 ||
		assetDecimals > 255
	) {
		return undefined;
	}

	const performance = isRecord(snapshot.performance) ? snapshot.performance : {};
	const historical = isRecord(performance.historical) ? performance.historical : {};
	const meta = isRecord(snapshot.meta) ? snapshot.meta : {};
	const migrationData = parseMigration(meta.migration);
	const migrationTargetMatches =
		migrationData?.target.toLowerCase() === LPYCRV_V2_TOKEN_ADDRESS.toLowerCase();
	const requiresMigration = expectedAddress.toLowerCase() === LPYCRV_TOKEN_ADDRESS.toLowerCase();
	const migrationIsInvalid =
		(requiresMigration && (!migrationData || !migrationTargetMatches)) ||
		(isRecord(meta.migration) && meta.migration.available === true && migrationData === undefined);
	return {
		vault: {
			address: toAddress(snapshot.address),
			chainID: 1,
			name: snapshot.name,
			token: {
				address: toAddress(assetAddress),
				name: assetName,
				symbol: assetSymbol,
				decimals: assetDecimals
			},
			apr: {netAPR: parseFiniteNumber(historical.net)},
			migration: requiresMigration && !migrationTargetMatches ? undefined : migrationData
		},
		migrationError: migrationIsInvalid
	};
}

async function fetchVaultSnapshots(): Promise<TKongVaultData> {
	const results = await Promise.allSettled(
		VAULT_ADDRESSES.map(async (address): Promise<unknown> => {
			const response = await fetch(`${KONG_REST_URL}/snapshot/1/${address}`);
			if (!response.ok) {
				throw new Error(`Kong snapshot request failed (${response.status})`);
			}
			return response.json();
		})
	);
	const vaults: TDict<TYCRVKongVault | undefined> = {};
	const vaultsMigrations: TDict<TYCRVKongVault | undefined> = {};
	const unavailableVaults: TAddress[] = [];
	for (let index = 0; index < results.length; index += 1) {
		const address = VAULT_ADDRESSES[index];
		const result = results[index];
		const parsed = result.status === 'fulfilled' ? parseSnapshot(result.value, address) : undefined;
		if (!parsed) {
			unavailableVaults.push(address);
			continue;
		}
		vaults[toAddress(address)] = parsed.vault;
		if (parsed.vault.apr.netAPR === undefined) {
			unavailableVaults.push(address);
		}
		if (parsed.vault.migration?.available) {
			vaultsMigrations[toAddress(address)] = parsed.vault;
		} else if (parsed.migrationError) {
			unavailableVaults.push(address);
		}
	}
	return {vaults, vaultsMigrations, unavailableVaults};
}

export function YearnKongVaultContextApp({children}: {children: ReactNode}): ReactElement {
	const {data, error} = useSWR<TKongVaultData>('ycrv-kong-vault-snapshots', fetchVaultSnapshots, {
		errorRetryInterval: 300_000,
		revalidateOnFocus: false,
		refreshInterval: 300_000
	});
	const value = useMemo((): TKongVaultData => {
		if (error) {
			return {...defaultValue, unavailableVaults: VAULT_ADDRESSES};
		}
		return data || defaultValue;
	}, [data, error]);

	return (
		<KongVaultContext.Provider value={value}>
			{value.unavailableVaults.length > 0 && (
				<div
					role={'alert'}
					className={'mx-auto mt-4 max-w-6xl bg-amber-100 px-4 py-3 text-sm text-amber-900'}>
					{'Some vault APR or migration details are unavailable from Kong. Affected APYs show N/A and migration entries remain hidden until their metadata is available.'}
				</div>
			)}
			{children}
		</KongVaultContext.Provider>
	);
}

export const useKongVaults = (): TKongVaultData => useContext(KongVaultContext);
