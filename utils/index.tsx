import {BigNumber, ethers} from 'ethers';
import {format, toAddress} from '@yearn-finance/web-lib/utils';
import {Dict, TNormalizedBN, TYearnVault} from 'types/types';

export function	max(input: BigNumber, balance: BigNumber): BigNumber {
	if (input.gt(balance)) {
		return balance;
	}
	return input;
}

export function allowanceKey(token: string, spender?: string): string {
	return `${toAddress(token)}_${toAddress(spender)}`;
}

export function	getCounterValue(amount: number | string, price: number): string {
	if (!amount || !price) {
		return ('$0.00');
	}
	const value = (Number(amount) || 0) * (price || 0);
	if (value > 10000) {
		return (`$${format.amount(value, 0, 0)}`);
	}
	return (`$${format.amount(value, 2, 2)}`);
}

export function	getCounterValueRaw(amount: number | string, price: number): string {
	if (!amount || !price) {
		return ('');
	}
	const value = (Number(amount) || 0) * (price || 0);
	if (value > 10000) {
		return (`${format.amount(value, 0, 0)}`);
	}
	return (`${format.amount(value, 2, 2)}`);
}

export function getVaultAPY(vaults: Dict<TYearnVault | undefined>, vaultAddress: string): string {
	if (!vaults?.[toAddress(vaultAddress)]) {
		return '';
	}

	if (toAddress(vaultAddress) == toAddress(process.env.YVECRV_TOKEN_ADDRESS)
		|| toAddress(vaultAddress) == toAddress(process.env.YVBOOST_TOKEN_ADDRESS)) {
		return 'APY 0.00%';
	}

	if (toAddress(vaultAddress) == toAddress(process.env.STYCRV_TOKEN_ADDRESS)) {
		return `APY ${format.amount((vaults?.[toAddress(vaultAddress)]?.apy?.points?.week_ago || 0) * 100, 2, 2)}%`;
	}

	if (vaults?.[toAddress(vaultAddress)]?.apy?.net_apy) {
		return `APY ${format.amount((vaults?.[toAddress(vaultAddress)]?.apy?.net_apy || 0) * 100, 2, 2)}%`;
	}

	return 'APY 0.00%';
}

export function getAmountWithSlippage(from: string, to: string, value: BigNumber, slippage: number): number {
	const	hasLP = (
		toAddress(from) === toAddress(process.env.LPYCRV_TOKEN_ADDRESS)
		|| toAddress(to) === toAddress(process.env.LPYCRV_TOKEN_ADDRESS)
	);
	const	isDirectDeposit = (
		toAddress(from) === toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)
		|| toAddress(to) === toAddress(process.env.LPYCRV_TOKEN_ADDRESS)
	);

	if (hasLP && !isDirectDeposit) {
		const	minAmountStr = Number(ethers.utils.formatUnits(value || ethers.constants.Zero, 18));
		const	minAmountWithSlippage = ethers.utils.parseUnits((minAmountStr * (1 - (slippage / 100))).toFixed(18), 18);
		return format.toNormalizedValue(minAmountWithSlippage || ethers.constants.Zero, 18);
	}
	return format.toNormalizedValue(value || ethers.constants.Zero, 18);
}

export function handleInputChange(
	e: React.ChangeEvent<HTMLInputElement>,
	decimals: number
): TNormalizedBN {
	let		amount = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
	const	amountParts = amount.split('.');
	if (amountParts.length === 2) {
		amount = amountParts[0] + '.' + amountParts[1].slice(0, decimals);
	}
	const	raw = ethers.utils.parseUnits(amount || '0', decimals);
	return ({raw: raw, normalized: amount});
}
