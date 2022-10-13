import {format, toAddress} from '@yearn-finance/web-lib/utils';
import {BigNumber} from 'ethers';

export function	max(input: BigNumber, balance: BigNumber): BigNumber {
	if (input.gt(balance)) {
		return balance;
	}
	return input;
}

export function allowanceKey(token: unknown, spender: unknown): string {
	return `${toAddress(token as string)}_${toAddress(spender as string)}`;
}

export function	getCounterValue(amount: number | string, price: number): string {
	if (!amount || !price) {
		return ('$0.00');
	}
	return (`$${format.amount((Number(amount) || 0) * (price || 0), 2, 2)}`);
}