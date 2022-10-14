/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
	ChangeEvent,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';
import {motion} from 'framer-motion';
import {BigNumber, ethers} from 'ethers';
import {Button} from '@yearn-finance/web-lib/components';
import {
	performBatchedUpdates,
	toAddress
} from '@yearn-finance/web-lib/utils';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {Dropdown} from 'components/TokenDropdown';
import ArrowDown from 'components/icons/ArrowDown';
import {CardVariants, CardVariantsInner} from 'utils/animations';
import {ZAP_OPTIONS_TO} from 'utils/zapOptions';
import {ChainId, QuoteResult, Token, getBalances, getSupportedTokens} from 'wido';
import {TDropdownOption} from 'types/types';
import Image from 'next/image';
import {useWallet} from 'contexts/useWallet';
import {widoQuote} from 'utils/actions/widoQuote';
import useSWR from 'swr';
import CardTransactorContextApp, {useCardTransactor} from './CardTransactorWrapper';
import {getCounterValue, handleInputChange} from 'utils';
import {formatWithSlippage} from 'utils/formatWithSlippage';
import {useYearn} from 'contexts/useYearn';

type	TBalanceData = {
	address: string
	decimals: number,
	symbol: string,
	raw: BigNumber,
	normalized: number,
	normalizedPrice: number,
}

type	TWidoToken = {
	address: string,
	balance: string,
	balanceUsdValue: string,
	chainId: number,
	decimals: number,
	logoURI: string,
	name: string,
	symbol: string,
	usdPrice: number,
}

function CardAnyZap(): ReactElement {
	const	ADDRESS = '0x6568d65a8CB74A21F8cd7F6832E71Ab1E390f25E'; // TODO debugging

	const	{chainID, isActive} = useWeb3();
	const	{vaults, ycrvPrice, ycrvCurvePoolPrice} = useYearn();
	const	{balances} = useWallet();
	const	[widoBalances, set_widoBalances] = useState<TBalanceData[]>([]);
	const	{
		txStatusApprove, txStatusZap,
		selectedOptionFrom, set_selectedOptionFrom,
		selectedOptionTo, set_selectedOptionTo,
		amount, set_amount,
		set_hasTypedSomething,
		toVaultAPY, expectedOutWithSlippage,
		allowanceFrom, onApproveFrom, onZap
	} = useCardTransactor();
	const [optionsFrom, set_optionsFrom] = useState<TDropdownOption[]>([]);
	const [optionsTo, set_optionsTo] = useState<TDropdownOption[]>([]);
	const [quote, set_quote] = useState<QuoteResult>();

	
	const getWidoSupportedTokens = useCallback(async(): Promise<void> => {
		const _widoSupportedTokensRaw = (await getBalances(ADDRESS, [chainID]));
		const _widoSupportedTokens = _widoSupportedTokensRaw as unknown as TWidoToken[];
		set_widoBalances(
			_widoSupportedTokens.map((token: TWidoToken): TBalanceData => {
				return {
					address: toAddress(token.address),
					decimals: token.decimals,
					symbol: token.symbol,
					raw: BigNumber.from(token.balance),
					normalized: Number(ethers.utils.formatUnits(token.balance, token.decimals)),
					normalizedPrice: token.usdPrice
				};
			})
		);
	}, [ADDRESS, chainID]);

	useEffect((): void => {
		if (isActive) {
			getWidoSupportedTokens();
		}
	}, [isActive, getWidoSupportedTokens]);

	const	allBalances = useMemo((): {[key: string]: TBalanceData} => {
		const	_balances = balances as unknown as {[key: string]: TBalanceData};
		const	_allBalances = {..._balances};
		widoBalances.forEach((token: TBalanceData): void => {
			_allBalances[token.address] = token;
		});
		return _allBalances;
	}, [balances, widoBalances]);

	useEffect((): void => {
		const fetchBalances = async (): Promise<void> => {
			const widoSupportedTokens = await getBalances(ADDRESS, [chainID]);

			set_optionsFrom(widoSupportedTokens.map(({name, address, logoURI}): TDropdownOption => ({
				label: name,
				value: toAddress(address),
				icon: (
					<Image
						alt={name}
						width={24}
						height={24}
						src={logoURI}
					/>
				)
			})));
		};

		fetchBalances();
	}, [ADDRESS, chainID]);

	useEffect((): void => {
		const fetchSupportedTokens = async (): Promise<void> => {
			const widoSupportedTokens: Token[] = await getSupportedTokens({
				chainId: [chainID]
			});

			const widoSupportedTokenAddresses = new Set(
				widoSupportedTokens.map(({address}): string => toAddress(address))
			);

			const widoSupportedZapTo = ZAP_OPTIONS_TO.filter(
				({value}): boolean => widoSupportedTokenAddresses.has(toAddress(value as string))
			);

			set_optionsTo(widoSupportedZapTo);
		};

		fetchSupportedTokens();
	}, [chainID]);

	const widoQuoteFetcher = useCallback(async (
		fromChainId: ChainId,
		fromToken: string,
		toChainId: ChainId,
		toToken: string,
		amount: string,
		user: string
	): Promise<{
		toTokenAmount: BigNumber;
		toTokenAmountUsdValue: string;
		expectedSlippage?: string;
	}> => {
		try {
			const request = {fromChainId, fromToken, toChainId, toToken, amount, user};
			const {toTokenAmount, toTokenAmountUsdValue, expectedSlippage} = await widoQuote(request);
			return {
				toTokenAmount: BigNumber.from(toTokenAmount || 0),
				toTokenAmountUsdValue: toTokenAmountUsdValue || '0.00',
				expectedSlippage
			};
		} catch (error) {
			return {toTokenAmount: ethers.constants.Zero, toTokenAmountUsdValue: '0.00'};
		}
	}, []);

	const	{data: widoQuoteResponse, isValidating} = useSWR(isActive && amount.raw.gt(0) ? [
		chainID,
		selectedOptionFrom?.value,
		chainID,
		selectedOptionTo?.value,
		amount.raw.toString(),
		ADDRESS
	] : null, widoQuoteFetcher, {refreshInterval: 10000, shouldRetryOnError: false});

	function renderButton(): ReactElement {
		return (
			<Button
				onClick={async (): Promise<void> => {
					set_quote(quote);
				}}
				className={'w-full'}
				disabled={!selectedOptionFrom || !selectedOptionTo}
			>
				{'Get Quote (debugging only)'}
			</Button>
		);

		if (txStatusApprove.pending || amount.raw.gt(allowanceFrom)) {
			return (
				<Button
					className={'w-full'}
					isBusy={txStatusApprove.pending}
					isDisabled={!isActive || amount.raw.isZero()}
					onClick={(): void => {
						onApproveFrom(true);
					}}>
					{`Approve ${selectedOptionFrom?.label || 'token'}`}
				</Button>
			);
		}

		return (
			<Button
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				onClick={(): void => {}}
				className={'w-full'}
				isBusy={txStatusZap.pending}
				isDisabled={!isActive || amount.raw.isZero()}
			>
				{'Swap'}
			</Button>
		);
	}

	return (
		<>
			<div aria-label={'card title'} className={'flex flex-col pb-8'}>
				<h2 className={'text-3xl font-bold'}>{'Anyzap'}</h2>
			</div>
			<div
				aria-label={'card description'}
				className={'w-full pb-10 md:w-[96%]'}
			>
				<p className={'text-neutral-600'}>{'description'}</p>
			</div>

			<div className={'grid grid-cols-2 gap-4'}>
				<label className={'relative z-20 flex flex-col space-y-1'}>
					<p className={'text-base text-neutral-600'}>
						{'Swap from'}
					</p>
					<Dropdown
						options={optionsFrom}
						selected={selectedOptionFrom}
						onSelect={(option: TDropdownOption): void => {
							performBatchedUpdates((): void => {
								if (option.value === selectedOptionTo?.value) {
									const o = ZAP_OPTIONS_TO.find(({value}): boolean => value !== option.value);
									if (o) set_selectedOptionTo(o);
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
					<p className={'pl-2 !text-xs font-normal !text-green-600'}>
						{'TODO'}
					</p>
				</label>
				<div className={'flex flex-col space-y-1'}>
					<p className={'text-base text-neutral-600'}>{'Amount'}</p>
					<div className={'flex h-10 items-center bg-neutral-300 p-2'}>
						<div className={'flex h-10 flex-row items-center justify-between bg-neutral-300 py-4 px-0'}>
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
								className={'cursor-pointer text-sm text-neutral-500 transition-colors hover:text-neutral-900'}>
								{'max'}
							</button>
						</div>
					</div>
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

			<div className={'mt-2 mb-4 hidden grid-cols-2 gap-4 md:grid lg:mt-8 lg:mb-10'}>
				<div className={'flex items-center justify-center'}>
					<ArrowDown />
				</div>
				<div className={'flex items-center justify-center'}>
					<ArrowDown />
				</div>
			</div>

			<div className={'mt-4 mb-8 grid grid-cols-2 gap-4 md:mt-0'}>
				<label className={'relative z-10 flex flex-col space-y-1'}>
					<p className={'text-base text-neutral-600'}>{'Swap to'}</p>
					<Dropdown
						options={optionsTo.filter((option: TDropdownOption): boolean =>option.value !== selectedOptionFrom?.value)}
						selected={selectedOptionTo}
						onSelect={(option: TDropdownOption): void => set_selectedOptionTo(option)}
						placeholder={'Select token'} />
					<p className={'pl-2 !text-xs font-normal !text-green-600'}>
						{toVaultAPY}
					</p>
				</label>
				<div className={'flex flex-col space-y-1'}>
					<div>
						<p className={'hidden text-base text-neutral-600 md:block'}>
							{'You will receive minimum'}
						</p>
						<p className={'block text-base text-neutral-600 md:hidden'}>
							{'You will receive min'}
						</p>
					</div>
					<div className={'flex h-10 items-center bg-neutral-300 p-2'}>
						{isValidating ?
							<div className={'relative h-10 w-full'}>
								<div className={'absolute left-3 flex h-10 items-center justify-center'}>
									<span className={'loader'} />
								</div>
							</div> :
							<b className={'overflow-x-scroll scrollbar-none'}>
								{formatWithSlippage({
									value: widoQuoteResponse?.toTokenAmount || ethers.constants.Zero,
									addressFrom: toAddress(selectedOptionFrom?.value as string),
									addressTo: toAddress(selectedOptionTo?.value as string),
									slippage: Number(widoQuoteResponse?.expectedSlippage || 0)
								})}
							</b>
						}
					</div>
					<p className={'pl-2 text-xs font-normal text-neutral-600'}>
						{isValidating ? '$ -' : `$${widoQuoteResponse?.toTokenAmountUsdValue || '0.00'}`}
					</p>
				</div>
			</div>

			<div aria-label={'card actions'}>
				<div className={'mb-3'}>{renderButton()}</div>
			</div>
		</>
	);
}

function CardAnyZapWrapper(): ReactElement {
	const {txStatusApprove, txStatusZap} = useCardTransactor();

	return (
		<div>
			<motion.div
				initial={'rest'}
				whileHover={'hover'}
				animate={'rest'}
				variants={CardVariants as never}
				className={'hidden h-[733px] w-[592px] items-center justify-end lg:flex'}
				custom={!txStatusApprove.none || !txStatusZap.none}>
				<motion.div
					variants={CardVariantsInner as never}
					custom={!txStatusApprove.none || !txStatusZap.none}
					className={'h-[701px] w-[560px] bg-neutral-100 p-12'}>
					<CardAnyZap />
				</motion.div>
			</motion.div>
			<div className={'w-full bg-neutral-100 p-4 md:p-8 lg:hidden'}>
				<CardAnyZap />
			</div>
		</div>
	);
}

function	WithCardTransactor(): ReactElement {
	return (
		<CardTransactorContextApp>
			<CardAnyZapWrapper />
		</CardTransactorContextApp>
	);
}
export default WithCardTransactor;
