import	React, {ReactElement}						from	'react';
import	Image										from	'next/image';
import	{motion}									from	'framer-motion';
import	{Button, Input}								from	'@yearn-finance/web-lib/components';
import	{format, performBatchedUpdates, toAddress}	from	'@yearn-finance/web-lib/utils';
import	{useWallet}									from	'contexts/useWallet';
import	{useYearn}									from	'contexts/useYearn';
import	{Dropdown}									from	'components/TokenDropdown';
import	{CardVariantsInner, CardVariants}			from	'utils/animations';
import	{TDropdownOption}							from	'types/types';

function	CardYvBoost(): ReactElement {
	const	{balances} = useWallet();
	const	{yvBoostData} = useYearn();

	const	options: TDropdownOption[] = [{
		label: 'yveCRV',
		value: process.env.YVECRV_TOKEN_ADDRESS as string,
		icon: (
			<Image
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${process.env.YVECRV_TOKEN_ADDRESS}/logo-128.png`}
				loading={'eager'}
				priority />
		)
	}, {
		label: 'CRV',
		value: process.env.CRV_TOKEN_ADDRESS as string,
		icon: (
			<Image
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${process.env.CRV_TOKEN_ADDRESS}/logo-128.png`} />
		)
	}, {
		label: 'cvxCRV',
		value: process.env.CVXCRV_TOKEN_ADDRESS as string,
		icon: (
			<Image
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${process.env.CVXCRV_TOKEN_ADDRESS}/logo-128.png`} />
		)
	}];
	const	[selectedOption, set_selectedOption] = React.useState(options[0]);
	const	[amount, set_amount] = React.useState('');

	return (
		<motion.div
			initial={'rest'} whileHover={'hover'} animate={'rest'}
			variants={CardVariants}
			className={'flex h-[784px] w-[440px] items-center justify-end'}>
			<motion.div
				variants={CardVariantsInner}
				className={'h-[752px] w-[416px] bg-neutral-100 p-12'}>
				<div aria-label={'card title'} className={'flex flex-col pb-8'}>
					<h2 className={'text-3xl font-bold'}>{'Rock'}</h2>
					<h2 className={'text-3xl font-bold'}>{'with yvBoost'}</h2>
				</div>

				<div aria-label={'vault data'} className={'mb-6 grid grid-cols-12 gap-4'}>
					<div className={'col-span-8'}>
						<p className={'mb-2'}>{'Vault Balance'}</p>
						<b className={'text-lg'}>
							{format.amount(balances[toAddress(process.env.YVBOOST_TOKEN_ADDRESS)].normalized, 8, 8)}
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
										if (balances[toAddress(option.value as string)].raw.gt(0))
											set_amount(balances[toAddress(option.value as string)].normalized.toFixed(18));
										else
											set_amount('');
									});
								}} />
							<p className={'!text-xs font-normal text-neutral-600/0 opacity-0'}>{'-'}</p>
						</label>
					</div>
					<div>
						<label className={'yearn--input mb-4'}>
							<p className={'text-base text-neutral-600'}>{'Amount'}</p>
							<Input
								value={amount}
								type={'number'}
								min={0}
								onChange={(s: unknown): void => set_amount(s as string)}
								onSearch={(s: unknown): void => set_amount(s as string)}
								placeholder={'0.00000000'} />
							<p
								onClick={(): void => {
									if (balances[toAddress((selectedOption || options[0]).value as string)].raw.isZero())
										return;
									set_amount(balances[toAddress((selectedOption || options[0]).value as string)].normalized.toFixed(18));
								}}
								className={`pl-2 !text-xs font-normal text-neutral-600 ${balances[toAddress((selectedOption || options[0]).value as string)].raw.isZero() ? 'cursor-default' : 'cursor-pointer'}`}>
								{
									balances[toAddress((selectedOption || options[0]).value as string)].symbol === '' ? 
										'-' :
										`You have ${format.amount(balances[toAddress((selectedOption || options[0]).value as string)].normalized, 8, 8)}`
								}
							</p>
						</label>
					</div>
					<div>
						<label className={'yveCRV--input mb-4'}>
							<p className={'text-base text-neutral-600'}>{'You will receive'}</p>
							<Input
								value={amount}
								type={'number'}
								min={0}
								onChange={(s: unknown): void => set_amount(s as string)}
								onSearch={(s: unknown): void => set_amount(s as string)}
								placeholder={'0.00000000'} />
						</label>
					</div>
				</div>

				<div aria-label={'card actions'}>
					<div className={'mb-4'}>
						<p className={'text-xs'}>{'Note: irreversable operation'}</p>
					</div>
					<div className={'mb-3'}>
						<Button className={'w-full'}>
							{'Stake'}
						</Button>
					</div>
				</div>

			</motion.div>
		</motion.div>
	);
}

export default CardYvBoost;
