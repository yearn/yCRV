import {VAULT_ABI} from '@yearn-finance/web-lib/utils/abi/vault.abi';
import {ZAP_CRV_ABI} from '@yearn-finance/web-lib/utils/abi/ycrv.zapCRV.abi';
import {toAddress} from '@yearn-finance/web-lib/utils/address';
import {assert} from '@yearn-finance/web-lib/utils/assert';
import {ZAP_YEARN_VE_CRV_ADDRESS} from '@yearn-finance/web-lib/utils/constants';
import {handleTx, toWagmiProvider} from '@yearn-finance/web-lib/utils/wagmi/provider';
import {assertAddress} from '@yearn-finance/web-lib/utils/wagmi/utils';

import type {TAddress} from '@yearn-finance/web-lib/types';
import type {TWriteTransaction} from '@yearn-finance/web-lib/utils/wagmi/provider';
import type {TTxResponse} from '@yearn-finance/web-lib/utils/web3/transaction';

/* 🔵 - Yearn Finance **********************************************************
 ** deposit is a _WRITE_ function that deposits a collateral into a vault using
 ** the vanilla direct deposit function.
 **
 ** @app - Vaults
 ** @param amount - The amount of ETH to deposit.
 ******************************************************************************/
type TDeposit = TWriteTransaction & {
	amount: bigint;
};
export async function deposit(props: TDeposit): Promise<TTxResponse> {
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);
	const wagmiProvider = await toWagmiProvider(props.connector);
	assertAddress(wagmiProvider.address, 'wagmiProvider.address');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: VAULT_ABI,
		functionName: 'deposit',
		args: [props.amount, wagmiProvider.address]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** zapCRV is a _WRITE_ function that can be used to zap some supported tokens
 ** from the Curve ecosystem into one of the Yearn's yCRV ecosystem.
 **
 ** @app - yCRV
 ** @param inputToken - Token to be zapped from curve
 ** @param outputToken - Token to be zapped into Yearn's yCRV ecosystem
 ** @param amount - Amount of inputToken to be zapped
 ** @param minAmount - Minimum amount of outputToken to be received
 ** @param slippage - Slippage tolerance
 ******************************************************************************/
type TZapYCRV = TWriteTransaction & {
	inputToken: TAddress | undefined;
	outputToken: TAddress | undefined;
	amount: bigint;
	minAmount: bigint;
	slippage: bigint;
};
export async function zapCRV(props: TZapYCRV): Promise<TTxResponse> {
	const minAmountWithSlippage = props.minAmount - (props.minAmount * props.slippage) / 10_000n;

	assertAddress(ZAP_YEARN_VE_CRV_ADDRESS, 'ZAP_YEARN_VE_CRV_ADDRESS');
	assertAddress(props.inputToken, 'inputToken');
	assertAddress(props.outputToken, 'outputToken');
	assert(props.amount > 0n, 'Amount must be greater than 0');
	assert(props.minAmount > 0n, 'Min amount must be greater than 0');

	return await handleTx(props, {
		address: ZAP_YEARN_VE_CRV_ADDRESS,
		abi: ZAP_CRV_ABI,
		functionName: 'zap',
		args: [toAddress(props.inputToken), toAddress(props.outputToken), props.amount, minAmountWithSlippage]
	});
}
