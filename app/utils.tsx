import {formatUnits, parseUnits, zeroAddress} from 'viem';
import {formatPercent, toAddress, toBigInt, toNormalizedValue} from '@builtbymom/web3/utils';
import type {TYCRVKongVault} from 'app/contexts/useYearn';
import {
	LPYCRV_TOKEN_ADDRESS,
	LPYCRV_V2_TOKEN_ADDRESS,
	YCRV_CURVE_POOL_ADDRESS,
	YVBOOST_TOKEN_ADDRESS,
	YVECRV_TOKEN_ADDRESS
} from '@yearn-finance/web-lib/utils/constants';

import type {TDict} from '@builtbymom/web3/types';

export function getVaultAPR(vaults: TDict<TYCRVKongVault | undefined>, vaultAddress: string): string {
	const vault = vaults?.[toAddress(vaultAddress)];
	if (!vault) {
		return 'APY N/A';
	}

	if (toAddress(vaultAddress) === YVECRV_TOKEN_ADDRESS || toAddress(vaultAddress) === YVBOOST_TOKEN_ADDRESS) {
		return `APY ${formatPercent(0)}`;
	}

	if (vault.apr.netAPR === undefined) {
		return 'APY N/A';
	}
	return `APY ${formatPercent(vault.apr.netAPR * 100, 2, 2, 500)}`;
}

export function getAmountWithSlippage(from: string, to: string, value: bigint, slippage: number): number {
	const hasLP =
		toAddress(from) === LPYCRV_TOKEN_ADDRESS ||
		toAddress(to) === LPYCRV_TOKEN_ADDRESS ||
		toAddress(from) === LPYCRV_V2_TOKEN_ADDRESS ||
		toAddress(to) === LPYCRV_V2_TOKEN_ADDRESS;
	const isDirectDeposit =
		toAddress(from) === YCRV_CURVE_POOL_ADDRESS ||
		toAddress(to) === LPYCRV_TOKEN_ADDRESS ||
		toAddress(to) === LPYCRV_V2_TOKEN_ADDRESS;

	if (hasLP && !isDirectDeposit) {
		const minAmountStr = Number(formatUnits(toBigInt(value), 18));
		const minAmountWithSlippage = parseUnits((minAmountStr * (1 - slippage / 100)).toFixed(18) as `${number}`, 18);
		return toNormalizedValue(toBigInt(minAmountWithSlippage), 18);
	}
	return toNormalizedValue(value, 18);
}

export function truncateHexTx(hash: string | undefined, size: number): string {
	if (hash !== undefined) {
		if (size === 0) {
			return hash;
		}
		if (hash.length <= size * 2 + 4) {
			return hash;
		}
		return `0x${hash.slice(2, size + 2)}...${hash.slice(-size)}`;
	}
	if (size === 0) {
		return zeroAddress;
	}
	return `0x${zeroAddress.slice(2, size)}...${zeroAddress.slice(-size)}`;
}
