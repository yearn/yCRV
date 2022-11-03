import React, {ChangeEvent, ReactElement, useEffect, useMemo, useState} from 'react';
import {ethers} from 'ethers';
import {Button} from '@yearn-finance/web-lib/components';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {format, performBatchedUpdates, toAddress} from '@yearn-finance/web-lib/utils';
import ArrowRight from 'components/icons/ArrowRight';
import {Dropdown} from 'components/TokenDropdown';
import {useYearn} from 'contexts/useYearn';
import {ChainId} from 'types';
import {getCounterValue, getSafeChainID, handleInputChange} from 'utils';
import {ZAP_OPTIONS_TO} from 'utils/zapOptions';
import {getSupportedTokens, Token} from 'wido';

import CardTransactorContextApp, {useCardTransactor} from './CardTransactorWrapper';

import type {TDropdownOption} from 'types/types.d';

const EMPTY_OPTION: TDropdownOption = {label: '', value: '', symbol: ''};

function CardAnyZapTokensSelector({optionsTo}: {
	optionsTo: TDropdownOption[];
}): ReactElement {
	const {
		possibleFroms,
		allBalances,
		selectedOptionFrom, set_selectedOptionFrom,
		selectedOptionTo, set_selectedOptionTo,
		set_amount,
		toVaultAPY,
		shouldUseWido
	} = useCardTransactor();

	/* 🔵 - Yearn Finance ******************************************************
	** useMemo to get the current possible TO vaults path for the current FROM
	**************************************************************************/
	const	possibleTo = useMemo((): TDropdownOption[] => {
		if (selectedOptionFrom.value === process.env.YCRV_CURVE_POOL_ADDRESS) {
			const possibleOptions = ZAP_OPTIONS_TO.filter((option): boolean => option.value === process.env.LPYCRV_TOKEN_ADDRESS);
			if (selectedOptionTo.value !== process.env.LPYCRV_TOKEN_ADDRESS) {
				set_selectedOptionTo(possibleOptions[0]);
			}
			return possibleOptions;
		}
		if (shouldUseWido) {
			return optionsTo;
		}
		return ZAP_OPTIONS_TO.filter((option): boolean => option.value !== selectedOptionFrom.value);
	}, [selectedOptionFrom.value, shouldUseWido, selectedOptionTo.value, set_selectedOptionTo, optionsTo]);

	return (
		<div className={'grid grid-cols-12 gap-4'}>
			<label className={'relative z-20 col-span-6 flex flex-col space-y-1 md:col-span-5'}>
				<p className={'text-base text-neutral-600'}>
					{'Select Token'}
				</p>
				<Dropdown
					defaultOption={possibleFroms[0] || EMPTY_OPTION}
					options={possibleFroms}
					selected={selectedOptionFrom || EMPTY_OPTION}
					balances={allBalances}
					onSelect={(option: TDropdownOption): void => {
						performBatchedUpdates((): void => {
							if (option.value === selectedOptionTo?.value) {
								const o = ZAP_OPTIONS_TO.find(({value}): boolean => value !== option.value);
								if (o) {
									set_selectedOptionTo(o);
								}
							}
							set_selectedOptionFrom(option);
							set_amount({
								raw: allBalances?.[toAddress(option.value)]?.raw || ethers.constants.Zero,
								normalized: allBalances?.[toAddress(option.value)]?.normalized || 0
							});
						});
					}}
					placeholder={'Select token'}
				/>
				<p className={'pl-2 !text-xs font-normal !text-green-600'}>&nbsp;</p>
			</label>

			<div className={'col-span-2 hidden items-center justify-center md:flex'}>
				<ArrowRight />
			</div>

			<label className={'relative z-10 col-span-6 flex flex-col space-y-1 md:col-span-5'}>
				<p className={'text-base text-neutral-600'}>{'Deposit to'}</p>
				<Dropdown
					defaultOption={possibleTo[0] || selectedOptionTo || EMPTY_OPTION}
					options={possibleTo}
					selected={selectedOptionTo || EMPTY_OPTION}
					onSelect={(option: TDropdownOption): void => set_selectedOptionTo(option)}
					balances={allBalances}
					placeholder={'Select token'} />
				<p className={'pl-2 !text-xs font-normal !text-green-600'}>
					{toVaultAPY}
				</p>
			</label>
		</div>
	);
}

function CardAnyZapAmountSelector(): ReactElement {
	const {isActive} = useWeb3();
	const {vaults, prices} = useYearn();
	const {
		allBalances,
		expectedOutWithSlippage,
		isValidatingExpectedOut,
		selectedOptionFrom,
		selectedOptionTo,
		amount, set_amount,
		set_hasTypedSomething
	} = useCardTransactor();

	const	ycrvPrice = useMemo((): number => (
		format.toNormalizedValue(
			format.BN(prices?.[toAddress(process.env.YCRV_TOKEN_ADDRESS)] || 0),
			6
		)
	), [prices]);

	const	ycrvCurvePoolPrice = useMemo((): number => (
		format.toNormalizedValue(
			format.BN(prices?.[toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)] || 0),
			6
		)
	), [prices]);

	return (
		<div className={'mt-0 mb-8 grid grid-cols-12 gap-4 md:mt-8 md:mb-16'}>
			<div className={'col-span-12 flex flex-col space-y-1 md:col-span-5'}>
				<p className={'text-base text-neutral-600'}>{'Amount'}</p>
				<div className={'flex h-10 items-center bg-neutral-0 p-2'}>
					<div className={'flex h-10 w-full flex-row items-center justify-between py-4 px-0'}>
						<input
							className={`w-full overflow-x-scroll border-none bg-transparent py-4 px-0 font-bold outline-none scrollbar-none ${isActive ? '' : 'cursor-not-allowed'}`}
							type={'text'}
							disabled={!isActive}
							value={amount.normalized}
							onChange={(e: ChangeEvent<HTMLInputElement>): void => {
								performBatchedUpdates((): void => {
									set_amount(handleInputChange(e, allBalances?.[toAddress(selectedOptionFrom.value)]?.decimals || 18));
									set_hasTypedSomething(true);
								});
							}} />
						<button
							onClick={(): void => {
								set_amount({
									raw: allBalances?.[toAddress(selectedOptionFrom.value)]?.raw || ethers.constants.Zero,
									normalized: allBalances?.[toAddress(selectedOptionFrom.value)]?.normalized || 0
								});
							}}
							className={'cursor-pointer bg-neutral-900 px-2 py-1 text-xs text-neutral-0 transition-colors hover:bg-neutral-700'}>
							{'Max'}
						</button>
					</div>
				</div>
				<div className={'flex flex-row items-center justify-between'}>
					<p className={'pl-2 text-xs font-normal text-neutral-600'}>
						{getCounterValue(
							amount?.normalized || 0,
							toAddress(selectedOptionFrom.value) === toAddress(process.env.YCRV_TOKEN_ADDRESS)
								? ycrvPrice || 0
								: toAddress(selectedOptionFrom.value) === toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)
									? ycrvCurvePoolPrice || 0
									: allBalances?.[toAddress(selectedOptionFrom.value)]?.normalizedPrice
										|| vaults?.[toAddress(selectedOptionFrom.value)]?.tvl?.price
										|| 0
						)}
					</p>
				</div>
			</div>

			<div className={'col-span-2 hidden items-center justify-center md:flex'}>
				<ArrowRight />
			</div>

			<div className={'col-span-12 flex flex-col space-y-1 md:col-span-5'}>
				<div>
					<p className={'hidden text-base text-neutral-600 md:block'}>
						{'You will receive minimum'}
					</p>
					<p className={'block text-base text-neutral-600 md:hidden'}>
						{'You will receive min'}
					</p>
				</div>

				<div className={'flex h-10 items-center bg-neutral-300 p-2'}>
					{isValidatingExpectedOut ?
						<div className={'relative h-10 w-full'}>
							<div className={'absolute left-3 flex h-10 items-center justify-center'}>
								<span className={'loader'} />
							</div>
						</div> :
						<b className={'overflow-x-scroll scrollbar-none'}>
							{expectedOutWithSlippage}
						</b>
					}
				</div>

				<p className={'pl-2 text-xs font-normal text-neutral-600'}>
					{getCounterValue(
						expectedOutWithSlippage,
						toAddress(selectedOptionTo.value) === toAddress(process.env.YCRV_TOKEN_ADDRESS)
							? ycrvPrice || 0
							: toAddress(selectedOptionFrom.value) === toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)
								? ycrvCurvePoolPrice || 0
								: allBalances?.[toAddress(selectedOptionTo.value)]?.normalizedPrice
							|| vaults?.[toAddress(selectedOptionTo.value)]?.tvl?.price
							|| 0
					)}
				</p>
			</div>
		</div>
	);
}

function CardAnyZapActionButton(): ReactElement {
	const {isActive} = useWeb3();
	const {
		shouldUseWido,
		txStatusApprove, txStatusZap,
		selectedOptionFrom,
		amount,
		allowanceFrom, onApproveFrom,
		onZap
	} = useCardTransactor();

	function renderButton(): ReactElement {
		if (txStatusApprove.pending || amount.raw.gt(allowanceFrom)) {
			return (
				<Button
					className={'w-full'}
					isBusy={txStatusApprove.pending}
					isDisabled={!isActive || amount.raw.isZero()}
					onClick={onApproveFrom}>
					{`Approve ${selectedOptionFrom?.label || 'token'}`}
				</Button>
			);
		}

		return (
			<Button
				onClick={onZap}
				className={'w-full'}
				isBusy={txStatusZap.pending}
				isDisabled={!isActive || amount.raw.isZero()}>
				{'Deposit'}
			</Button>
		);
	}

	return (
		<div className={'relative mb-8 md:mb-0'}>
			<div>{renderButton()}</div>
			<span className={`absolute mx-auto mt-3 flex w-full flex-row items-center justify-center transition-opacity ${shouldUseWido ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
				<a
					className={'cursor-pointer pt-2 text-center text-xs text-neutral-400/60 transition-colors hover:text-neutral-400'}
					href={'https://docs.joinwido.com/'}
					target={'_blank'}
					rel={'noreferrer'}>
					{'Powered by Wido'}
				</a>
			</span>
		</div>
	);
}

function CardAnyZap(): ReactElement {
	const {chainID} = useWeb3();
	const [optionsTo, set_optionsTo] = useState<TDropdownOption[]>([]);
	const safeChainID = useMemo((): number => getSafeChainID(chainID), [chainID]);

	useEffect((): void => {
		const fetchSupportedTokens = async (): Promise<void> => {
			const widoSupportedTokens: Token[] = await getSupportedTokens({chainId: [safeChainID as ChainId]});
			const widoSupportedTokenAddresses = new Set(
				widoSupportedTokens.map(({address}): string => toAddress(address))
			);

			const widoSupportedZapTo = ZAP_OPTIONS_TO.filter(
				({value}): boolean => widoSupportedTokenAddresses.has(toAddress(value))
			);
			set_optionsTo(widoSupportedZapTo);
		};

		fetchSupportedTokens();
	}, [safeChainID]);

	return (
		<>
			<CardAnyZapTokensSelector optionsTo={optionsTo} />
			<CardAnyZapAmountSelector />
			<CardAnyZapActionButton />
		</>
	);
}

function	WithCardTransactor(): ReactElement {
	return (
		<CardTransactorContextApp defaultOptionFrom={{label: '', value: '', symbol: ''}}>
			<>
				<div className={'hidden w-[808px] bg-neutral-100 p-4 md:py-14 md:px-16 lg:block'}>
					<CardAnyZap />
				</div>
				<div className={'w-full bg-neutral-100 p-4 md:p-8 lg:hidden'}>
					<CardAnyZap />
				</div>
			</>
		</CardTransactorContextApp>
	);
}
export default WithCardTransactor;
