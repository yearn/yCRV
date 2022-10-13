import React, {Dispatch, ReactElement, SetStateAction, useCallback, useEffect, useMemo, useState} from 'react';
import {motion} from 'framer-motion';
import {BigNumber, ethers} from 'ethers';
import useSWR from 'swr';
import {Button} from '@yearn-finance/web-lib/components';
import {TTxStatus, Transaction, defaultTxStatus, format, performBatchedUpdates, providers, toAddress} from '@yearn-finance/web-lib/utils';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {Dropdown} from 'components/TokenDropdown';
import ArrowDown from 'components/icons/ArrowDown';
import {useWallet} from 'contexts/useWallet';
import {useYearn} from 'contexts/useYearn';
import {approveERC20} from 'utils/actions/approveToken';
import {zap} from 'utils/actions/zap';
import {CardVariants, CardVariantsInner} from 'utils/animations';
import {LEGACY_OPTIONS_FROM, LEGACY_OPTIONS_TO} from 'utils/zapOptions';
import {allowanceKey, getCounterValue} from 'utils';
import {TDropdownOption, TNormalizedBN} from 'types/types';

type TCardMigrateProps = {
	txStatusApprove: TTxStatus;
	txStatusZap: TTxStatus;
	set_txStatusApprove: Dispatch<SetStateAction<TTxStatus>>;
	set_txStatusZap: Dispatch<SetStateAction<TTxStatus>>;
};


function	CardMigrateLegacy({
	txStatusApprove,
	set_txStatusApprove,
	txStatusZap,
	set_txStatusZap
}: TCardMigrateProps): ReactElement {
	const	{provider, isActive} = useWeb3();
	const	{balances, allowances, useWalletNonce, refresh, slippage} = useWallet();
	const	{vaults, ycrvPrice} = useYearn();
	const	[selectedOptionFrom, set_selectedOptionFrom] = useState(LEGACY_OPTIONS_FROM[0]);
	const	[selectedOptionTo, set_selectedOptionTo] = useState(LEGACY_OPTIONS_TO[0]);
	const	[shouldLockResetBalances, set_shouldLockResetBalances] = useState(false);
	const	[amount, set_amount] = useState<TNormalizedBN>({raw: ethers.constants.Zero, normalized: 0});

	/* 🔵 - Yearn Finance ******************************************************
	** useEffect to set the amount to the max amount of the selected token once
	** the wallet is connected, or to 0 if the wallet is disconnected.
	**************************************************************************/
	useEffect((): void => {
		if (isActive && amount.raw.eq(0) && !shouldLockResetBalances) {
			set_amount({
				raw: balances[toAddress(selectedOptionFrom.value as string)]?.raw || ethers.constants.Zero,
				normalized: balances[toAddress(selectedOptionFrom.value as string)]?.normalized || 0
			});
		} else if (!isActive && amount.raw.gt(0)) {
			set_amount({raw: ethers.constants.Zero, normalized: 0});
		}
	}, [isActive, selectedOptionFrom, balances, amount.raw, shouldLockResetBalances]);


	/* 🔵 - Yearn Finance ******************************************************
	** useMemo to get the allowance of the selected token from the wallet.
	** useWalletNonce is used to trigger a refresh because of array dependency.
	**************************************************************************/
	const	allowanceFrom = useMemo((): BigNumber => {
		useWalletNonce; // remove warning
		return allowances[allowanceKey(selectedOptionFrom.value as string, process.env.ZAP_YEARN_VE_CRV_ADDRESS)] || ethers.constants.Zero;
	}, [allowances, useWalletNonce, selectedOptionFrom.value]);


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


	async function	onApproveFrom(): Promise<void> {
		new Transaction(provider, approveERC20, set_txStatusApprove).populate(
			toAddress(selectedOptionFrom.value as string),
			process.env.ZAP_YEARN_VE_CRV_ADDRESS as string,
			ethers.constants.MaxUint256
		).onSuccess(async (): Promise<void> => {
			await refresh();
		}).perform();
	}

	async function	onZap(): Promise<void> {
		set_shouldLockResetBalances(true);
		new Transaction(provider, zap, set_txStatusZap).populate(
			toAddress(selectedOptionFrom.value as string), //_input_token
			toAddress(selectedOptionTo.value as string), //_output_token
			amount.raw, //amount_in
			expectedOut, //_min_out
			slippage
		).onSuccess(async (): Promise<void> => {
			set_amount({raw: ethers.constants.Zero, normalized: 0});
			await refresh();
			set_shouldLockResetBalances(false);
		}).perform();
	}

	function	renderButton(): ReactElement {
		if (txStatusApprove.pending || (amount.raw).gt(allowanceFrom)) {
			return (
				<Button
					onClick={onApproveFrom}
					className={'w-full'}
					isBusy={txStatusApprove.pending}
					isDisabled={!isActive || (amount.raw).isZero()}>
					{`Approve ${selectedOptionFrom?.label || 'token'}`}
				</Button>
			);	
		}

		return (
			<Button
				onClick={onZap}
				className={'w-full'}
				isBusy={txStatusZap.pending}
				isDisabled={!isActive || (amount.raw).isZero()}>
				{'Migrate'}
			</Button>
		);
	}

	const	toVaultAPY = useMemo((): string => {
		if (!vaults?.[toAddress(selectedOptionTo.value as string)]) {
			return '';
		}

		if (selectedOptionTo.value == toAddress(process.env.STYCRV_TOKEN_ADDRESS)) {
			return 'APY ~56.00%';
		}

		if (vaults?.[toAddress(selectedOptionTo.value as string)]?.apy?.net_apy)
			return `APY ${format.amount((vaults?.[toAddress(selectedOptionTo.value as string)]?.apy?.net_apy || 0) * 100, 2, 2)}%`;

		return 'APY 0.00%';
	}, [vaults, selectedOptionTo]);

	function	formatWithSlippage(value: BigNumber): number {
		const	minAmountStr = Number(ethers.utils.formatUnits(value || ethers.constants.Zero, 18));
		const	minAmountWithSlippage = ethers.utils.parseUnits((minAmountStr * (1 - (slippage / 100))).toFixed(18), 18);
		return format.toNormalizedValue(minAmountWithSlippage || ethers.constants.Zero, 18);
	}

	return (
		<>
			<div aria-label={'card title'} className={'flex flex-col pb-8'}>
				<h2 className={'text-3xl font-bold'}>{'Out with the old,'}</h2>
				<h2 className={'text-3xl font-bold'}>{'in with the new'}</h2>
			</div>
			<div aria-label={'card description'} className={'w-[98%] pb-10'}>
				<p className={'text-neutral-600'}>{'yveCRV and yvBOOST are no longer supported (RIP), but you can easily migrate them to our new and improved tokens. Simply convert below and start earning that sweet sweet yield.'}</p>
			</div>

			<div className={'grid grid-cols-2 gap-4'}>
				<label className={'relative z-20 flex flex-col space-y-1'}>
					<p className={'text-base text-neutral-600'}>{'Select Legacy Token'}</p>
					<Dropdown
						defaultOption={LEGACY_OPTIONS_FROM[0]}
						options={LEGACY_OPTIONS_FROM}
						selected={selectedOptionFrom}
						onSelect={(option: TDropdownOption): void => {
							performBatchedUpdates((): void => {
								set_selectedOptionFrom(option);
								set_amount({
									raw: balances[toAddress(option.value as string)]?.raw || ethers.constants.Zero,
									normalized: balances[toAddress(option.value as string)]?.normalized || 0
								});
							});
						}} />
					<p className={'pl-2 !text-xs font-normal text-green-600'}>
						{'APY 0.00%'}
					</p>
				</label>
				<div className={'flex flex-col space-y-1'}>
					<p className={'text-base text-neutral-600'}>{'Amount'}</p>
					<div className={'flex h-10 items-center bg-neutral-300 p-2'}>
						<b className={'overflow-x-scroll scrollbar-none'}>
							{amount.normalized}
						</b>
					</div>
					<p className={'pl-2 text-xs font-normal text-neutral-600'}>
						{getCounterValue(
							amount?.normalized || 0,
							toAddress(selectedOptionFrom.value as string) === toAddress(process.env.YCRV_TOKEN_ADDRESS)
								? ycrvPrice || 0
								: balances?.[toAddress(selectedOptionFrom.value as string)]?.normalizedPrice
									|| vaults?.[toAddress(selectedOptionFrom.value as string)]?.tvl?.price
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
					<p className={'text-base text-neutral-600'}>{'Migrate To'}</p>
					<Dropdown
						defaultOption={LEGACY_OPTIONS_TO[0]}
						options={LEGACY_OPTIONS_TO}
						selected={selectedOptionTo}
						onSelect={(option: TDropdownOption): void => set_selectedOptionTo(option)} />
					<p className={'pl-2 !text-xs font-normal !text-green-600'}>
						{toVaultAPY}
					</p>
				</label>
				<div className={'flex flex-col space-y-1'}>
					<div>
						<p className={'hidden text-base text-neutral-600 md:block'}>{'You will receive minimum'}</p>
						<p className={'block text-base text-neutral-600 md:hidden'}>{'You will receive min'}</p>
					</div>
					<div className={'flex h-10 items-center text-clip bg-neutral-300 p-2'}>
						<b className={'overflow-x-scroll scrollbar-none'}>
							{formatWithSlippage(expectedOut || ethers.constants.Zero)}
						</b>
					</div>
					<p className={'pl-2 text-xs font-normal text-neutral-600'}>
						{getCounterValue(
							formatWithSlippage(expectedOut || ethers.constants.Zero) || 0,
							toAddress(selectedOptionTo.value as string) === toAddress(process.env.YCRV_TOKEN_ADDRESS)
								? ycrvPrice || 0
								: balances?.[toAddress(selectedOptionTo.value as string)]?.normalizedPrice
									|| vaults?.[toAddress(selectedOptionTo.value as string)]?.tvl?.price
									|| 0
						)}
					</p>
				</div>
			</div>

			<div aria-label={'card actions'}>
				<div className={'mb-3'}>
					{renderButton()}
				</div>
			</div>
		</>
	);
}

function	CardMigrateLegacyWrapper(): ReactElement {
	const	[txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const	[txStatusZap, set_txStatusZap] = useState(defaultTxStatus);

	return (
		<div>
			<motion.div
				initial={'rest'} whileHover={'hover'} animate={'rest'}
				variants={CardVariants as never}
				className={'hidden h-[733px] w-[592px] items-center justify-start lg:flex'}
				custom={!txStatusApprove.none || !txStatusZap.none}>
				<motion.div
					variants={CardVariantsInner as never}
					custom={!txStatusApprove.none || !txStatusZap.none}
					className={'h-[701px] w-[560px] bg-neutral-100 p-12'}>
					<CardMigrateLegacy
						txStatusApprove={txStatusApprove}
						txStatusZap={txStatusZap}
						set_txStatusApprove={set_txStatusApprove}
						set_txStatusZap={set_txStatusZap} />
				</motion.div>
			</motion.div>
			<div className={'w-full bg-neutral-100 p-4 md:p-8 lg:hidden'}>
				<CardMigrateLegacy
					txStatusApprove={txStatusApprove}
					txStatusZap={txStatusZap}
					set_txStatusApprove={set_txStatusApprove}
					set_txStatusZap={set_txStatusZap} />
			</div>
		</div>
	);
}


export default CardMigrateLegacyWrapper;
