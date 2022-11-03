import React, {ReactElement, useMemo, useState} from 'react';
import {Button} from '@yearn-finance/web-lib/components';
import {useSettings} from '@yearn-finance/web-lib/contexts';
import {LinkOut}  from '@yearn-finance/web-lib/icons';
import {performBatchedUpdates} from '@yearn-finance/web-lib/utils';
import ListOfVaults from 'components/ListOfVaults';
import {DropdownGauges, TDropdownGaugeOption} from 'components/TokenDropdownGauges';
import {useCurve} from 'contexts/useCurve';

import type {TCurveGauges} from 'types/curve.d';

const	defaultOption: TDropdownGaugeOption = {
	label: '',
	zapVia: '',
	value: {
		name: '',
		tokenAddress: '',
		poolAddress: '',
		gaugeAddress: ''
	}
};

function	NewVault(): ReactElement {
	const	{networks} = useSettings();
	const	{gauges} = useCurve();
	const	[selectedOption, set_selectedOption] = useState(defaultOption);

	const	gaugesOptions = useMemo((): TDropdownGaugeOption[] => {
		return (
			gauges
				.filter((item: TCurveGauges): boolean => !item.side_chain && !item.is_killed && !item.factory)
				.map((gauge: TCurveGauges): TDropdownGaugeOption => ({
					label: gauge.name,
					zapVia: '',
					value: {
						name: gauge.name,
						tokenAddress: gauge.swap_token,
						poolAddress: gauge.swap,
						gaugeAddress: gauge.gauge
					}
				})
				));
	}, [gauges]);

	return (
		<section className={'mt-4 flex w-full flex-col items-center justify-center'}>
			<div className={'w-full bg-neutral-100 p-4 md:p-12'}>
				<div aria-label={'new vault card title'} className={'flex flex-col pb-6'}>
					<h2 className={'pb-2 text-3xl font-bold'}>{'Add new Vault'}</h2>
					<p>{'Get 69% discount on fee using new vaults'}</p>
				</div>

				<div aria-label={'vault selection'} className={'flex flex-col pb-[52px]'}>
					<div className={'grid grid-cols-1 gap-x-0 gap-y-5 md:grid-cols-6 md:gap-x-8'}>
						<label className={'yearn--input relative z-10 col-span-2'}>
							<p className={'text-base text-neutral-600'}>{'Select token'}</p>
							<DropdownGauges
								defaultOption={defaultOption}
								placeholder={'Select token'}
								options={gaugesOptions}
								selected={selectedOption}
								onSelect={(option: TDropdownGaugeOption): void => {
									performBatchedUpdates((): void => {
										set_selectedOption(option);
									});
								}} />
						</label>

						<div className={'col-span-2 w-full space-y-1'}>
							<p className={'text-base text-neutral-600'}>{'Vault name'}</p>
							<div className={'h-10 bg-neutral-0 p-2 text-base'}>
								{selectedOption.value.name === '' ? '-' : `Curve ${selectedOption.value.name} yVault`}
							</div>
						</div>

						<div className={'col-span-2 w-full space-y-1'}>
							<p className={'text-base text-neutral-600'}>{'Symbol'}</p>
							<div className={'h-10 bg-neutral-0 p-2 text-base'}>
								{selectedOption.value.name === '' ? '-' : `yvCurve ${selectedOption.value.name}`}
							</div>
						</div>

						<div className={'col-span-3 w-full space-y-1'}>
							<p className={'text-base text-neutral-600'}>{'Pool address'}</p>
							<div className={'flex h-10 flex-row items-center justify-between bg-neutral-0 p-2 font-mono text-base'}>
								{selectedOption.value.poolAddress ? (
									<>
										{selectedOption.value.poolAddress}
										<a
											href={`${networks[1].explorerBaseURI}/address/${selectedOption.value.poolAddress}`}
											target={'_blank'}
											rel={'noreferrer'}
											className={'cursor-pointer text-neutral-600 transition-colors hover:text-neutral-900'}>
											<LinkOut />
										</a>
									</>
								) : ''}
							</div>
						</div>
						<div className={'col-span-3 w-full space-y-1'}>
							<p className={'text-base text-neutral-600'}>{'Gauge address'}</p>
							<div className={'flex h-10 flex-row items-center justify-between bg-neutral-0 p-2 font-mono text-base'}>
								{selectedOption.value.gaugeAddress ? (
									<>
										{selectedOption.value.gaugeAddress}
										<a
											href={`${networks[1].explorerBaseURI}/address/${selectedOption.value.gaugeAddress}`}
											target={'_blank'}
											rel={'noreferrer'}
											className={'cursor-pointer text-neutral-600 transition-colors hover:text-neutral-900'}>
											<LinkOut />
										</a>
									</>
								) : ''}
							</div>
						</div>

					</div>
				</div>

				<div aria-label={'actions'} className={'flex flex-row items-center space-x-4'}>
					<div>
						<Button className={'w-full'}>
							{'Create new Vault'}
						</Button>
					</div>
					<div>
						<p className={'text-xs'}>{'Est. gas 0.4 ETH'}</p>
					</div>
				</div>
			</div>
			<ListOfVaults />
		</section>
	);
}

export default NewVault;
