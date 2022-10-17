import {BigNumber, constants} from 'ethers';
import {TokenAllowanceRequest, getTokenAllowance} from 'wido';

export async function widoAllowance(request: TokenAllowanceRequest): Promise<BigNumber> {
	try {
		const {allowance} = await getTokenAllowance(request);
		return BigNumber.from(allowance);
	} catch (error) {
		console.error(error);
		return constants.Zero;
	}
}
