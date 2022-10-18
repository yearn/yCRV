import React, {ReactElement, createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {BigNumber, ethers} from 'ethers';
import useSWR from 'swr';
import {Transaction, defaultTxStatus, performBatchedUpdates, providers, toAddress} from '@yearn-finance/web-lib/utils';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {useWallet} from 'contexts/useWallet';
import {useYearn} from 'contexts/useYearn';
import {approveERC20, widoApproveERC20} from 'utils/actions/approveToken';
import {zap} from 'utils/actions/zap';
import {deposit} from 'utils/actions/deposit';
import {LEGACY_OPTIONS_FROM, LEGACY_OPTIONS_TO} from 'utils/zapOptions';
import {allowanceKey, getAmountWithSlippage, getVaultAPY} from 'utils';
import {TDropdownOption, TNormalizedBN} from 'types/types';
import {widoZap} from 'utils/actions/widoZap';
import {widoAllowance} from 'utils/actions/widoAllowance';

type T = 'wido' | 'default';

type TCardTransactor = {
	selectedOptionFrom: TDropdownOption,
	selectedOptionTo: TDropdownOption,
	amount: TNormalizedBN,
	txStatusApprove: typeof defaultTxStatus,
	txStatusZap: typeof defaultTxStatus,
	allowanceFrom: BigNumber,
	fromVaultAPY: string,
	toVaultAPY: string,
	expectedOutWithSlippage: number,
	set_selectedOptionFrom: (option: TDropdownOption) => void,
	set_selectedOptionTo: (option: TDropdownOption) => void,
	set_amount: (amount: TNormalizedBN) => void,
	set_hasTypedSomething: (hasTypedSomething: boolean) => void,
	onApproveFrom: () => Promise<void>,
	onZap: () => Promise<void>
}

const		CardTransactorContext = createContext<TCardTransactor>({
	selectedOptionFrom: LEGACY_OPTIONS_FROM[0],
	selectedOptionTo: LEGACY_OPTIONS_TO[0],
	amount: {raw: ethers.constants.Zero, normalized: 0},
	txStatusApprove: defaultTxStatus,
	txStatusZap: defaultTxStatus,
	allowanceFrom: ethers.constants.Zero,
	fromVaultAPY: '',
	toVaultAPY: '',
	expectedOutWithSlippage: 0,
	set_selectedOptionFrom: (): void => undefined,
	set_selectedOptionTo: (): void => undefined,
	set_amount: (): void => undefined,
	set_hasTypedSomething: (): void => undefined,
	onApproveFrom: (): any => undefined,
	onZap: (): any => undefined
});

type TProps = {
	type?: T,
	defaultOptionFrom?: TDropdownOption,
	defaultOptionTo?: TDropdownOption,
	children?: ReactElement | null,
}

function	CardTransactorContextApp({
	defaultOptionFrom = LEGACY_OPTIONS_FROM[0],
	defaultOptionTo = LEGACY_OPTIONS_TO[0],
	children = null,
	type = 'default'
}: TProps): ReactElement {
	const	{provider, chainID, isActive, address} = useWeb3();
	const	{allowances, useWalletNonce, balances, refresh, slippage} = useWallet();
	const	{vaults} = useYearn();
	const	[txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const	[txStatusZap, set_txStatusZap] = useState(defaultTxStatus);
	const	[selectedOptionFrom, set_selectedOptionFrom] = useState(defaultOptionFrom);
	const	[selectedOptionTo, set_selectedOptionTo] = useState(defaultOptionTo);
	const	[amount, set_amount] = useState<TNormalizedBN>({raw: ethers.constants.Zero, normalized: 0});
	const	[hasTypedSomething, set_hasTypedSomething] = useState(false);
	const 	[allowanceFrom, set_allowanceFrom] = useState<BigNumber>(ethers.constants.Zero);

	/* 🔵 - Yearn Finance ******************************************************
	** useEffect to set the amount to the max amount of the selected token once
	** the wallet is connected, or to 0 if the wallet is disconnected.
	**************************************************************************/
	useEffect((): void => {
		if (isActive && amount.raw.eq(0) && !hasTypedSomething) {
			set_amount({
				raw: balances[toAddress(selectedOptionFrom.value)]?.raw || ethers.constants.Zero,
				normalized: balances[toAddress(selectedOptionFrom.value)]?.normalized || 0
			});
		} else if (!isActive && amount.raw.gt(0)) {
			performBatchedUpdates((): void => {
				set_amount({raw: ethers.constants.Zero, normalized: 0});
				set_hasTypedSomething(false);
			});
		}
	}, [isActive, selectedOptionFrom, amount.raw, hasTypedSomething, balances]);

	useEffect((): void => {
		const fetchWidoTokenAllowance = async (): Promise<void> => {
			const allowance = await widoAllowance({chainId: chainID, accountAddress: address, tokenAddress: selectedOptionFrom.value});
			set_allowanceFrom(BigNumber.from(allowance));
		};
		
		if (isActive && amount.raw.gt(0) &&  type === 'wido') {
			fetchWidoTokenAllowance();
		}

		if (type === 'default') {
			useWalletNonce; // remove warning
			const allowance = allowances[allowanceKey(selectedOptionFrom.value, selectedOptionFrom.zapVia)];
			set_allowanceFrom(allowance || ethers.constants.Zero);
		}
	}, [address, allowances, amount.raw, chainID, isActive, selectedOptionFrom.value, selectedOptionFrom.zapVia, type, useWalletNonce]);

	/* 🔵 - Yearn Finance ******************************************************
	** Perform a smartContract call to the ZAP contract to get the expected
	** out for a given in/out pair with a specific amount. This callback is
	** called every 10s or when amount/in or out changes.
	**************************************************************************/
	const expectedOutFetcher = useCallback(async (
		_inputToken: string,
		_outputToken: string,
		_amountIn: BigNumber
	): Promise<BigNumber> => {
		const	currentProvider = provider || providers.getProvider(1);

		if (_inputToken === toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)) {
			// Direct deposit to vault from crv/yCRV Curve LP Token to lp-yCRV Vault
			const	contract = new ethers.Contract(
				process.env.LPYCRV_TOKEN_ADDRESS as string,
				['function pricePerShare() public view returns (uint256)'],
				currentProvider
			);
			try {
				const	pps = await contract.pricePerShare() || ethers.constants.Zero;
				const	_expectedOut = _amountIn.mul(pps).div(ethers.constants.WeiPerEther);
				return _expectedOut;
			} catch (error) {
				return (ethers.constants.Zero);
			}
		} else {
			// Zap in
			const	contract = new ethers.Contract(
				process.env.ZAP_YEARN_VE_CRV_ADDRESS as string,
				['function calc_expected_out(address, address, uint256) public view returns (uint256)'],
				currentProvider
			);
			try {
				const	_expectedOut = await contract.calc_expected_out(_inputToken, _outputToken, _amountIn) || ethers.constants.Zero;
				return _expectedOut;
			} catch (error) {
				return (ethers.constants.Zero);
			}
		}
	}, [provider]);

	/* 🔵 - Yearn Finance ******************************************************
	** SWR hook to get the expected out for a given in/out pair with a specific
	** amount. This hook is called every 10s or when amount/in or out changes.
	** Calls the expectedOutFetcher callback.
	**************************************************************************/
	const	{data: expectedOut} = useSWR(isActive && amount.raw.gt(0) ? [
		selectedOptionFrom.value,
		selectedOptionTo.value,
		amount.raw
	] : null, expectedOutFetcher, {refreshInterval: 10000, shouldRetryOnError: false});

	/* 🔵 - Yearn Finance ******************************************************
	** Approve the spending of token A by the corresponding ZAP contract to
	** perform the swap.
	**************************************************************************/
	async function	onApproveFrom(): Promise<void> {
		if (type === 'wido') {
			new Transaction(provider, widoApproveERC20, set_txStatusApprove)
				.populate(
					toAddress(selectedOptionFrom.value),
					chainID,
					ethers.constants.MaxUint256
				)
				.onSuccess(async (): Promise<void> => {
					await refresh(); 
				})
				.perform();
			return;
		}
		
		new Transaction(provider, approveERC20, set_txStatusApprove).populate(
			toAddress(selectedOptionFrom.value),
			selectedOptionFrom.zapVia,
			ethers.constants.MaxUint256
		).onSuccess(async (): Promise<void> => {
			await refresh();
		}).perform();
	}

	/* 🔵 - Yearn Finance ******************************************************
	** Execute a zap using the ZAP contract to migrate from a token A to a
	** supported token B.
	**************************************************************************/
	async function	onZap(): Promise<void> {
		if (type === 'wido') {
			new Transaction(provider, widoZap, set_txStatusZap).populate({
				fromChainId: chainID,
				fromToken: toAddress(selectedOptionFrom.value),
				toChainId: chainID,
				toToken: toAddress(selectedOptionTo.value),
				amount: amount.raw,
				user: toAddress(address)
			}).onSuccess(async (): Promise<void> => {
				set_amount({raw: ethers.constants.Zero, normalized: 0});
				await refresh();
			}).perform();
			return;
		}

		if (selectedOptionFrom.zapVia === process.env.LPYCRV_TOKEN_ADDRESS) {
			// Direct deposit to vault from crv/yCRV Curve LP Token to lp-yCRV Vault
			new Transaction(provider, deposit, set_txStatusZap).populate(
				toAddress(selectedOptionTo.value), //destination vault
				amount.raw //amount_in
			).onSuccess(async (): Promise<void> => {
				set_amount({raw: ethers.constants.Zero, normalized: 0});
				await refresh();
			}).perform();
			return;
		}

		// Zap in
		new Transaction(provider, zap, set_txStatusZap).populate(
			toAddress(selectedOptionFrom.value), //_input_token
			toAddress(selectedOptionTo.value), //_output_token
			amount.raw, //amount_in
			expectedOut, //_min_out
			slippage
		).onSuccess(async (): Promise<void> => {
			set_amount({raw: ethers.constants.Zero, normalized: 0});
			await refresh();
		}).perform();
	}

	/* 🔵 - Yearn Finance ******************************************************
	** Set of memorized values to limit the number of re-rendering of the
	** component.
	**************************************************************************/
	const	fromVaultAPY = useMemo((): string => getVaultAPY(vaults, selectedOptionFrom.value), [vaults, selectedOptionFrom]);
	const	toVaultAPY = useMemo((): string => getVaultAPY(vaults, selectedOptionTo.value), [vaults, selectedOptionTo]);

	const	expectedOutWithSlippage = useMemo((): number => getAmountWithSlippage(
		selectedOptionFrom.value,
		selectedOptionTo.value,
		expectedOut || ethers.constants.Zero,
		slippage
	), [expectedOut, selectedOptionFrom.value, selectedOptionTo.value, slippage]);

	return (
		<CardTransactorContext.Provider
			value={{
				selectedOptionFrom,
				selectedOptionTo,
				amount,
				txStatusApprove,
				txStatusZap,
				allowanceFrom,
				fromVaultAPY,
				toVaultAPY,
				expectedOutWithSlippage,
				set_selectedOptionFrom,
				set_selectedOptionTo,
				set_amount,
				set_hasTypedSomething,
				onApproveFrom,
				onZap
			}}>
			{children}
		</CardTransactorContext.Provider>
	);
}

export const useCardTransactor = (): TCardTransactor => useContext(CardTransactorContext);
export default CardTransactorContextApp;
