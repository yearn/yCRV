import React, {createContext, ReactElement, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import Image from 'next/image';
import {BigNumber, ethers} from 'ethers';
import useSWR from 'swr';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {defaultTxStatus, format, performBatchedUpdates, providers, toAddress, Transaction} from '@yearn-finance/web-lib/utils';
import {useWallet} from 'contexts/useWallet';
import {useYearn} from 'contexts/useYearn';
import {allowanceKey, getAmountWithSlippage, getSafeChainID, getVaultAPY} from 'utils';
import {approveERC20, widoApproveERC20} from 'utils/actions/approveToken';
import {deposit} from 'utils/actions/deposit';
import {widoAllowance} from 'utils/actions/widoAllowance';
import {widoQuote} from 'utils/actions/widoQuote';
import {widoZap} from 'utils/actions/widoZap';
import {zap} from 'utils/actions/zap';
import {LEGACY_OPTIONS_FROM, LEGACY_OPTIONS_TO, ZAP_OPTIONS_FROM, ZAP_OPTIONS_TO} from 'utils/zapOptions';
import {ChainId, getBalances} from 'wido';

import type {Dict, TDropdownOption, TNormalizedBN, TSimplifiedBalanceData} from 'types/types';
import type {Balance} from 'wido';

type TCardTransactor = {
	shouldUseWido: boolean;
	allBalances: Dict<TSimplifiedBalanceData>;
	possibleFroms: TDropdownOption[];
	selectedOptionFrom: TDropdownOption,
	selectedOptionTo: TDropdownOption,
	amount: TNormalizedBN,
	txStatusApprove: typeof defaultTxStatus,
	txStatusZap: typeof defaultTxStatus,
	allowanceFrom: BigNumber,
	fromVaultAPY: string,
	toVaultAPY: string,
	expectedOutWithSlippage: number,
	isValidatingExpectedOut: boolean,
	set_selectedOptionFrom: (option: TDropdownOption) => void,
	set_selectedOptionTo: (option: TDropdownOption) => void,
	set_amount: (amount: TNormalizedBN) => void,
	set_hasTypedSomething: (hasTypedSomething: boolean) => void,
	onApproveFrom: () => void,
	onZap: () => void
}

const		CardTransactorContext = createContext<TCardTransactor>({
	shouldUseWido: false,
	allBalances: {},
	possibleFroms: ZAP_OPTIONS_FROM,
	selectedOptionFrom: LEGACY_OPTIONS_FROM[0],
	selectedOptionTo: LEGACY_OPTIONS_TO[0],
	amount: {raw: ethers.constants.Zero, normalized: 0},
	txStatusApprove: defaultTxStatus,
	txStatusZap: defaultTxStatus,
	allowanceFrom: ethers.constants.Zero,
	fromVaultAPY: '',
	toVaultAPY: '',
	expectedOutWithSlippage: 0,
	isValidatingExpectedOut: false,
	set_selectedOptionFrom: (): void => undefined,
	set_selectedOptionTo: (): void => undefined,
	set_amount: (): void => undefined,
	set_hasTypedSomething: (): void => undefined,
	onApproveFrom: (): void => undefined,
	onZap: (): void => undefined
});

type TProps = {
	defaultOptionFrom?: TDropdownOption,
	defaultOptionTo?: TDropdownOption,
	children?: ReactElement | null,
}

const WIDO_RANKING = {
	[toAddress(process.env.CRV_TOKEN_ADDRESS)]: 1,
	[toAddress(process.env.YCRV_TOKEN_ADDRESS)]: 2,
	[toAddress(process.env.YVBOOST_TOKEN_ADDRESS)]: 3,
	[toAddress(process.env.YVECRV_TOKEN_ADDRESS)]: 4,
	[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]: 5,
	[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]: 6,
	[toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)]: 7,
	[toAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')]: 8 // eth
};

function	CardTransactorContextApp({
	defaultOptionFrom = LEGACY_OPTIONS_FROM[0],
	defaultOptionTo = LEGACY_OPTIONS_TO[0],
	children = null
}: TProps): ReactElement {
	const	{provider, chainID, isActive, address} = useWeb3();
	const	{allowances, useWalletNonce, balances, refresh, slippage} = useWallet();
	const	{vaults} = useYearn();
	const	[allBalances, set_allBalances] = useState<Dict<TSimplifiedBalanceData>>({});
	const	[txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const	[txStatusZap, set_txStatusZap] = useState(defaultTxStatus);
	const	[selectedOptionFrom, set_selectedOptionFrom] = useState(defaultOptionFrom);
	const	[selectedOptionTo, set_selectedOptionTo] = useState(defaultOptionTo);
	const	[amount, set_amount] = useState<TNormalizedBN>({raw: ethers.constants.Zero, normalized: 0});
	const	[hasTypedSomething, set_hasTypedSomething] = useState(false);
	const 	[allowanceFrom, set_allowanceFrom] = useState<BigNumber>(ethers.constants.Zero);
	const	[possibleFroms, set_possibleFroms] = useState<TDropdownOption[]>([]);
	const	safeChainID = useMemo((): number => getSafeChainID(chainID), [chainID]);

	const shouldUseWido = useMemo((): boolean => {
		const	useYearnArrFrom = [
			toAddress(process.env.YVBOOST_TOKEN_ADDRESS),
			toAddress(process.env.YVECRV_TOKEN_ADDRESS),
			toAddress(process.env.CRV_TOKEN_ADDRESS),
			toAddress(process.env.YCRV_CURVE_POOL_ADDRESS),
			toAddress(process.env.STYCRV_TOKEN_ADDRESS),
			toAddress(process.env.YCRV_TOKEN_ADDRESS),
			toAddress(process.env.LPYCRV_TOKEN_ADDRESS),
			'',
			ethers.constants.AddressZero
		];
		if (useYearnArrFrom.includes(toAddress(selectedOptionFrom.value))) {
			return false;
		}
		return true;
	}, [selectedOptionFrom]);

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

	/* 🔵 - Yearn Finance ******************************************************
	** useEffect to set the current allowance for the selected token based on
	** the type of swap that will be performed (Wido, Yearn or Vault deposit).
	**************************************************************************/
	useEffect((): void => {
		const fetchWidoTokenAllowance = async (): Promise<void> => {
			const allowance = await widoAllowance({
				chainId: safeChainID as ChainId,
				accountAddress: address,
				tokenAddress: selectedOptionFrom.value
			});
			set_allowanceFrom(BigNumber.from(allowance));
		};
		
		if (isActive && amount.raw.gt(0) && shouldUseWido) {
			fetchWidoTokenAllowance();
		}

		if (!shouldUseWido) {
			useWalletNonce; // remove warning
			const allowance = allowances[allowanceKey(selectedOptionFrom.value, selectedOptionFrom.zapVia)];
			set_allowanceFrom(allowance || ethers.constants.Zero);
		}
	}, [address, allowances, amount.raw, isActive, safeChainID, selectedOptionFrom.value, selectedOptionFrom.zapVia, shouldUseWido, useWalletNonce]);

	/* 🔵 - Yearn Finance ******************************************************
	** useEffect to fetch the balances from Wido, as long as the possible from
	** tokens (if balance > 0)
	**************************************************************************/
	const widoTokensFetcher = useCallback(async (): Promise<void> => {
		if (!balances || Object.values(balances).length === 0) {
			return;
		}

		const optionsFromAsObject: Dict<TDropdownOption> = {};
		//Exclude yCRV specific tokens
		for (const optionFrom of ZAP_OPTIONS_FROM) {
			optionsFromAsObject[toAddress(optionFrom.value)] = optionFrom;
		}

		const widoSupportedTokens = await getBalances(address, [safeChainID as ChainId]);
		const widoOptionsFrom = widoSupportedTokens
			.filter((option: Balance): boolean => !optionsFromAsObject[toAddress(option.address)])
			.map(({name, symbol, address, logoURI}): TDropdownOption & {rank: number} => {
				return ({
					label: name,
					symbol: symbol,
					value: toAddress(address),
					rank: WIDO_RANKING[toAddress(address)] ?? Number.MAX_SAFE_INTEGER,
					icon: (
						<Image
							alt={name}
							width={24}
							height={24}
							src={logoURI} />
					)
				});
			}).sort((a, b): number => a.rank - b.rank);

		const widoTokens: Dict<TSimplifiedBalanceData> = {};
		for (const token of widoSupportedTokens) {
			widoTokens[toAddress(token.address)] = {
				decimals: token.decimals,
				symbol: token.symbol,
				raw: BigNumber.from(token.balance),
				normalized: Number(ethers.utils.formatUnits(token.balance, token.decimals)),
				normalizedPrice: Number(token.usdPrice)
			};
		}

		if (widoOptionsFrom.length > 0) {
			const	_possibleFromsYearnInWallet = [];
			const	_possibleFromsYearnNotInWallet = [];
			for (const option of ZAP_OPTIONS_FROM) {
				if (balances[toAddress(option.value)]?.raw.gt(0)) {
					_possibleFromsYearnInWallet.push(option);
				} else {
					_possibleFromsYearnNotInWallet.push(option);
				}
			}
			const	_possibleFroms = [..._possibleFromsYearnInWallet, ...widoOptionsFrom, ..._possibleFromsYearnNotInWallet];
			const	_allBalances = {...balances, ...widoTokens};

			performBatchedUpdates((): void => {
				set_allBalances(_allBalances);
				set_possibleFroms(_possibleFroms);
				set_selectedOptionFrom((s): TDropdownOption => s.value === '' ? _possibleFroms?.[0] : s);
				if (_possibleFroms?.[0].value === selectedOptionTo?.value) {
					set_selectedOptionTo(ZAP_OPTIONS_TO.find((o: TDropdownOption): boolean => o.value !== _possibleFroms?.[0].value) as TDropdownOption);
				}
			});
		}
	}, [address, balances, safeChainID, selectedOptionTo?.value]);
	useEffect((): void => {
		widoTokensFetcher();
	}, [widoTokensFetcher]);

	/* 🔵 - Yearn Finance ******************************************************
	** Perform a smartContract call to the ZAP contract to get the expected
	** out for a given in/out pair with a specific amount. This callback is
	** called every 10s or when amount/in or out changes.
	**************************************************************************/
	const expectedOutFetcher = useCallback(async (
		_inputToken: string,
		_outputToken: string,
		_amountIn: BigNumber
	): Promise<{raw: BigNumber, normalized: number}> => {
		if (shouldUseWido) {
			try {
				const request = {
					fromChainId: safeChainID as ChainId,
					fromToken: _inputToken,
					toChainId: safeChainID as ChainId,
					toToken: _outputToken,
					amount: _amountIn.toString(),
					user: address
				};
				const {toTokenAmount, expectedSlippage} = await widoQuote(request);
				return ({
					raw: format.BN(toTokenAmount),
					normalized: getAmountWithSlippage(
						selectedOptionFrom.value,
						selectedOptionTo.value,
						format.BN(toTokenAmount),
						Number(expectedSlippage || 0)
					)
				});
			} catch (error) {
				return ({raw: ethers.constants.Zero, normalized: 0});
			}
		}

		const	currentProvider = provider || providers.getProvider(1);
		if (_inputToken === toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)) {
			// Direct deposit to vault from crv/yCRV Curve LP Token to lp-yCRV Vault
			const	contract = new ethers.Contract(
				process.env.LPYCRV_TOKEN_ADDRESS,
				['function pricePerShare() public view returns (uint256)'],
				currentProvider
			);
			try {
				const	pps = await contract.pricePerShare() || ethers.constants.Zero;
				const	_expectedOut = _amountIn.mul(pps).div(ethers.constants.WeiPerEther);
				return ({
					raw: _expectedOut,
					normalized: getAmountWithSlippage(
						selectedOptionFrom.value,
						selectedOptionTo.value,
						_expectedOut,
						slippage
					)
				});
			} catch (error) {
				return ({raw: ethers.constants.Zero, normalized: 0});
			}
		} else {
			// Zap in
			const	contract = new ethers.Contract(
				process.env.ZAP_YEARN_VE_CRV_ADDRESS,
				['function calc_expected_out(address, address, uint256) public view returns (uint256)'],
				currentProvider
			);
			try {
				const	_expectedOut = await contract.calc_expected_out(_inputToken, _outputToken, _amountIn) || ethers.constants.Zero;
				return ({
					raw: _expectedOut,
					normalized: getAmountWithSlippage(
						selectedOptionFrom.value,
						selectedOptionTo.value,
						_expectedOut,
						slippage
					)
				});
			} catch (error) {
				return ({raw: ethers.constants.Zero, normalized: 0});
			}
		}
	}, [address, provider, safeChainID, selectedOptionFrom.value, selectedOptionTo.value, shouldUseWido, slippage]);

	/* 🔵 - Yearn Finance ******************************************************
	** SWR hook to get the expected out for a given in/out pair with a specific
	** amount. This hook is called every 10s or when amount/in or out changes.
	** Calls the expectedOutFetcher callback.
	**************************************************************************/
	const	{data: expectedOut, isValidating: isValidatingExpectedOut} = useSWR(isActive && amount.raw.gt(0) ? [
		selectedOptionFrom.value,
		selectedOptionTo.value,
		amount.raw
	] : null, expectedOutFetcher, {refreshInterval: 10000, shouldRetryOnError: false});

	/* 🔵 - Yearn Finance ******************************************************
	** Approve the spending of token A by the corresponding ZAP contract to
	** perform the swap.
	**************************************************************************/
	async function	onApproveFrom(): Promise<void> {
		if (shouldUseWido) {
			new Transaction(provider, widoApproveERC20, set_txStatusApprove)
				.populate(
					toAddress(selectedOptionFrom.value),
					safeChainID,
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
		if (shouldUseWido) {
			new Transaction(provider, widoZap, set_txStatusZap).populate({
				fromChainId: safeChainID,
				fromToken: toAddress(selectedOptionFrom.value),
				toChainId: safeChainID,
				toToken: toAddress(selectedOptionTo.value),
				amount: amount.raw,
				user: toAddress(address)
			}).onSuccess(async (): Promise<void> => {
				const _balances = await refresh();
				set_amount({
					raw: _balances[toAddress(selectedOptionFrom.value)]?.raw || ethers.constants.Zero,
					normalized: _balances[toAddress(selectedOptionFrom.value)]?.normalized || 0
				});
			}).perform();
			return;
		}

		if (selectedOptionFrom.zapVia === process.env.LPYCRV_TOKEN_ADDRESS) {
			// Direct deposit to vault from crv/yCRV Curve LP Token to lp-yCRV Vault
			new Transaction(provider, deposit, set_txStatusZap).populate(
				toAddress(selectedOptionTo.value), //destination vault
				amount.raw //amount_in
			).onSuccess(async (): Promise<void> => {
				const _balances = await refresh();
				set_amount({
					raw: _balances[toAddress(selectedOptionFrom.value)]?.raw || ethers.constants.Zero,
					normalized: _balances[toAddress(selectedOptionFrom.value)]?.normalized || 0
				});
			}).perform();
			return;
		}

		// Zap in
		new Transaction(provider, zap, set_txStatusZap).populate(
			toAddress(selectedOptionFrom.value), //_input_token
			toAddress(selectedOptionTo.value), //_output_token
			amount.raw, //amount_in
			expectedOut?.raw, //_min_out
			slippage
		).onSuccess(async (): Promise<void> => {
			const _balances = await refresh();
			set_amount({
				raw: _balances[toAddress(selectedOptionFrom.value)]?.raw || ethers.constants.Zero,
				normalized: _balances[toAddress(selectedOptionFrom.value)]?.normalized || 0
			});
		}).perform();
	}

	/* 🔵 - Yearn Finance ******************************************************
	** Set of memorized values to limit the number of re-rendering of the
	** component.
	**************************************************************************/
	const	fromVaultAPY = useMemo((): string => getVaultAPY(vaults, selectedOptionFrom.value), [vaults, selectedOptionFrom]);
	const	toVaultAPY = useMemo((): string => getVaultAPY(vaults, selectedOptionTo.value), [vaults, selectedOptionTo]);

	return (
		<CardTransactorContext.Provider
			value={{
				shouldUseWido,
				possibleFroms,
				selectedOptionFrom,
				selectedOptionTo,
				allBalances,
				amount,
				txStatusApprove,
				txStatusZap,
				allowanceFrom,
				fromVaultAPY,
				toVaultAPY,
				expectedOutWithSlippage: expectedOut?.normalized || 0,
				isValidatingExpectedOut: isValidatingExpectedOut,
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
