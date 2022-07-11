import	React, {ReactElement}				from	'react';
import	{motion}							from	'framer-motion';
import	{BigNumber, ethers}					from	'ethers';
import	{Contract}							from	'ethcall';
import	useSWR								from	'swr';
import	{Button, Input}						from	'@yearn-finance/web-lib/components';
import	{format, providers, toAddress,
	Transaction, defaultTxStatus}			from	'@yearn-finance/web-lib/utils';
import	{useWeb3}							from	'@yearn-finance/web-lib/contexts';
import	{useWallet}							from	'contexts/useWallet';
import	{useYearn}							from	'contexts/useYearn';
import	{approveERC20}						from	'utils/actions/approveToken';
import	{addLiquidity}						from	'utils/actions/addLiquidityLP';
import	{CardVariantsInner, CardVariants}	from	'utils/animations';
import	YVECRVLP_ABI						from	'utils/abi/yveCRVLP.abi';
import	{max, allowanceKey}					from	'utils';
import	{TNormalizedBN}						from	'types/types';

function	BonusSlippage({
	amount1In = ethers.constants.One,
	amount2In = ethers.constants.Zero,
	virtualPrice = ethers.constants.Zero,
	tokenAmount = ethers.constants.Zero
}): ReactElement {
	const	slippage = React.useMemo((): number => {
		if (tokenAmount.isZero()) {
			return (0);
		}
		const	vf = format.toNormalizedValue(virtualPrice, 18) * format.toNormalizedValue(tokenAmount, 18);
		const	vt = (amount1In.add(amount2In));
		const	vi = format.toNormalizedValue(vt.isZero() ? ethers.constants.One : vt, 18);
		return ((vf - vi) / vi * 100);
	}, [amount1In, amount2In, virtualPrice, tokenAmount]);

	return (
		<div className={'mb-4'}>
			<p className={'text-xs'}>{`Bonus slippage ${format.amount(slippage, 2, 3)}%`}</p>
		</div>
	);
}

function	CardYveCRV(): ReactElement {
	const	{provider, isActive} = useWeb3();
	const	{balances, allowances, refresh, yveCRVClaimable} = useWallet();
	const	{yveCRVData} = useYearn();
	const	[yveCrvAmount, set_yveCrvAmount] = React.useState<TNormalizedBN>({raw: ethers.constants.Zero, normalized: ''});
	const	[crvAmount, set_crvAmount] = React.useState<TNormalizedBN>({raw: ethers.constants.Zero, normalized: ''});
	const	[txStatusApproveYveCrv, set_txStatusApproveYveCrv] = React.useState(defaultTxStatus);
	const	[txStatusApproveCrv, set_txStatusApproveCrv] = React.useState(defaultTxStatus);
	const	[txStatusAddLiquidity, set_txStatusAddLiquidity] = React.useState(defaultTxStatus);

	const fetcher = React.useCallback(async (amount1: BigNumber, amount2: BigNumber): Promise<{virtualPrice: BigNumber, tokenAmount: BigNumber}> => {
		const	currentProvider = provider || providers.getProvider(1);
		const	ethcallProvider = await providers.newEthCallProvider(currentProvider);
		const	yveCRVLPContract = new Contract(process.env.YVECRV_POOL_LP_ADDRESS as string, YVECRVLP_ABI);
		const	[virtualPrice, tokenAmount] = await ethcallProvider.tryAll([
			yveCRVLPContract.get_virtual_price(),
			yveCRVLPContract.calc_token_amount([amount1, amount2], true)
		]) as [BigNumber, BigNumber];
		return ({virtualPrice, tokenAmount});
	}, [provider]);

	const	{data: lpData} = useSWR(isActive && (yveCrvAmount.raw.gt(0) || crvAmount.raw.gt(0)) ? [yveCrvAmount.raw, crvAmount.raw] : null, fetcher, {refreshInterval: 10000, shouldRetryOnError: false});

	const	maxAmountYveCrv = React.useMemo((): TNormalizedBN => {
		if (!isActive) {
			return ({raw: ethers.constants.Zero, normalized: 0});
		}
		return ({
			raw: balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].raw,
			normalized: balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].normalized
		});
	}, [balances, isActive]);

	const	maxAmountCrv = React.useMemo((): TNormalizedBN => {
		if (!isActive) {
			return ({raw: ethers.constants.Zero, normalized: 0});
		}
		return ({
			raw: balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].raw,
			normalized: balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].normalized
		});
	}, [balances, isActive]);

	async function	onApproveYveCRV(): Promise<void> {
		new Transaction(provider, approveERC20, set_txStatusApproveYveCrv).populate(
			toAddress(process.env.YVECRV_TOKEN_ADDRESS),
			process.env.YVECRV_POOL_LP_ADDRESS as string,
			max(yveCrvAmount.raw, balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].raw)
		).onSuccess(async (): Promise<void> => {
			await refresh();
		}).perform();
	}

	async function	onApproveCrv(): Promise<void> {
		new Transaction(provider, approveERC20, set_txStatusApproveCrv).populate(
			toAddress(process.env.CRV_TOKEN_ADDRESS),
			process.env.YVECRV_POOL_LP_ADDRESS as string,
			max(crvAmount.raw, balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].raw)
		).onSuccess(async (): Promise<void> => {
			await refresh();
		}).perform();
	}

	async function	onAddLiquidity(): Promise<void> {
		new Transaction(provider, addLiquidity, set_txStatusAddLiquidity).populate(
			format.toSafeAmount(format.units(crvAmount.raw), balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].raw, 18),
			format.toSafeAmount(format.units(yveCrvAmount.raw), balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].raw, 18),
			lpData?.tokenAmount
		).onSuccess(async (): Promise<void> => {
			await refresh();
		}).perform();
	}

	function	renderButton(): ReactElement {
		const	selectedAllowanceForYveCRV = allowances[allowanceKey(process.env.YVECRV_TOKEN_ADDRESS, process.env.YVECRV_POOL_LP_ADDRESS)] || ethers.constants.Zero;
		const	selectedAmountForYveCRV = yveCrvAmount.raw;

		if (txStatusApproveYveCrv.pending || selectedAmountForYveCRV.gt(selectedAllowanceForYveCRV)) {
			return (
				<Button
					onClick={onApproveYveCRV}
					className={'w-full'}
					isBusy={txStatusApproveYveCrv.pending}
					isDisabled={!isActive || yveCrvAmount.raw.isZero()}>
					{'Approve yveCRV'}
				</Button>
			);	
		}

		const	selectedAllowanceForCrv = allowances[allowanceKey(process.env.CRV_TOKEN_ADDRESS, process.env.YVECRV_POOL_LP_ADDRESS)] || ethers.constants.Zero;
		const	selectedAmountForCrv = crvAmount.raw;
		if (txStatusApproveCrv.pending || selectedAmountForCrv.gt(selectedAllowanceForCrv)) {
			return (
				<Button
					onClick={onApproveCrv}
					className={'w-full'}
					isBusy={txStatusApproveCrv.pending}
					isDisabled={!isActive || crvAmount.raw.isZero()}>
					{'Approve CRV'}
				</Button>
			);	
		}

		return (
			<Button
				onClick={onAddLiquidity}
				className={'w-full'}
				isBusy={txStatusAddLiquidity.pending}
				isDisabled={
					!isActive
					|| selectedAmountForYveCRV.isZero()
					|| selectedAmountForCrv.isZero()
				}>
				{'Stake'}
			</Button>
		);
	}

	return (
		<motion.div
			initial={'rest'} whileHover={'hover'} animate={'rest'}
			variants={CardVariants as any}
			className={'flex h-[784px] w-[440px] items-center justify-start'}
			custom={!txStatusApproveYveCrv.none || !txStatusApproveCrv.none || !txStatusAddLiquidity.none}>
			<motion.div
				variants={CardVariantsInner as any}
				custom={!txStatusApproveYveCrv.none || !txStatusApproveCrv.none || !txStatusAddLiquidity.none}
				className={'h-[752px] w-[416px] bg-neutral-100 p-12'}>
				<div aria-label={'card title'} className={'flex flex-col pb-8'}>
					<h2 className={'text-3xl font-bold'}>{'Swag'}</h2>
					<h2 className={'text-3xl font-bold'}>{'with yveCRV LP'}</h2>
				</div>
					
				<div aria-label={'vault data'} className={'mb-6 grid grid-cols-12 gap-4'}>
					<div className={'col-span-8'}>
						<p className={'mb-2'}>{'Vault Balance'}</p>
						<b className={'text-lg'}>
							{format.amount(balances[toAddress(process.env.YVECRV_POOL_LP_ADDRESS)].normalized, 8, 8)}
						</b>
					</div>
					<div className={'col-span-4'}>
						<p className={'mb-2'}>{'APY'}</p>
						<b className={'text-lg'}>
							{yveCRVData ? `${format.amount(yveCRVData.apy.net_apy * 100, 2, 2)}%` : '-'}
						</b>
					</div>
					<div className={'col-span-6'}>
						<p className={'mb-2'}>{'Claimable'}</p>
						<b className={'text-lg'}>
							{yveCRVClaimable ? `${format.amount(yveCRVClaimable.normalized * balances[toAddress(process.env.THREECRV_TOKEN_ADDRESS)].normalizedPrice, 2, 2)} $` : '-'}
						</b>
					</div>
				</div>
					
				<div aria-label={'yvecrv input'} className={'mb-7 space-y-4'}>
					<div>
						<label className={'yearn--input'}>
							<p className={'text-base text-neutral-600'}>{'yveCRV'}</p>
							<Input
								value={(yveCrvAmount.normalized).toString().replace(/^(0+)[^.,123456789]/, '0')}
								type={'number'}
								readOnly={!isActive || !txStatusApproveYveCrv.none}
								min={0}
								onChange={(s: unknown): void => {
									const	bnAmount = ethers.utils.parseUnits((s || '0') as string, 18);
									if (bnAmount.gt(balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].raw)) {
										set_yveCrvAmount(maxAmountYveCrv);
									} else if (bnAmount.isNegative()) {
										set_yveCrvAmount({raw: ethers.constants.Zero, normalized: 0});
									} else {
										console.log('here');
										console.warn(s);
										set_yveCrvAmount({raw: bnAmount, normalized: s as number});
									}
								}}
								placeholder={'0.00000000'} />
							<p
								onClick={(): void => {
									if (!isActive || !txStatusApproveYveCrv.none)
										return;
									if (balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].raw.isZero())
										return;
									set_yveCrvAmount(maxAmountYveCrv);
								}}
								className={`pl-2 !text-xs font-normal text-neutral-600 ${balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].raw.isZero() ? 'cursor-default' : 'cursor-pointer'}`}>
								{
									balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].symbol === '' ? 
										'-' :
										`You have ${format.amount(balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].normalized, 0, 8)}`
								}
							</p>
						</label>
					</div>
					<div>
						<label className={'yearn--input mb-4'}>
							<p className={'text-base text-neutral-600'}>{'CRV'}</p>
							<Input
								value={(crvAmount.normalized).toString().replace(/^(0+)[^.,123456789]/, '0')}
								type={'number'}
								readOnly={!isActive || !txStatusApproveCrv.none}
								min={0}
								onChange={(s: unknown): void => {
									const	bnAmount = ethers.utils.parseUnits((s || '0') as string, 18);
									if (bnAmount.gt(balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].raw)) {
										set_crvAmount(maxAmountCrv);
									} else if (bnAmount.isNegative()) {
										set_crvAmount({raw: ethers.constants.Zero, normalized: 0});
									} else {
										set_crvAmount({raw: bnAmount, normalized: s as number});
									}
								}}
								placeholder={'0.00000000'} />
							<p
								onClick={(): void => {
									if (!isActive || !txStatusApproveCrv.none)
										return;
									if (balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].raw.isZero())
										return;
									set_crvAmount(maxAmountCrv);
								}}
								className={`pl-2 !text-xs font-normal text-neutral-600 ${balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].raw.isZero() ? 'cursor-default' : 'cursor-pointer'}`}>
								{
									balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].symbol === '' ? 
										'-' :
										`You have ${format.amount(balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].normalized, 0, 8)}`
								}
							</p>
						</label>
					</div>
					<div>
						<label className={'yveCRV--input mb-4'}>
							<p className={'text-base text-neutral-600'}>{'You will receive'}</p>
							<div className={'relative h-10 bg-neutral-0 p-2 text-base font-bold'}>
								{yveCrvAmount.raw.isZero() && crvAmount.raw.isZero() ? '-' : (
									<p className={`${!lpData?.tokenAmount ? 'invisible' : ''}`}>
										{lpData?.tokenAmount ? format.bigNumberAsAmount(lpData?.tokenAmount, 18, 8, 'LP yveCRV') : ''}
									</p>	
								)}
								<div className={`pointer-events-none absolute inset-0 flex h-full flex-row items-center space-x-1 p-2 ${(yveCrvAmount.raw.isZero() && crvAmount.raw.isZero()) || lpData?.tokenAmount ? 'invisible' : 'visible'}`}>
									<div className={'h-2 w-2 animate-pulse rounded-full bg-neutral-400'} />
									<div className={'animate-pulse-half h-2 w-2 rounded-full bg-neutral-400'} />
									<div className={'h-2 w-2 animate-pulse rounded-full bg-neutral-400'} />
								</div>
							</div>
						</label>
					</div>
				</div>

				<div aria-label={'card actions'}>
					<BonusSlippage
						amount1In={yveCrvAmount.raw}
						amount2In={crvAmount.raw}
						virtualPrice={lpData?.virtualPrice}
						tokenAmount={lpData?.tokenAmount} />
					<div className={'mb-3'}>
						{renderButton()}
					</div>
					<div className={'flex justify-center'}>
						<button className={'text-center text-xs text-neutral-500'}>{'Withdraw'}</button>
					</div>
				</div>

			</motion.div>
		</motion.div>
	);
}

export default CardYveCRV;
