import {format, toAddress} from '@yearn-finance/web-lib/utils';
import {BigNumber, ethers} from 'ethers';

export function formatWithSlippage(options: {value: BigNumber, addressFrom: string, addressTo: string, slippage: number}): number {
	const {value, addressFrom, addressTo, slippage} = options;

	const hasLP = [toAddress(addressFrom), toAddress(addressTo)].includes(toAddress(process.env.LPYCRV_TOKEN_ADDRESS));

	if (hasLP) {
		const minAmountStr = Number(ethers.utils.formatUnits(value || ethers.constants.Zero, 18));
		const minAmountWithSlippage = ethers.utils.parseUnits((minAmountStr * (1 - slippage / 100)).toFixed(18), 18);
    
		return format.toNormalizedValue(minAmountWithSlippage || ethers.constants.Zero, 18);
	}
	return format.toNormalizedValue(value || ethers.constants.Zero, 18);
}
