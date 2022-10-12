/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-empty-pattern */
/* eslint-disable @typescript-eslint/no-empty-function */
import React, {ReactElement, useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {Button} from '@yearn-finance/web-lib/components';
import {defaultTxStatus, toAddress} from '@yearn-finance/web-lib/utils';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {Dropdown} from 'components/TokenDropdown';
import ArrowDown from 'components/icons/ArrowDown';
import {CardVariants, CardVariantsInner} from 'utils/animations';
import {ZAP_OPTIONS_TO} from 'utils/zapOptions';
import {getBalances} from 'wido';
import {TDropdownOption} from 'types/types';
import Image from 'next/image';

type TCardAnyZapProps = {};

function	CardAnyZap({}: TCardAnyZapProps): ReactElement {
	const	{chainID} = useWeb3();
	const [options, set_options] = useState<TDropdownOption[]>([]);

	const	ADDRESS = '0x6568d65a8CB74A21F8cd7F6832E71Ab1E390f25E';

	useEffect((): void => {
		const fetchBalances = async (): Promise<void> => {
			const tokens = await getBalances(ADDRESS, [chainID]);
			set_options(tokens.map((token): TDropdownOption => ({
				label: token.name,
				value: toAddress(token.address),
				icon: (
					<Image
						alt={token.name}
						width={24}
						height={24}
						src={token.logoURI} />
				)})));
		};

		fetchBalances();
	}, [ADDRESS, chainID]);

	function	renderButton(): ReactElement {
		return (
			<Button
				onClick={(): void => {}}
				className={'w-full'}
				isBusy={false}
				isDisabled={false}>
				{'Swap'}
			</Button>
		);
	}

	return (
		<>
			<div aria-label={'card title'} className={'flex flex-col pb-8'}>
				<h2 className={'text-3xl font-bold'}>{'Anyzap'}</h2>
			</div>
			<div aria-label={'card description'} className={'w-full pb-10 md:w-[96%]'}>
				<p className={'text-neutral-600'}>{'description'}</p>
			</div>

			<div className={'grid grid-cols-2 gap-4'}>
				<label className={'relative z-20 flex flex-col space-y-1'}>
					<p className={'text-base text-neutral-600'}>{'Swap from'}</p>
					<Dropdown
						defaultOption={options[0]}
						options={options}
						selected={{label: 'label', value: 'value'}}
						onSelect={(): void => {}} />
					<p className={'pl-2 !text-xs font-normal !text-green-600'}>
						{'fromVaultAPY'}
					</p>
				</label>
				<div className={'flex flex-col space-y-1'}>
					<p className={'text-base text-neutral-600'}>{'Amount'}</p>
					<div className={'flex h-10 items-center bg-neutral-300 p-2'}>
						<b className={'overflow-x-scroll scrollbar-none'}>{0}</b>
					</div>
					<p className={'pl-2 text-xs font-normal text-neutral-600'}>
						{0}
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
					<p className={'text-base text-neutral-600'}>{'Swap to'}</p>
					<Dropdown
						defaultOption={ZAP_OPTIONS_TO[0]}
						options={[]}
						selected={{label: 'label', value: 'value'}}
						onSelect={(): void => {}} />
					<p className={'pl-2 !text-xs font-normal !text-green-600'}>
						{'toVaultAPY'}
					</p>
				</label>
				<div className={'flex flex-col space-y-1'}>
					<div>
						<p className={'hidden text-base text-neutral-600 md:block'}>{'You will receive minimum'}</p>
						<p className={'block text-base text-neutral-600 md:hidden'}>{'You will receive min'}</p>
					</div>
					<div className={'flex h-10 items-center bg-neutral-300 p-2'}>
						<b className={'overflow-x-scroll scrollbar-none'}>
							{0}
						</b>
					</div>
					<p className={'pl-2 text-xs font-normal text-neutral-600'}>
						{0}
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

function	CardAnyZapWrapper(): ReactElement {
	const	[txStatusApprove, set_txStatusApprove] = useState(defaultTxStatus);
	const	[txStatusZap, set_txStatusZap] = useState(defaultTxStatus);
	
	return (
		<div>
			<motion.div
				initial={'rest'} whileHover={'hover'} animate={'rest'}
				variants={CardVariants as never}
				className={'hidden h-[733px] w-[592px] items-center justify-end lg:flex'}
				custom={!txStatusApprove.none || !txStatusZap.none}>
				<motion.div
					variants={CardVariantsInner as never}
					custom={!txStatusApprove.none || !txStatusZap.none}
					className={'h-[701px] w-[560px] bg-neutral-100 p-12'}>
					<CardAnyZap />
				</motion.div>
			</motion.div>
			<div className={'w-full bg-neutral-100 p-4 md:p-8 lg:hidden'}>
				<CardAnyZap />
			</div>
		</div>
	);
}

export default CardAnyZapWrapper;
