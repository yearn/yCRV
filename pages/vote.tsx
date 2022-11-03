import React, {ReactElement, useMemo, useState} from 'react';
import Image from 'next/image';
import {Button} from '@yearn-finance/web-lib/components';
import {performBatchedUpdates, toAddress} from '@yearn-finance/web-lib/utils';
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
	const	{gauges} = useCurve();
	const	[selectedOption, set_selectedOption] = useState(defaultOption);
	const	[delegateTo, set_delegateTo] = useState('');

	const	gaugesOptions = useMemo((): TDropdownGaugeOption[] => {
		return (
			gauges
				.filter((item: TCurveGauges): boolean => !item.side_chain && !item.is_killed && !item.factory)
				.map((gauge: TCurveGauges): TDropdownGaugeOption => ({
					label: gauge.name,
					zapVia: '',
					icon: (
						<Image
							alt={gauge.name}
							width={24}
							height={24}
							src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(gauge.swap_token)}/logo-128.png`} />
					),
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
		<section className={'mt-4 flex w-full flex-col items-center justify-center space-y-6 md:mt-20'}>
			<div className={'w-full bg-neutral-100 p-4 md:p-12'}>
				<div aria-label={'Lock vote'} className={'flex w-full flex-col pb-8 lg:max-w-[704px]'}>
					<h2 className={'pb-8 text-3xl font-bold'}>{'Lock ‘n Vote'}</h2>
					<div className={'flex flex-col space-y-5 text-neutral-600'}>
						<p>{'If you love acronyms, the below primer on vl-yCRV will be right up your street. For normal people, we can only apologise. '}</p>

						<p>{'vl-yCRV (vote-locked yCRV) allows users to vote using Yearn’s veCRV (vote-escrowed CRV), where 1 vl-yCRV is worth 1 veCRV.'}</p>

						<p>{'This system was designed to be especially useful for protocols seeking to boost emissions to their pool’s Curve gauges without committing to a 4 year veCRV lock, or repeatedly submitting large bribes.'}</p>

						<p>{'For a full breakdown on how voting on vl-yCRV works, as well as locking, bribing and incentives see our vl-yCRV docs.'}</p>
					</div>
				</div>

				<div aria-label={'vault selection'} className={'flex w-full flex-col lg:max-w-[704px]'}>
					<div className={'grid grid-cols-1 gap-x-0 gap-y-5 md:grid-cols-6 md:gap-x-8'}>
						<label className={'yearn--input relative z-10 col-span-2'}>
							<p className={'text-base text-neutral-600'}>{'Select token'}</p>
							<DropdownGauges
								defaultOption={defaultOption}
								placeholder={'Token'}
								options={gaugesOptions}
								selected={selectedOption}
								onSelect={(option: TDropdownGaugeOption): void => {
									performBatchedUpdates((): void => {
										set_selectedOption(option);
									});
								}} />
						</label>

						<div className={'col-span-2 w-full space-y-1'}>
							<p className={'text-base text-neutral-600'}>{'Vote weight'}</p>
							<div className={'h-10 bg-neutral-0 p-2 text-base'}>
								{selectedOption.value.name === '' ? '-' : `Curve ${selectedOption.value.name} yVault`}
							</div>
						</div>

						<div className={'col-span-2 w-full space-y-1'}>
							<p className={'text-base text-neutral-600'}>&nbsp;</p>
							<div>
								<Button
									className={'w-full'}
								>
									{'Submit'}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>

			
			<div className={'w-full bg-neutral-100 p-4 md:p-12'}>
				<div aria-label={'Lock vote'} className={'flex w-full flex-col pb-8 lg:max-w-[704px]'}>
					<h2 className={'pb-8 text-3xl font-bold'}>{'Delegate'}</h2>
					<div className={'flex flex-col space-y-5 text-neutral-600'}>
						<p>{'Uncle Ben once said with “delegreat power comes delegreat responsibility.” '}</p>

						<p>{'You can delegate your vl-yCRV voting responsibility to another address, allowing them to vote on your behalf. '}</p>

						<p>{'Perfect for anyone worried about slow signers or forgetting to vote (we’ve all been there).'}</p>
					</div>
				</div>

				<div aria-label={'vault selection'} className={'flex w-full flex-col lg:max-w-[704px]'}>
					<div className={'grid grid-cols-1 gap-x-0 gap-y-5 md:grid-cols-6 md:gap-x-8'}>
						<div className={'col-span-2 w-full space-y-1'}>
							<p className={'text-base text-neutral-600'}>{'Delegate to'}</p>
							<input
								placeholder={'0x...'}
								className={'h-10 w-full border border-neutral-600 bg-transparent p-2'}
								value={delegateTo}
								onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
									performBatchedUpdates((): void => {
										set_delegateTo(event.target.value);
									});
								}} />
						</div>

						<div className={'col-span-2 w-full space-y-1'}>
							<p className={'text-base text-neutral-600'}>&nbsp;</p>
							<div>
								<Button
									disabled={toAddress(delegateTo) === toAddress('')}
									className={'w-full'}>
									{'Delegate'}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default NewVault;
