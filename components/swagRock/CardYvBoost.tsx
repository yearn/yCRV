import	React, {ReactElement}						from	'react';
import	Image										from	'next/image';
import	{motion}									from	'framer-motion';
import	{ethers}									from	'ethers';
import	{Button, Input}								from	'@yearn-finance/web-lib/components';
import	{format, performBatchedUpdates, toAddress,
	Transaction, defaultTxStatus}					from	'@yearn-finance/web-lib/utils';
import	{useWeb3}									from	'@yearn-finance/web-lib/contexts';
import	{useWallet}									from	'contexts/useWallet';
import	{useYearn}									from	'contexts/useYearn';
import	{Dropdown}									from	'components/TokenDropdown';
import	{CardVariantsInner, CardVariants}			from	'utils/animations';
import	{approveERC20}								from	'utils/actions/approveToken';
import	{max, allowanceKey}							from	'utils';
import	{TDropdownOption, TNormalizedBN}			from	'types/types';

const	options: TDropdownOption[] = [{
	label: 'yveCRV',
	value: toAddress(process.env.YVECRV_TOKEN_ADDRESS as string),
	icon: (
		<Image
			width={24}
			height={24}
			src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.YVECRV_TOKEN_ADDRESS)}/logo-128.png`}
			loading={'eager'}
			priority />
	)
}, {
	label: 'CRV',
	value: toAddress(process.env.CRV_TOKEN_ADDRESS as string),
	icon: (
		<Image
			width={24}
			height={24}
			src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.CRV_TOKEN_ADDRESS)}/logo-128.png`} />
	)
}, {
	label: 'cvxCRV',
	value: toAddress(process.env.CVXCRV_TOKEN_ADDRESS as string),
	icon: (
		<Image
			width={24}
			height={24}
			src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.CVXCRV_TOKEN_ADDRESS)}/logo-128.png`} />
	)
}];

function	CardYvBoost(): ReactElement {
	const	{provider, isActive} = useWeb3();
	const	{balances, allowances, refresh} = useWallet();
	const	{yvBoostData} = useYearn();
	const	[selectedOption, set_selectedOption] = React.useState(options[0]);
	const	[amount, set_amount] = React.useState<TNormalizedBN>({raw: ethers.constants.Zero, normalized: 0});
	const	[txStatusApprove, set_txStatusApprove] = React.useState(defaultTxStatus);

	const	maxAmount = React.useMemo((): TNormalizedBN => {
		if (!isActive) {
			return ({raw: ethers.constants.Zero, normalized: 0});
		}
		return ({
			raw: balances[toAddress(selectedOption.value as string)].raw,
			normalized: balances[toAddress(selectedOption.value as string)].normalized
		});
	}, [balances, selectedOption, isActive]);

	async function	onApproveZap(): Promise<void> {
		new Transaction(provider, approveERC20, set_txStatusApprove).populate(
			selectedOption.value as string,
			process.env.ZAP_YEARN_VE_CRV_ADDRESS as string,
			max(amount.raw, balances[toAddress(selectedOption.value as string)].raw)
		).onSuccess(async (): Promise<void> => {
			await refresh();
		}).perform();
	}

	function	renderButton(): ReactElement {
		const	selectedAllowance = allowances[allowanceKey(selectedOption.value, process.env.ZAP_YEARN_VE_CRV_ADDRESS)] || ethers.constants.Zero;
		const	selectedAmount = amount.raw;

		if (!txStatusApprove.pending && (txStatusApprove.success || (selectedAllowance.gte(selectedAmount)) && selectedAmount.gt(0))) {
			return (
				<Button
					className={'w-full'}
					isDisabled={!isActive || amount.raw.isZero()}>
					{'Stake'}
				</Button>
			);	
		}
		return (
			<Button
				onClick={onApproveZap}
				className={'w-full'}
				isBusy={txStatusApprove.pending}
				isDisabled={!isActive || amount.raw.isZero()}>
				{`Approve ${selectedOption.label}`}
			</Button>
		);
	}

	return (
		<motion.div
			initial={'rest'} whileHover={'hover'} animate={'rest'}
			variants={CardVariants as any}
			custom={!txStatusApprove.none}
			className={'flex h-[784px] w-[440px] items-center justify-end'}>
			<motion.div
				variants={CardVariantsInner as any}
				custom={!txStatusApprove.none}
				className={'h-[752px] w-[416px] bg-neutral-100 p-12'}>
				<div aria-label={'card title'} className={'flex flex-col pb-8'}>
					<h2 className={'text-3xl font-bold'}>{'Rock'}</h2>
					<h2 className={'text-3xl font-bold'}>{'with yvBoost'}</h2>
				</div>

				<div aria-label={'vault data'} className={'mb-6 grid grid-cols-12 gap-4'}>
					<div className={'col-span-8'}>
						<p className={'mb-2'}>{'Vault Balance'}</p>
						<b className={'text-lg'}>
							{format.amount(balances[toAddress(process.env.YVBOOST_TOKEN_ADDRESS)].normalized, 0, 8)}
						</b>
					</div>
					<div className={'col-span-4'}>
						<p className={'mb-2'}>{'APY'}</p>
						<b className={'text-lg'}>
							{yvBoostData ? `${format.amount(yvBoostData.apy.net_apy * 100, 2, 2)}%` : '-'}
						</b>
					</div>
					<div className={'col-span-6'}>
						<p className={'mb-2'}>{'Earnings'}</p>
						<b className={'text-lg'}>{'4854.78545'}</b>
					</div>
				</div>
					
				<div aria-label={'card title'} className={'mb-7 space-y-4'}>
					<div>
						<label className={'yearn--input'}>
							<p className={'text-base text-neutral-600'}>{'Select token'}</p>
							<Dropdown
								defaultOption={options[0]}
								options={options}
								selected={selectedOption}
								onSelect={(option: TDropdownOption): void => {
									performBatchedUpdates((): void => {
										set_selectedOption(option);
										set_amount({
											raw: balances[toAddress(option.value as string)].raw,
											normalized: balances[toAddress(option.value as string)].normalized
										});
									});
								}} />
							<p className={'!text-xs font-normal text-neutral-600/0 opacity-0'}>{'-'}</p>
						</label>
					</div>
					<div>
						<label className={'yearn--input mb-4'}>
							<p className={'text-base text-neutral-600'}>{'Amount'}</p>
							<Input
								value={amount.normalized}
								type={'number'}
								readOnly={!isActive || !txStatusApprove.none}
								min={0}
								onChange={(s: unknown): void => {
									const	bnAmount = ethers.utils.parseUnits((s || '0') as string, 18);
									if (bnAmount.gt(balances[toAddress(selectedOption.value as string)].raw)) {
										set_amount(maxAmount);
									} else if (bnAmount.isNegative()) {
										set_amount({raw: ethers.constants.Zero, normalized: 0});
									} else {
										set_amount({raw: bnAmount, normalized: s as number});
									}
								}}
								placeholder={'0.00000000'} />
							<p
								onClick={(): void => {
									if (!isActive || !txStatusApprove.none)
										return;
									if (balances[toAddress((selectedOption || options[0]).value as string)].raw.isZero())
										return;
									set_amount(maxAmount);
								}}
								className={`pl-2 !text-xs font-normal text-neutral-600 ${balances[toAddress((selectedOption || options[0]).value as string)].raw.isZero() ? 'cursor-default' : 'cursor-pointer'}`}>
								{
									balances[toAddress((selectedOption || options[0]).value as string)].symbol === '' ? 
										'-' :
										`You have ${format.amount(balances[toAddress((selectedOption || options[0]).value as string)].normalized, 0, 8)}`
								}
							</p>
						</label>
					</div>
					<div>
						<label className={'yveCRV--input mb-4'}>
							<p className={'text-base text-neutral-600'}>{'You will receive'}</p>
							<div className={'h-10 bg-neutral-0 p-2 text-base font-bold'}>
								{'7451'}
							</div>
						</label>
					</div>
				</div>

				<div aria-label={'card actions'}>
					<div className={'mb-4'}>
						<p className={'text-xs'}>{'Note: irreversable operation'}</p>
					</div>
					<div className={'mb-3'}>
						{renderButton()}
						{/* onApproveZap */}
						{/* <Button className={'w-full'}>
							{'Stake'}
						</Button> */}
					</div>
				</div>

			</motion.div>
		</motion.div>
	);
}

export default CardYvBoost;
