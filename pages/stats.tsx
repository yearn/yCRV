import React, {ReactElement, useCallback, useMemo} from 'react';
import {useWeb3} from '@yearn-finance/web-lib';
import useSWR from 'swr';
import {format, providers, toAddress} from '@yearn-finance/web-lib/utils';
import {BigNumber, ethers} from 'ethers';
import {Contract} from 'ethcall';
import YVECRV_ABI from 'utils/abi/yveCRV.abi';
import CURVE_CRV_YCRV_LP_ABI from 'utils/abi/curveCrvYCrvLp.abi';
import {useYearn} from 'contexts/useYearn';
import {getCounterValue, getVaultAPY} from 'utils';
import {useWallet} from 'contexts/useWallet';

function	About(): ReactElement {
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

	// 15000000/10000000000

	return (
		<section className={'mt-4 grid w-full grid-cols-1 gap-x-10 gap-y-20 pb-10 md:mt-20 md:grid-cols-12'}>

			<div className={'w-full md:col-span-8'}>
				<p className={'pb-6 text-3xl text-neutral-900'}>{'Yearn has'}</p>
				<b className={'text-7xl tabular-nums text-neutral-900'}>
					{data?.[toAddress(process.env.VECRV_YEARN_TREASURY_ADDRESS)] ? 
						`${format.amount(
							format.toNormalizedValue(data?.[toAddress(process.env.VECRV_YEARN_TREASURY_ADDRESS)] || 0, 18), 2, 2)} veCRV`
						: '- veCRV'
					}
				</b>
			</div>
			<div className={'w-full md:col-span-4'}>
				<p className={'pb-6 text-3xl text-neutral-900'}>{'You have'}</p>
				<b className={'text-7xl tabular-nums text-neutral-900'}>
					{getCounterValue(
						(Number(balances[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.normalized) || 0) * (vaults?.[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0)
						+
						(Number(balances[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.normalized) || 0) * (vaults?.[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0),
						1
					)}
				</b>
			</div>

			<div className={'col-span-12 flex w-full flex-row space-x-4'}>
				<div className={'w-full bg-neutral-100 p-6 md:w-[412px] md:min-w-[412px]'}>
					<div className={'grid w-full gap-6 md:col-span-5'}>
						<div>
							<b className={'pb-2 text-3xl tabular-nums text-neutral-900'}>
								{data?.treasury ? 
									`${format.amount(
										format.toNormalizedValue(data?.treasury || 0, 18), 2, 2)} veCRV`
									: '- veCRV'
								}
							</b>
							<p className={'text-lg text-neutral-500'}>{'Yearn Treasury'}</p>
						</div>
						<div>
							<b className={'pb-2 text-3xl tabular-nums text-neutral-900'}>
								{data?.legacy ? 
									`${format.amount(
										format.toNormalizedValue(data?.legacy || 0, 18), 2, 2)} yveCRV`
									: '- yveCRV'
								}
							</b>
							<p className={'text-lg text-neutral-500'}>{'Legacy system'}</p>
						</div>
						<div>
							<b className={'pb-2 text-3xl tabular-nums text-neutral-900'}>
								{data?.yCRVSupply ? 
									`${format.amount(
										format.toNormalizedValue(data?.yCRVSupply || ethers.constants.Zero, 18), 2, 2)} yCRV`
									: '- yCRV'
								}
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
					<div className={'mb-6 grid w-full grid-cols-5'}>
						<p className={'text-base text-neutral-400'}>{'Product'}</p>
						<p className={'text-base text-neutral-400'}>{'APY'}</p>
						<p className={'text-base text-neutral-400'}>{'Total Assets'}</p>
						<p className={'text-base text-neutral-400'}>{'yCRV Deposits'}</p>
						<p className={'text-base text-neutral-400'}>{'My Balance'}</p>
					</div>

					<div className={'mb-8 grid w-full grid-cols-5'}>
						<p className={'text-base text-neutral-900'}>{'st-yCRV'}</p>
						<b className={'text-base tabular-nums text-neutral-900'}>
							{stCRVAPY ? `${(stCRVAPY || '').replace('APY', '')}*` : '0.00%'}
						</b>
						<p className={'text-base tabular-nums text-neutral-900'}>
							{data?.styCRVSupply ? getCounterValue(
								format.toNormalizedValue(data?.styCRVSupply || ethers.constants.Zero, 18),
								vaults?.[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0
							) : '0.00'}
						</p>
						<p className={'text-base tabular-nums text-neutral-900'}>
							{data?.styCRVSupply ? (
								format.amount(format.toNormalizedValue(data?.styCRVSupply || ethers.constants.Zero, 18), 2, 2)
							) : '0.00'}
						</p>
						<div>
							<p className={'text-base tabular-nums text-neutral-900'}>
								{balances[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.normalized ? (
									format.amount(balances[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.normalized || 0, 2, 4)
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

					<div className={'mb-8 grid w-full grid-cols-5'}>
						<p className={'text-base text-neutral-900'}>{'st-yCRV'}</p>
						<b className={'text-base tabular-nums text-neutral-900'}>
							{lpCRVAPY ? (lpCRVAPY || '').replace('APY', '') : '0.00%'}
						</b>
						<p className={'text-base tabular-nums text-neutral-900'}>
							{data?.styCRVSupply ? getCounterValue(
								format.toNormalizedValue(data?.styCRVSupply || ethers.constants.Zero, 18),
								vaults?.[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.tvl?.price || 0
							) : '0.00'}
						</p>
						<p className={'text-base tabular-nums text-neutral-900'}>
							{data?.styCRVSupply ? (
								format.amount(format.toNormalizedValue(data?.styCRVSupply || ethers.constants.Zero, 18), 2, 2)
							) : '0.00'}
						</p>
						<div>
							<p className={'text-base tabular-nums text-neutral-900'}>
								{balances[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.normalized ? (
									format.amount(balances[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.normalized || 0, 2, 4)
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

					<div className={'mb-8 grid w-full grid-cols-5'}>
						<p className={'text-base text-neutral-900'}>{'vl-yCRV'}</p>
						<b className={'text-base tabular-nums text-neutral-900'}>{'N/A'}</b>
						<p className={'text-base tabular-nums text-neutral-900'}>{'N/A'}</p>
						<p className={'text-base tabular-nums text-neutral-900'}>{'N/A'}</p>
						<div>
							<p className={'text-base tabular-nums text-neutral-900'}>{'N/A'}</p>
							<p className={'text-xs tabular-nums text-neutral-600'}>{'N/A'}</p>
						</div>
					</div>

					<div>
						<p className={'text-base tabular-nums text-neutral-400'}>{'*111.15% APY: '}</p>
						<p className={'text-base tabular-nums text-neutral-400'}>{'∙ 92.03% Curve Admin Fees (3.6x boost)'}</p>
						<p className={'text-base tabular-nums text-neutral-400'}>{'∙ 23.12% Gauge Voting Bribes'}</p>
					</div>
				</div>
			</div>

		</section>
	);
}

export default About;
