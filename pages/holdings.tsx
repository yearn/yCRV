import React, {ReactElement, useCallback, useMemo} from 'react';
import {BigNumber, ethers} from 'ethers';
import {Contract} from 'ethcall';
import useSWR from 'swr';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {format, providers, toAddress} from '@yearn-finance/web-lib/utils';
import ValueAnimation from 'components/ValueAnimation';
import {useYearn} from 'contexts/useYearn';
import {useWallet} from 'contexts/useWallet';
import YVECRV_ABI from 'utils/abi/yveCRV.abi';
import CURVE_CRV_YCRV_LP_ABI from 'utils/abi/curveCrvYCrvLp.abi';
import {getCounterValue, getCounterValueRaw, getVaultAPY} from 'utils';

function	Stats(): ReactElement {
	const	{provider} = useWeb3();
	const	{balances} = useWallet();
	const	{vaults, ycrvPrice} = useYearn();

	/* 🔵 - Yearn Finance ******************************************************
	** SWR hook to get the expected out for a given in/out pair with a specific
	** amount. This hook is called every 10s or when amount/in or out changes.
	** Calls the expectedOutFetcher callback.
	**************************************************************************/
	const numbersFetchers = useCallback(async (): Promise<{[key: string]: BigNumber}> => {
		const	currentProvider = provider || providers.getProvider(1);
		const	ethcallProvider = await providers.newEthCallProvider(currentProvider);

		const	yCRVContract = new Contract(process.env.YCRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		const	styCRVContract = new Contract(process.env.STYCRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		const	lpyCRVContract = new Contract(process.env.LPYCRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		const	yveCRVContract = new Contract(process.env.YVECRV_TOKEN_ADDRESS as string, YVECRV_ABI);
		const	veEscrowContract = new Contract(process.env.VECRV_ADDRESS as string, YVECRV_ABI);
		const	crvYCRVLpContract = new Contract(process.env.YCRV_CURVE_POOL_ADDRESS as string, CURVE_CRV_YCRV_LP_ABI);

		const	[
			yveCRVTotalSupply,
			yveCRVInYCRV,
			veCRVBalance,
			yCRVTotalSupply,
			styCRVTotalSupply,
			lpyCRVTotalSupply,
			crvYCRVPeg
		] = await ethcallProvider.tryAll([
			yveCRVContract.totalSupply(),
			yveCRVContract.balanceOf(process.env.YCRV_TOKEN_ADDRESS),
			veEscrowContract.balanceOf(process.env.VECRV_YEARN_TREASURY_ADDRESS),
			yCRVContract.totalSupply(),
			styCRVContract.totalSupply(),
			lpyCRVContract.totalSupply(),
			crvYCRVLpContract.calc_withdraw_one_coin(ethers.constants.WeiPerEther, 0)
		]) as [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, BigNumber];

		return ({
			['legacy']: yveCRVTotalSupply.sub(yveCRVInYCRV),
			['treasury']: veCRVBalance.sub(yveCRVTotalSupply.sub(yveCRVInYCRV)).sub(yCRVTotalSupply),
			['yCRVSupply']: yCRVTotalSupply,
			['styCRVSupply']: styCRVTotalSupply,
			['lpyCRVSupply']: lpyCRVTotalSupply,
			['crvYCRVPeg']: crvYCRVPeg,
			[toAddress(process.env.VECRV_YEARN_TREASURY_ADDRESS)]: veCRVBalance
		});

	}, [provider]);
	const	{data} = useSWR('numbers', numbersFetchers, {refreshInterval: 10000, shouldRetryOnError: false});

	const	stCRVAPY = useMemo((): string => getVaultAPY(vaults, process.env.STYCRV_TOKEN_ADDRESS as string), [vaults]);
	const	lpCRVAPY = useMemo((): string => getVaultAPY(vaults, process.env.LPYCRV_TOKEN_ADDRESS as string), [vaults]);

	const	formatBigNumberOver10K = useCallback((v: BigNumber): string => {
		if (v.gt(ethers.constants.WeiPerEther.mul(10000))) {
			return format.amount(format.toNormalizedValue(v || 0, 18), 0, 0);
		}
		return format.amount(format.toNormalizedValue(v || 0, 18), 2, 2);
	}, []);

	const	formatNumberOver10K = useCallback((v: number): string => {
		if (v >= 10000) {
			return format.amount(v, 0, 0);
		}
		return format.amount(v, 2, 2);
	}, []);

	const	formatedYearnHas = useMemo((): string => (
		data?.[toAddress(process.env.VECRV_YEARN_TREASURY_ADDRESS)] ?
			format.amount(format.toNormalizedValue(data[toAddress(process.env.VECRV_YEARN_TREASURY_ADDRESS)], 18), 0, 0)
			: ''
	), [data]);

	const	formatedYouHave = useMemo((): string => (
		getCounterValueRaw(
			(Number(balances[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.normalized) || 0) * (vaults?.[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0)
			+
			(Number(balances[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.normalized) || 0) * (vaults?.[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0),
			1
		)
	), [balances, vaults]);

	return (
		<section className={'mt-4 grid w-full grid-cols-12 gap-y-10 pb-10 md:mt-20 md:gap-x-10 md:gap-y-20'}>

			<div className={'col-span-12 w-full md:col-span-8'}>
				<p className={'pb-2 text-lg text-neutral-900 md:pb-6 md:text-3xl'}>{'Yearn has'}</p>
				<b className={'text-4xl tabular-nums text-neutral-900 md:text-7xl'}>
					<ValueAnimation
						identifier={'veCRVTreasury'}
						value={formatedYearnHas}
						suffix={'veCRV'} />
				</b>
			</div>
			<div className={'col-span-12 w-full md:col-span-4'}>
				<p className={'pb-2 text-lg text-neutral-900 md:pb-6 md:text-3xl'}>{'You have'}</p>
				<b className={'text-3xl tabular-nums text-neutral-900 md:text-7xl'}>
					<ValueAnimation
						identifier={'youHave'}
						value={formatedYouHave ? formatedYouHave : ''}
						prefix={'$'} />
				</b>
			</div>

			<div className={'col-span-12 flex w-full flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4'}>
				<div className={'w-full bg-neutral-100 p-6 md:w-[412px] md:min-w-[412px]'}>
					<div className={'grid w-full gap-6 md:col-span-5'}>
						<div>
							<b className={'pb-2 text-3xl tabular-nums text-neutral-900'}>
								{data?.treasury ? `${formatBigNumberOver10K(data?.treasury || 0)} ` : '- '}
								<span className={'text-base tabular-nums text-neutral-600 md:text-3xl md:text-neutral-900'}>{'veCRV'}</span>
							</b>
							<p className={'text-lg text-neutral-500'}>{'Yearn Treasury'}</p>
						</div>
						<div>
							<b className={'pb-2 text-3xl tabular-nums text-neutral-900'}>
								{data?.legacy ? `${formatBigNumberOver10K(data?.legacy || 0)} ` : '- '}
								<span className={'text-base tabular-nums text-neutral-600 md:text-3xl md:text-neutral-900'}>{'yveCRV'}</span>
							</b>
							<p className={'text-lg text-neutral-500'}>{'Legacy system'}</p>
						</div>
						<div>
							<b className={'pb-2 text-3xl tabular-nums text-neutral-900'}>
								{data?.yCRVSupply ? `${formatBigNumberOver10K(data?.yCRVSupply || 0)} ` : '- '}
								<span className={'text-base tabular-nums text-neutral-600 md:text-3xl md:text-neutral-900'}>{'yCRV'}</span>
							</b>

							<p className={'text-lg text-neutral-500'}>
								{`(Price = $${(
									ycrvPrice ? format.amount(ycrvPrice, 2, 2) : '0.00'
								)} | Peg = ${(
									data?.crvYCRVPeg ? format.amount(format.toNormalizedValue(data?.crvYCRVPeg || ethers.constants.Zero, 16) * 99.85 / 100, 2, 2): '0.0000'
								)}%)`}
							</p>
						</div>
					</div>
				</div> 

				<div className={'grid w-full bg-neutral-100 p-6'}>
					<div className={'mb-6 hidden w-full grid-cols-5 md:grid'}>
						<p className={'text-base text-neutral-400'}>{'Product'}</p>
						<p className={'text-base text-neutral-400'}>{'APY'}</p>
						<p className={'text-base text-neutral-400'}>{'Total Assets'}</p>
						<p className={'text-base text-neutral-400'}>{'yCRV Deposits'}</p>
						<p className={'text-base text-neutral-400'}>{'My Balance'}</p>
					</div>

					<div className={'mb-8 grid w-full grid-cols-1 md:grid-cols-5'}>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'Product: '}</span>
							<p className={'text-base text-neutral-900'}>
								{'st-yCRV'}
							</p>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'mr-auto inline font-normal text-neutral-400 md:hidden'}>{'APY: '}</span>
							<b className={'text-base tabular-nums text-neutral-900'}>
								{stCRVAPY ? `${(stCRVAPY || '').replace('APY', '')}*` : '0.00%'}
							</b>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'Total Assets: '}</span>
							<p className={'text-base tabular-nums text-neutral-900'}>
								{data?.styCRVSupply ? getCounterValue(
									format.toNormalizedValue(data?.styCRVSupply || ethers.constants.Zero, 18),
									vaults?.[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0
								) : '0.00'}
							</p>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'yCRV Deposits: '}</span>
							<p className={'text-base tabular-nums text-neutral-900'}>
								{data?.styCRVSupply ? `${formatBigNumberOver10K(data?.styCRVSupply || 0)} ` : '0.00'}
							</p>
						</div>
						<div className={'flex flex-row items-baseline justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'My Balance: '}</span>
							<div>
								<p className={'text-base tabular-nums text-neutral-900'}>
									{balances[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.normalized ? (
										formatNumberOver10K(balances[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.normalized || 0)
									) : '0.00'}
								</p>
								<p className={'text-xs tabular-nums text-neutral-600'}>
									{balances[toAddress(process.env.STYCRV_TOKEN_ADDRESS)] ? getCounterValue(
										balances[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.normalized,
										vaults?.[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0
									) : '0.00'}
								</p>
							</div>
						</div>
					</div>


					<div className={'mb-8 grid w-full grid-cols-1 md:grid-cols-5'}>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'Product: '}</span>
							<p className={'text-base text-neutral-900'}>
								{'lp-yCRV'}
							</p>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'mr-auto inline font-normal text-neutral-400 md:hidden'}>{'APY: '}</span>
							<b className={'text-base tabular-nums text-neutral-900'}>
								{lpCRVAPY ? `${(lpCRVAPY || '').replace('APY', '')}` : '0.00%'}
							</b>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'Total Assets: '}</span>
							<p className={'text-base tabular-nums text-neutral-900'}>
								{data?.lpyCRVSupply ? getCounterValue(
									format.toNormalizedValue(data?.lpyCRVSupply || ethers.constants.Zero, 18),
									vaults?.[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0
								) : '0.00'}
							</p>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'yCRV Deposits: '}</span>
							<p className={'text-base tabular-nums text-neutral-900'}>
								{data?.lpyCRVSupply ? `${formatBigNumberOver10K(data?.lpyCRVSupply || 0)} ` : '0.00'}
							</p>
						</div>
						<div className={'flex flex-row items-baseline justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'My Balance: '}</span>
							<div>
								<p className={'text-base tabular-nums text-neutral-900'}>
									{balances[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.normalized ? (
										formatNumberOver10K(balances[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.normalized || 0)
									) : '0.00'}
								</p>
								<p className={'text-xs tabular-nums text-neutral-600'}>
									{balances[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)] ? getCounterValue(
										balances[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.normalized,
										vaults?.[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0
									) : '0.00'}
								</p>
							</div>
						</div>
					</div>

					<div className={'mb-8 grid w-full grid-cols-1 md:grid-cols-5'}>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'Product: '}</span>
							<p className={'text-base text-neutral-900'}>
								{'vl-yCRV'}
							</p>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'mr-auto inline font-normal text-neutral-400 md:hidden'}>{'APY: '}</span>
							<b className={'text-base tabular-nums text-neutral-900'}>
								{'N/A'}
							</b>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'Total Assets: '}</span>
							<p className={'text-base tabular-nums text-neutral-900'}>
								{'N/A'}
							</p>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'yCRV Deposits: '}</span>
							<p className={'text-base tabular-nums text-neutral-900'}>
								{'N/A'}
							</p>
						</div>
						<div className={'flex flex-row items-baseline justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400 md:hidden'}>{'My Balance: '}</span>
							<div>
								<p className={'text-base tabular-nums text-neutral-900'}>
									{'N/A'}
								</p>
								<p className={'text-xs tabular-nums text-neutral-600'}>
									{'N/A'}
								</p>
							</div>
						</div>
					</div>

					<div>
						<p className={'text-sm tabular-nums text-neutral-400 md:text-base'}>{'*52.24% APY: '}</p>
						<p className={'text-sm tabular-nums text-neutral-400 md:text-base'}>{'∙ 8.61% Curve Admin Fees (3.6x boost)'}</p>
						<p className={'text-sm tabular-nums text-neutral-400 md:text-base'}>{'∙ 43.63% Gauge Voting Bribes'}</p>
					</div>
				</div>
			</div>

		</section>
	);
}

export default Stats;
