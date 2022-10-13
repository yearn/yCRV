/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState
} from 'react';
import {motion} from 'framer-motion';
import {BigNumber, ethers} from 'ethers';
import {Button} from '@yearn-finance/web-lib/components';
import {TTxStatus,
	Transaction,
	defaultTxStatus,
	performBatchedUpdates,
	toAddress
} from '@yearn-finance/web-lib/utils';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {Dropdown} from 'components/TokenDropdown';
import ArrowDown from 'components/icons/ArrowDown';
import {CardVariants, CardVariantsInner} from 'utils/animations';
import {formatWithSlippage} from 'utils/formatWithSlippage';
import {ZAP_OPTIONS_TO} from 'utils/zapOptions';
import {ChainId, QuoteResult, Token, getBalances, getSupportedTokens} from 'wido';
import {TDropdownOption, TNormalizedBN} from 'types/types';
import Image from 'next/image';
import {allowanceKey} from 'utils';
import {useWallet} from 'contexts/useWallet';
import {widoApproveERC20} from 'utils/actions/approveToken';
import {widoQuote} from 'utils/actions/widoQuote';
import useSWR from 'swr';

type TCardAnyZapProps = {
	txStatusApprove: TTxStatus;
	txStatusZap: TTxStatus;
	set_txStatusApprove: Dispatch<SetStateAction<TTxStatus>>;
	set_txStatusZap: Dispatch<SetStateAction<TTxStatus>>;
};

type TBalances = {
	[address: string]: {
		raw: BigNumber;
		balanceUsdValue: string;
		decimals: number;
		normalized: BigNumber;
	};
};

function CardAnyZap({
	txStatusApprove,
	set_txStatusApprove,
	txStatusZap,
	set_txStatusZap
}: TCardAnyZapProps): ReactElement {
	const {chainID, isActive, provider} = useWeb3();
	const {allowances, useWalletNonce, refresh} = useWallet();
	const [optionsFrom, set_optionsFrom] = useState<TDropdownOption[]>([]);
	const [optionsTo, set_optionsTo] = useState<TDropdownOption[]>([]);
	const [selectedOptionFrom, set_selectedOptionFrom] = useState<TDropdownOption>();
	const [selectedOptionTo, set_selectedOptionTo] = useState<TDropdownOption>();
	const [balances, set_balances] = useState<TBalances>();
	const [amount, set_amount] = useState<Pick<TNormalizedBN, 'raw'>>({raw: ethers.constants.Zero});
	const [quote, set_quote] = useState<QuoteResult>();

	const ADDRESS = '0x6568d65a8CB74A21F8cd7F6832E71Ab1E390f25E'; // TODO debugging

	useEffect((): void => {
		if (isActive && amount.raw.eq(0) && balances) {
			set_amount({raw: balances[toAddress(selectedOptionFrom?.value as string)]?.raw || ethers.constants.Zero});
		} else if (!isActive && amount.raw.gt(0)) {
			set_amount({raw: ethers.constants.Zero});
		}
	}, [isActive, selectedOptionFrom, balances, amount.raw]);

	useEffect((): void => {
		const fetchBalances = async (): Promise<void> => {
			const widoSupportedTokens = await getBalances(ADDRESS, [chainID]);
			set_balances(widoSupportedTokens.reduce((prev, curr): TBalances => ({
				...prev,
				[curr.address]: {
					raw: BigNumber.from(curr.balance),
					decimals: curr.decimals,
					balanceUsdValue: curr.balanceUsdValue
				}}), {})
			);

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

	// TODO
	const allowanceFrom = useMemo((): BigNumber => {
		useWalletNonce; // remove warning
		return (
			allowances[
				allowanceKey(
					selectedOptionFrom?.value as string,
					process.env.ZAP_YEARN_VE_CRV_ADDRESS
				)
			] || ethers.constants.Zero
		);
	}, [allowances, useWalletNonce, selectedOptionFrom?.value]);

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

	const	{data: widoQuoteResponse} = useSWR(isActive && amount.raw.gt(0) ? [
		chainID,
		selectedOptionFrom?.value,
		chainID,
		selectedOptionTo?.value,
		amount.raw.toString(),
		ADDRESS
	] : null, widoQuoteFetcher, {refreshInterval: 10000, shouldRetryOnError: false});

	async function onApproveFrom(): Promise<void> {
		new Transaction(provider, widoApproveERC20, set_txStatusApprove)
			.populate(
				toAddress(selectedOptionFrom?.value as string),
				chainID,
				ethers.constants.MaxUint256
			)
			.onSuccess(async (): Promise<void> => {
				await refresh(); 
			})
			.perform();
	}

	async function onZap(): Promise<void> {
		return;
	}

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
					onClick={onApproveFrom}
					className={'w-full'}
					isBusy={txStatusApprove.pending}
					isDisabled={!isActive || amount.raw.isZero()}
				>
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
								set_amount({raw: balances?.[toAddress(option.value as string)]?.raw || ethers.constants.Zero});
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
						<b className={'overflow-x-scroll scrollbar-none'}>
							{Number(ethers.utils.formatUnits(
								balances?.[toAddress(selectedOptionFrom?.value as string)]?.raw || ethers.constants.Zero, 
								balances?.[toAddress(selectedOptionFrom?.value as string)]?.decimals || 18
							))}
						</b>
					</div>
					<p className={'pl-2 text-xs font-normal text-neutral-600'}>
						{`$${balances?.[toAddress(selectedOptionFrom?.value as string)]?.balanceUsdValue || '0.00'}`}
					</p>
				</div>
			</div>

			<div
				className={
					'mt-2 mb-4 hidden grid-cols-2 gap-4 md:grid lg:mt-8 lg:mb-10'
				}
			>
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
						options={optionsTo.filter(
							(option: TDropdownOption): boolean =>
								option.value !== selectedOptionFrom?.value
						)}
						selected={selectedOptionTo}
						onSelect={(option: TDropdownOption): void =>
							set_selectedOptionTo(option)
						}
						placeholder={'Select token'}
					/>
					<p className={'pl-2 !text-xs font-normal !text-green-600'}>
						{'TODO'}
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
						<b className={'overflow-x-scroll scrollbar-none'}>
							{formatWithSlippage({
								value: widoQuoteResponse?.toTokenAmount || ethers.constants.Zero,
								addressFrom: toAddress(selectedOptionFrom?.value as string),
								addressTo: toAddress(selectedOptionTo?.value as string),
								slippage: Number(widoQuoteResponse?.expectedSlippage)
							})}
						</b>
					</div>
					<p className={'pl-2 text-xs font-normal text-neutral-600'}>
						{`$${widoQuoteResponse?.toTokenAmountUsdValue || '0.00'}`}
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
	const [txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const [txStatusZap, set_txStatusZap] = useState(defaultTxStatus);

	return (
		<div>
			<motion.div
				initial={'rest'}
				whileHover={'hover'}
				animate={'rest'}
				variants={CardVariants as never}
				className={'hidden h-[733px] w-[592px] items-center justify-end lg:flex'}
				custom={!txStatusApprove.none || !txStatusZap.none}
			>
				<motion.div
					variants={CardVariantsInner as never}
					custom={!txStatusApprove.none || !txStatusZap.none}
					className={'h-[701px] w-[560px] bg-neutral-100 p-12'}
				>
					<CardAnyZap
						txStatusApprove={txStatusApprove}
						txStatusZap={txStatusZap}
						set_txStatusApprove={set_txStatusApprove}
						set_txStatusZap={set_txStatusZap}
					/>
				</motion.div>
			</motion.div>
			<div className={'w-full bg-neutral-100 p-4 md:p-8 lg:hidden'}>
				<CardAnyZap
					txStatusApprove={txStatusApprove}
					txStatusZap={txStatusZap}
					set_txStatusApprove={set_txStatusApprove}
					set_txStatusZap={set_txStatusZap}
				/>
			</div>
		</div>
	);
}

export default CardAnyZapWrapper;
