import	{toAddress}	from	'@yearn-finance/web-lib/utils';
import	{BigNumber} from	'ethers';

export function	max(input: BigNumber, balance: BigNumber): BigNumber {
	if (input.gt(balance)) {
		return balance;
	}
	return input;
}

export function allowanceKey(token: unknown, spender: unknown): string {
	return `${toAddress(token as string)}_${toAddress(spender as string)}`;
}