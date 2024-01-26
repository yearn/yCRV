import {Fragment, useMemo} from 'react';
import {WithCardTransactor} from 'app/components/CardZap';
import {ValueAnimation} from 'app/components/common/ValueAnimation';
import {Harvests} from 'app/components/Harvests';
import {VaultsListInternalMigrationRow} from 'app/components/VaultsListInternalMigrationRow';
import {useCurve} from 'app/contexts/useCurve';
import {useYCRV} from 'app/contexts/useYCRV';
import {getVaultAPR} from 'app/utils';
import {
	cl,
	formatAmount,
	formatBigNumberOver10K,
	formatCounterValue,
	formatCounterValueRaw,
	formatNumberOver10K,
	formatPercent,
	toBigInt,
	toNormalizedValue
} from '@builtbymom/web3/utils';
import {useYearn} from '@yearn-finance/web-lib/contexts/useYearn';
import {useYearnBalance} from '@yearn-finance/web-lib/hooks/useYearnBalance';
import {useYearnTokenPrice} from '@yearn-finance/web-lib/hooks/useYearnTokenPrice';
import {
	LPYCRV_TOKEN_ADDRESS,
	LPYCRV_V2_TOKEN_ADDRESS,
	STYCRV_TOKEN_ADDRESS,
	YCRV_TOKEN_ADDRESS
} from '@yearn-finance/web-lib/utils/constants';

import type {ReactElement} from 'react';

function HeaderPosition(): ReactElement {
	const {holdings} = useYCRV();
	const balanceOfStyCRV = useYearnBalance({address: STYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const balanceOfLpyCRV = useYearnBalance({address: LPYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const balanceOfLpyCRVV2 = useYearnBalance({address: LPYCRV_V2_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const stycrvPrice = useYearnTokenPrice({address: STYCRV_TOKEN_ADDRESS, chainID: 1});
	const lpycrvPrice = useYearnTokenPrice({address: LPYCRV_TOKEN_ADDRESS, chainID: 1});
	const lpycrvV2Price = useYearnTokenPrice({address: LPYCRV_V2_TOKEN_ADDRESS, chainID: 1});

	const formatedYearnHas = useMemo(
		(): string => (holdings?.veCRVBalance ? formatAmount(toNormalizedValue(holdings.veCRVBalance, 18), 0, 0) : ''),
		[holdings?.veCRVBalance]
	);

	const formatedYouHave = useMemo(
		(): string =>
			formatCounterValueRaw(
				Number(balanceOfStyCRV.normalized) * stycrvPrice +
					Number(balanceOfLpyCRV.normalized) * lpycrvPrice +
					Number(balanceOfLpyCRVV2.normalized) * lpycrvV2Price,
				1
			),
		[
			balanceOfStyCRV.normalized,
			stycrvPrice,
			balanceOfLpyCRV.normalized,
			lpycrvPrice,
			balanceOfLpyCRVV2.normalized,
			lpycrvV2Price
		]
	);

	return (
		<Fragment>
			<div className={'col-span-12 w-full md:col-span-8'}>
				<p className={'pb-2 text-lg text-neutral-900 md:pb-6 md:text-3xl'}>{'Yearn has'}</p>
				<b className={'font-number text-3xl text-neutral-900 md:text-7xl'}>
					<ValueAnimation
						identifier={'veCRVTreasury'}
						value={formatedYearnHas}
						suffix={'veCRV'}
						defaultValue={'0,00'}
					/>
				</b>
			</div>
			<div className={'col-span-12 w-full md:col-span-4'}>
				<p className={'pb-2 text-lg text-neutral-900 md:pb-6 md:text-3xl'}>{'You have'}</p>
				<b className={'font-number text-3xl text-neutral-900 md:text-7xl'}>
					<ValueAnimation
						identifier={'youHave'}
						value={formatedYouHave}
						prefix={'$'}
						defaultValue={'0,00'}
					/>
				</b>
			</div>
		</Fragment>
	);
}

function ZapAndStats(): ReactElement {
	const {holdings, styCRVAPY} = useYCRV();
	const {vaults} = useYearn();
	const {curveWeeklyFees, cgPrices} = useCurve();

	const lpCRVAPY = useMemo((): string => getVaultAPR(vaults, LPYCRV_TOKEN_ADDRESS), [vaults]);
	const lpCRVV2APY = useMemo((): string => getVaultAPR(vaults, LPYCRV_V2_TOKEN_ADDRESS), [vaults]);
	const ycrvPrice = useYearnTokenPrice({address: YCRV_TOKEN_ADDRESS, chainID: 1});
	const stycrvPrice = useYearnTokenPrice({address: STYCRV_TOKEN_ADDRESS, chainID: 1});
	const lpycrvPrice = useYearnTokenPrice({address: LPYCRV_TOKEN_ADDRESS, chainID: 1});
	const lpycrvV2Price = useYearnTokenPrice({address: LPYCRV_V2_TOKEN_ADDRESS, chainID: 1});
	const balanceOfStyCRV = useYearnBalance({address: STYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const balanceOfLpyCRV = useYearnBalance({address: LPYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const balanceOfLpyCRVV2 = useYearnBalance({address: LPYCRV_V2_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only

	const latestCurveFeesValue = useMemo((): number => {
		const {weeklyFeesTable} = curveWeeklyFees;

		if (!weeklyFeesTable) {
			return 0;
		}

		if (weeklyFeesTable[0]?.rawFees > 0) {
			return weeklyFeesTable[0].rawFees;
		}

		return weeklyFeesTable[1]?.rawFees || 0;
	}, [curveWeeklyFees]);

	const currentVeCRVAPY = useMemo((): number => {
		return (
			(latestCurveFeesValue /
				(toNormalizedValue(toBigInt(holdings?.veCRVTotalSupply), 18) * cgPrices?.['curve-dao-token']?.usd)) *
			52 *
			100
		);
	}, [holdings, latestCurveFeesValue, cgPrices]);

	const curveAdminFeePercent = useMemo((): number => {
		return (currentVeCRVAPY * Number(holdings?.boostMultiplier)) / 10000;
	}, [holdings, currentVeCRVAPY]);

	const crvYCRVPeg = useMemo((): number => {
		return toNormalizedValue(holdings?.crvYCRVPeg, 18) + 0.0015;
	}, [holdings]);

	return (
		<div className={'col-span-12 grid w-full grid-cols-12 gap-4 '}>
			<div className={'col-span-12 md:col-span-8'}>
				<WithCardTransactor className={'col-span-12 md:col-span-8'} />
			</div>
			<div className={'col-span-12 flex flex-col gap-4 md:col-span-4'}>
				<div className={'w-full bg-neutral-100 p-4'}>
					<div className={'flex flex-row items-baseline justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'Price: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{`Price = $${formatAmount(ycrvPrice || 0)} | CRV Ratio = ${
								holdings?.crvYCRVPeg ? formatPercent(crvYCRVPeg * 100) : formatPercent(0)
							}`}
						</p>
					</div>

					<div className={'flex flex-row items-baseline justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'Yearn Treasury: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{holdings?.treasury ? `${formatBigNumberOver10K(holdings.treasury)} ` : '- '}
							<span className={'font-number text-neutral-600'}>{'veCRV'}</span>
						</p>
					</div>

					<div className={'flex flex-row items-baseline justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'Legacy system: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{holdings?.legacy ? `${formatBigNumberOver10K(holdings.legacy)} ` : '- '}
							<span className={'font-number text-neutral-600'}>{'yveCRV'}</span>
						</p>
					</div>
				</div>

				<div className={'w-full bg-neutral-100 p-4'}>
					<div className={'flex flex-row items-center justify-between pb-3'}>
						<b className={'text-neutral-900'}>{'st-yCRV'}</b>
					</div>

					<div className={'flex flex-row items-baseline justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'My Balance: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{formatNumberOver10K(Number(balanceOfStyCRV.normalized))}
						</p>
					</div>
					<div className={'flex flex-row items-center justify-between'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'Value: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{formatCounterValue(balanceOfStyCRV.normalized, stycrvPrice)}
						</p>
					</div>

					<div className={'my-2 h-px w-full bg-neutral-200'} />

					<div className={'flex flex-row items-center justify-between pb-1'}>
						<span className={'mr-auto text-sm font-normal text-neutral-400'}>{'APY: '}</span>
						<span className={'tooltip'}>
							<b
								suppressHydrationWarning
								className={'font-number text-sm text-neutral-900'}>
								{`${formatPercent(styCRVAPY ?? 0)}*`}
							</b>
							<span
								suppressHydrationWarning
								className={'tooltipLight !-left-[132px] bottom-full mb-1 w-fit'}>
								<div
									className={
										'font-number w-52 border border-neutral-300 bg-neutral-100 p-1 px-2 text-center text-xxs text-neutral-900'
									}>
									<div className={'flex flex-col items-start justify-start text-left'}>
										<p
											suppressHydrationWarning
											className={'font-number text-neutral-400 md:text-xxs'}>
											{styCRVAPY
												? `*${formatPercent(styCRVAPY)} APY: `
												: `*${formatPercent(0)} APY: `}
										</p>
										<p
											suppressHydrationWarning
											className={'font-number text-neutral-400 md:text-xxs'}>
											{`∙ ${
												curveAdminFeePercent
													? formatPercent(curveAdminFeePercent)
													: formatPercent(0)
											} Curve Admin Fees (${formatAmount(
												Number(holdings?.boostMultiplier) / 10000
											)}x boost)`}
										</p>
										<p
											suppressHydrationWarning
											className={'font-number text-neutral-400 md:text-xxs'}>
											{`∙ ${
												styCRVAPY && curveAdminFeePercent
													? formatAmount(styCRVAPY - curveAdminFeePercent, 2, 2)
													: '0.00'
											}% Gauge Voting Bribes`}
										</p>
									</div>
								</div>
							</span>
						</span>
					</div>
					<div className={'flex flex-row items-center justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'Total Assets: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{holdings?.styCRVSupply
								? formatCounterValue(toNormalizedValue(holdings.styCRVSupply, 18), ycrvPrice)
								: formatAmount(0)}
						</p>
					</div>
					<div className={'flex flex-row items-center justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'yCRV Deposits: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{formatBigNumberOver10K(holdings.styCRVSupply)}
						</p>
					</div>
				</div>

				<div className={'w-full bg-neutral-100 p-4'}>
					<div className={'flex flex-row items-center justify-between pb-3'}>
						<b className={'text-neutral-900'}>{'lp-yCRV V2'}</b>
					</div>

					<div className={'flex flex-row items-baseline justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'My Balance: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{formatNumberOver10K(Number(balanceOfLpyCRVV2.normalized))}
						</p>
					</div>
					<div className={'flex flex-row items-center justify-between'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'Value: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{formatCounterValue(balanceOfLpyCRVV2.normalized, lpycrvV2Price)}
						</p>
					</div>

					<div className={'my-2 h-px w-full bg-neutral-200'} />

					<div className={'flex flex-row items-center justify-between pb-1'}>
						<span className={'mr-auto text-sm font-normal text-neutral-400'}>{'APY: '}</span>
						<b
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{lpCRVV2APY ? `${(lpCRVV2APY || '').replace('APY', '')}` : `${formatPercent(0)}`}
						</b>
					</div>
					<div className={'flex flex-row items-center justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'Total Assets: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{holdings?.lpyCRVV2Supply
								? formatCounterValue(toNormalizedValue(holdings.lpyCRVV2Supply, 18), lpycrvV2Price)
								: formatAmount(0)}
						</p>
					</div>
					<div className={'flex flex-row items-center justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'yCRV Deposits: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{formatBigNumberOver10K(holdings.lpyCRVV2Supply)}
						</p>
					</div>
				</div>

				{toBigInt(balanceOfLpyCRV.raw) > 0n ? (
					<div className={'w-full bg-neutral-100 p-4'}>
						<div className={'flex flex-row items-center justify-between pb-3'}>
							<b className={'text-neutral-900'}>{'lp-yCRV'}</b>
						</div>

						<div className={'flex flex-row items-baseline justify-between pb-1'}>
							<span className={'inline text-sm font-normal text-neutral-400'}>{'My Balance: '}</span>
							<p
								suppressHydrationWarning
								className={'font-number text-sm text-neutral-900'}>
								{formatNumberOver10K(Number(balanceOfLpyCRV.normalized))}
							</p>
						</div>
						<div className={'flex flex-row items-center justify-between'}>
							<span className={'inline text-sm font-normal text-neutral-400'}>{'Value: '}</span>
							<p
								suppressHydrationWarning
								className={'font-number text-sm text-neutral-900'}>
								{formatCounterValue(balanceOfLpyCRV.normalized, lpycrvPrice)}
							</p>
						</div>

						<div className={'my-2 h-px w-full bg-neutral-200'} />

						<div className={'flex flex-row items-center justify-between pb-1'}>
							<span className={'mr-auto text-sm font-normal text-neutral-400'}>{'APY: '}</span>
							<b
								suppressHydrationWarning
								className={'font-number text-sm text-neutral-900'}>
								{lpCRVAPY ? `${(lpCRVAPY || '').replace('APY', '')}` : `${formatPercent(0)}`}
							</b>
						</div>
						<div className={'flex flex-row items-center justify-between pb-1'}>
							<span className={'inline text-sm font-normal text-neutral-400'}>{'Total Assets: '}</span>
							<p
								suppressHydrationWarning
								className={'font-number text-sm text-neutral-900'}>
								{holdings?.lpyCRVSupply
									? formatCounterValue(toNormalizedValue(holdings.lpyCRVSupply, 18), lpycrvPrice)
									: formatAmount(0)}
							</p>
						</div>
						<div className={'flex flex-row items-center justify-between pb-1'}>
							<span className={'inline text-sm font-normal text-neutral-400'}>{'yCRV Deposits: '}</span>
							<p
								suppressHydrationWarning
								className={'font-number text-sm text-neutral-900'}>
								{formatBigNumberOver10K(holdings.lpyCRVSupply)}
							</p>
						</div>
					</div>
				) : (
					<div />
				)}
			</div>
		</div>
	);
}

function Holdings(): ReactElement {
	const {vaultsMigrations} = useYearn();
	const balanceOfLpyCRV = useYearnBalance({address: LPYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const hasLegacyLpyCRV = !!vaultsMigrations[LPYCRV_TOKEN_ADDRESS] && balanceOfLpyCRV.raw > 0n;

	return (
		<section
			className={cl(
				'grid w-full grid-cols-12 gap-y-10 pb-10 md:gap-x-10 md:gap-y-20',
				!hasLegacyLpyCRV ? 'mt-4  md:mt-20' : ''
			)}>
			{hasLegacyLpyCRV && (
				<div className={'col-span-12 w-full'}>
					<VaultsListInternalMigrationRow currentVault={vaultsMigrations[LPYCRV_TOKEN_ADDRESS]} />
				</div>
			)}
			<HeaderPosition />
			<ZapAndStats />
			<Harvests />
		</section>
	);
}

export default Holdings;
