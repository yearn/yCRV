import	React, {ReactElement}				from	'react';
import	{motion}							from	'framer-motion';
import	{Button, Input}						from	'@yearn-finance/web-lib/components';
import	{format, toAddress}					from	'@yearn-finance/web-lib/utils';
import	{useWallet}							from	'contexts/useWallet';
import	{useYearn}							from	'contexts/useYearn';
import	{CardVariantsInner, CardVariants}	from	'utils/animations';

function	CardYveCRV(): ReactElement {
	const	{balances, yveCRVClaimable} = useWallet();
	const	{yveCRVData} = useYearn();
	const	[yveCrvAmount, set_yveCrvAmount] = React.useState('');
	const	[crvAmount, set_crvAmount] = React.useState('');
	const	[receiveAmount] = React.useState('420.00000000 LP yveCRV');

	return (
		<motion.div
			initial={'rest'} whileHover={'hover'} animate={'rest'}
			variants={CardVariants}
			className={'flex h-[784px] w-[440px] items-center justify-start'}>
			<motion.div
				variants={CardVariantsInner}
				className={'h-[752px] w-[416px] bg-neutral-100 p-12'}>
				<div aria-label={'card title'} className={'flex flex-col pb-8'}>
					<h2 className={'text-3xl font-bold'}>{'Swag'}</h2>
					<h2 className={'text-3xl font-bold'}>{'with yveCRV LP'}</h2>
				</div>
					
				<div aria-label={'vault data'} className={'mb-6 grid grid-cols-12 gap-4'}>
					<div className={'col-span-8'}>
						<p className={'mb-2'}>{'Vault Balance'}</p>
						<b className={'text-lg'}>
							{format.amount(balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].normalized, 8, 8)}
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
					
				<div aria-label={'card title'} className={'mb-7 space-y-4'}>
					<div>
						<label className={'yearn--input'}>
							<p className={'text-base text-neutral-600'}>{'yveCRV'}</p>
							<Input
								value={yveCrvAmount}
								type={'number'}
								min={0}
								onChange={(s: unknown): void => set_yveCrvAmount(s as string)}
								onSearch={(s: unknown): void => set_yveCrvAmount(s as string)}
								placeholder={'0.00000000'} />
							<p
								onClick={(): void => set_yveCrvAmount(balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].normalized.toFixed(18))}
								className={'cursor-pointer pl-2 !text-xs font-normal text-neutral-600'}>
								{
									balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].symbol === '' ? 
										'-' :
										`You have ${format.amount(balances[toAddress(process.env.YVECRV_TOKEN_ADDRESS)].normalized, 8, 8)}`
								}
							</p>
						</label>
					</div>
					<div>
						<label className={'yearn--input mb-4'}>
							<p className={'text-base text-neutral-600'}>{'CRV'}</p>
							<Input
								value={crvAmount}
								type={'number'}
								min={0}
								onChange={(s: unknown): void => set_crvAmount(s as string)}
								onSearch={(s: unknown): void => set_crvAmount(s as string)}
								placeholder={'0.00000000'} />
							<p
								onClick={(): void => set_crvAmount(balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].normalized.toFixed(18))}
								className={'cursor-pointer pl-2 !text-xs font-normal text-neutral-600'}>
								{
									balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].symbol === '' ? 
										'-' :
										`You have ${format.amount(balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].normalized, 8, 8)}`
								}
							</p>
						</label>
					</div>
					<div>
						<label className={'yveCRV--input mb-4'}>
							<p className={'text-base text-neutral-600'}>{'You will receive'}</p>
							<div className={'h-10 bg-neutral-0 p-2 text-base font-bold'}>
								{receiveAmount}
							</div>
						</label>
					</div>
				</div>

				<div aria-label={'card actions'}>
					<div className={'mb-4'}>
						<p className={'text-xs'}>{'Bonus slippage 0.69%'}</p>
					</div>
					<div className={'mb-3'}>
						<Button className={'w-full'}>
							{'Stake'}
						</Button>
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
