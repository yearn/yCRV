import {Fragment, useMemo} from 'react';
import {WithCardTransactor} from 'app/components/CardZap';
import {ValueAnimation} from 'app/components/common/ValueAnimation';
import {Harvests} from 'app/components/Harvests';
import {VaultsListInternalMigrationRow} from 'app/components/VaultsListInternalMigrationRow';
import {useCurve} from 'app/contexts/useCurve';
import {useYCRV} from 'app/contexts/useYCRV';
import {useKongVaults} from 'app/contexts/useYearn';
import {getVaultAPR} from 'app/utils';
import {useWallet} from '@builtbymom/web3/contexts/useWallet';
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
import {
	CRV_TOKEN_ADDRESS,
	LPYCRV_TOKEN_ADDRESS,
	LPYCRV_V2_TOKEN_ADDRESS,
	STYCRV_TOKEN_ADDRESS,
	YCRV_TOKEN_ADDRESS
} from '@yearn-finance/web-lib/utils/constants';

import type {ReactElement} from 'react';

function formatKnownUSDValue(amount: number, price: number | undefined): string {
	if (!Number.isFinite(amount)) {
		return 'N/A';
	}
	if (amount === 0) {
		return formatCounterValue(0, 0);
	}
	return price === undefined ? 'N/A' : formatCounterValue(amount, price);
}

function HeaderPosition(): ReactElement {
	const {getBalance} = useWallet();
	const {prices, holdings} = useYCRV();
	const balanceOfStyCRV = getBalance({address: STYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const balanceOfLpyCRV = getBalance({address: LPYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const balanceOfLpyCRVV2 = getBalance({address: LPYCRV_V2_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const stycrvPrice = prices[STYCRV_TOKEN_ADDRESS];
	const lpycrvPrice = prices[LPYCRV_TOKEN_ADDRESS];
	const lpycrvV2Price = prices[LPYCRV_V2_TOKEN_ADDRESS];

	const formatedYearnHas = useMemo(
		(): string => (holdings?.veCRVBalance ? formatAmount(toNormalizedValue(holdings.veCRVBalance, 18), 0, 0) : ''),
		[holdings?.veCRVBalance]
	);

	const formatedYouHave = useMemo(
		(): string => {
			const positions = [
				{balance: Number(balanceOfStyCRV.normalized), price: stycrvPrice},
				{balance: Number(balanceOfLpyCRV.normalized), price: lpycrvPrice},
				{balance: Number(balanceOfLpyCRVV2.normalized), price: lpycrvV2Price}
			];
			if (positions.some(({balance, price}): boolean => balance > 0 && price === undefined)) {
				return 'N/A';
			}
			const total = positions.reduce(
				(sum, {balance, price}): number => sum + balance * (price ?? 0),
				0
			);
			return formatCounterValueRaw(total, 1);
		},
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
					{formatedYouHave === 'N/A' ? (
						<span>{'$ N/A'}</span>
					) : (
						<ValueAnimation
							identifier={'youHave'}
							value={formatedYouHave}
							prefix={'$'}
							defaultValue={'0,00'}
						/>
					)}
				</b>
			</div>
		</Fragment>
	);
}

function ZapAndStats(): ReactElement {
	const {holdings, styCRVAPY, prices} = useYCRV();
	const {vaults} = useKongVaults();
	const {curveWeeklyFees} = useCurve();
	const {getBalance} = useWallet();

	const lpCRVAPY = useMemo((): string => getVaultAPR(vaults, LPYCRV_TOKEN_ADDRESS), [vaults]);
	const lpCRVV2APY = useMemo((): string => getVaultAPR(vaults, LPYCRV_V2_TOKEN_ADDRESS), [vaults]);
	const balanceOfStyCRV = getBalance({address: STYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const balanceOfLpyCRV = getBalance({address: LPYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
	const balanceOfLpyCRVV2 = getBalance({address: LPYCRV_V2_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only

	const ycrvPrice = prices[YCRV_TOKEN_ADDRESS];
	const stycrvPrice = prices[STYCRV_TOKEN_ADDRESS];
	const lpycrvPrice = prices[LPYCRV_TOKEN_ADDRESS];
	const lpycrvV2Price = prices[LPYCRV_V2_TOKEN_ADDRESS];

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

	const currentVeCRVAPY = useMemo((): number | undefined => {
		const crvPrice = prices[CRV_TOKEN_ADDRESS];
		const veCRVSupply = toNormalizedValue(toBigInt(holdings?.veCRVTotalSupply), 18);
		const denominator = veCRVSupply * (crvPrice ?? 0);
		if (crvPrice === undefined || !Number.isFinite(denominator) || denominator <= 0) {
			return undefined;
		}
		return (latestCurveFeesValue / denominator) * 52 * 100;
	}, [holdings?.veCRVTotalSupply, latestCurveFeesValue, prices]);

	const curveAdminFeePercent = useMemo((): number | undefined => {
		return currentVeCRVAPY === undefined
			? undefined
			: (currentVeCRVAPY * Number(holdings?.boostMultiplier)) / 10000;
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
							{`Price = $${ycrvPrice === undefined ? 'N/A' : formatAmount(ycrvPrice)} | CRV Ratio = ${
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
							{formatKnownUSDValue(Number(balanceOfStyCRV.normalized), stycrvPrice)}
						</p>
					</div>

					<div className={'my-2 h-px w-full bg-neutral-200'} />

					<div className={'flex flex-row items-center justify-between pb-1'}>
						<span className={'mr-auto text-sm font-normal text-neutral-400'}>{'APY: '}</span>
						<span className={'tooltip'}>
							<b
								suppressHydrationWarning
								className={'font-number text-sm text-neutral-900'}>
								{styCRVAPY === undefined ? 'N/A*' : `${formatPercent(styCRVAPY)}*`}
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
											{styCRVAPY === undefined
												? '*APY unavailable: '
												: `*${formatPercent(styCRVAPY)} APY: `}
										</p>
										<p
											suppressHydrationWarning
											className={'font-number text-neutral-400 md:text-xxs'}>
											{`∙ ${
												curveAdminFeePercent === undefined
													? 'N/A'
													: formatPercent(curveAdminFeePercent)
											} Curve Admin Fees (${formatAmount(
												Number(holdings?.boostMultiplier) / 10000
											)}x boost)`}
										</p>
										<p
											suppressHydrationWarning
											className={'font-number text-neutral-400 md:text-xxs'}>
											{`∙ ${
												styCRVAPY === undefined || curveAdminFeePercent === undefined
													? 'N/A'
													: formatAmount(styCRVAPY - curveAdminFeePercent, 2, 2)
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
							{formatKnownUSDValue(toNormalizedValue(holdings.styCRVSupply, 18), ycrvPrice)}
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
							{formatKnownUSDValue(Number(balanceOfLpyCRVV2.normalized), lpycrvV2Price)}
						</p>
					</div>

					<div className={'my-2 h-px w-full bg-neutral-200'} />

					<div className={'flex flex-row items-center justify-between pb-1'}>
						<span className={'mr-auto text-sm font-normal text-neutral-400'}>{'APY: '}</span>
						<b
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{lpCRVV2APY.replace('APY', '').trim()}
						</b>
					</div>
					<div className={'flex flex-row items-center justify-between pb-1'}>
						<span className={'inline text-sm font-normal text-neutral-400'}>{'Total Assets: '}</span>
						<p
							suppressHydrationWarning
							className={'font-number text-sm text-neutral-900'}>
							{formatKnownUSDValue(toNormalizedValue(holdings.lpyCRVV2Supply, 18), lpycrvV2Price)}
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
								{formatKnownUSDValue(Number(balanceOfLpyCRV.normalized), lpycrvPrice)}
							</p>
						</div>

						<div className={'my-2 h-px w-full bg-neutral-200'} />

						<div className={'flex flex-row items-center justify-between pb-1'}>
							<span className={'mr-auto text-sm font-normal text-neutral-400'}>{'APY: '}</span>
							<b
								suppressHydrationWarning
								className={'font-number text-sm text-neutral-900'}>
								{lpCRVAPY.replace('APY', '').trim()}
							</b>
						</div>
						<div className={'flex flex-row items-center justify-between pb-1'}>
							<span className={'inline text-sm font-normal text-neutral-400'}>{'Total Assets: '}</span>
							<p
								suppressHydrationWarning
								className={'font-number text-sm text-neutral-900'}>
								{formatKnownUSDValue(toNormalizedValue(holdings.lpyCRVSupply, 18), lpycrvPrice)}
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
	const {getBalance} = useWallet();
	const {vaultsMigrations} = useKongVaults();
	const balanceOfLpyCRV = getBalance({address: LPYCRV_TOKEN_ADDRESS, chainID: 1}); //yCRV is on ETH mainnet only
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
