import {BigNumber, ethers} from 'ethers';

export async function	calcExpectedOut(
	provider: ethers.providers.Web3Provider,
	inputToken: string,
	outputToken: string,
	amount: BigNumber
): Promise<BigNumber> {
	const	signer = provider.getSigner();

	console.log({
		inputToken,
		outputToken,
		amount: amount.toString()
	});
	try {
		const	contract = new ethers.Contract(
			process.env.ZAP_YEARN_VE_CRV_ADDRESS as string,
			['function calc_expected_out(address _input, address _output, uint256 _amount) external view returns (uint256)'],
			signer
		);
		const	expectedOutput = await contract.calc_expected_out(inputToken, outputToken, amount);
		return expectedOutput;
	} catch(error) {
		console.error(error);
		return ethers.constants.Zero;
	}
}


export async function	ZapCRVtoYvBOOST(
	provider: ethers.providers.Web3Provider,
	amount: BigNumber,
	minAmount: BigNumber
): Promise<boolean> {
	const	signer = provider.getSigner();
	const	address = await signer.getAddress();

	try {
		const	contract = new ethers.Contract(
			process.env.ZAP_YEARN_VE_CRV_ADDRESS as string,
			['function zapCRVtoYvBOOST(uint256 _amount, uint256 _minOut, address _recipient) external returns (uint256)'],
			signer
		);
		const	SLIPPAGE = 0.1;
		const	minAmountStr = Number(ethers.utils.formatUnits(minAmount, 18));
		const	minAmountWithSlippage = ethers.utils.parseUnits((minAmountStr * (1 - SLIPPAGE)).toFixed(18), 18);
		const	transaction = await contract.zapCRVtoYvBOOST(amount, minAmountWithSlippage, address);
		const	transactionResult = await transaction.wait();
		if (transactionResult.status === 0) {
			console.error('Fail to perform transaction');
			return false;
		}

		return true;
	} catch(error) {
		console.error(error);
		return false;
	}
}
