import	React, {ReactElement}			from	'react';
import	{motion}						from	'framer-motion';
import	{Modal, Card, Button, Input}	from	'@yearn-finance/web-lib/components';
import	{Cross}							from	'@yearn-finance/web-lib/icons';
import	{format, toAddress}				from	'@yearn-finance/web-lib/utils';
import	{useWallet}						from	'contexts/useWallet';
import	IconArrow						from	'components/icons/IconArrow';
import	{CardZapVariants}				from	'utils/animations';

function	CardZap(): ReactElement {
	const	{balances} = useWallet();
	const	[isZapModalOpen, set_isZapModalOpen] = React.useState(false);
	const	[fromAmount, set_fromAmount] = React.useState('');
	return (
		<>
			<motion.div
				onClick={(): void => set_isZapModalOpen(true)}
				initial={'rest'} whileHover={'hover'} animate={'rest'}
				variants={CardZapVariants}
				className={'z-10 -mx-12 flex h-[104px] w-[88px] cursor-pointer flex-col items-center justify-center space-y-1 bg-neutral-900'}>
				<IconArrow />
				<IconArrow className={'rotate-180'} />
				<div className={'mt-4'}>
					<p className={'font-bold text-neutral-0'}>{'Zap'}</p>
				</div>
			</motion.div>

			<Modal isOpen={isZapModalOpen} onClose={(): void => set_isZapModalOpen(false)} className={'yveCRV--zap-modal'}>
				<Card variant={'background'} padding={'relaxed'}>
					<div aria-label={'card title'} className={'relative flex flex-col pb-10'}>
						<h2 className={'text-3xl font-bold'}>{'Zap'}</h2>
						<h2 className={'text-3xl font-bold'}>{'yvCRV LP → yvBOOST'}</h2>
						<div role={'button'} className={'absolute top-0 right-0 cursor-pointer'} onClick={(): void => set_isZapModalOpen(false)}>
							<Cross className={'h-6 w-6 text-neutral-900'} />
						</div>
					</div>

					<div aria-label={'input group from'} className={'mb-6 flex flex-row space-x-4'}>
						<label className={'yveCRV--input-alt w-full'}>
							<p className={'text-base text-neutral-600'}>{'From'}</p>
							<Input
								value={fromAmount}
								type={'number'}
								className={'tabular-nums'}
								min={0}
								onChange={(s: unknown): void => set_fromAmount(s as string)}
								onSearch={(s: unknown): void => set_fromAmount(s as string)}
								placeholder={'0.00000000'} />
							<p
								onClick={(): void => set_fromAmount(balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].normalized.toFixed(18))}
								className={'cursor-pointer pl-2 !text-xs font-normal text-neutral-600'}>
								{
									balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].symbol === '' ? 
										'-' :
										`You have ${format.amount(balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].normalized, 8, 8)}`
								}
							</p>
						</label>
						<div className={'w-[88px] space-y-1'}>
							<p className={'text-base text-neutral-600'}>{'APY'}</p>
							<div className={'h-10 bg-neutral-200 p-2 text-base'}>
								{'69%'}
							</div>
						</div>
					</div>

					<div aria-label={'input group to'} className={'mb-11 flex flex-row space-x-4'}>
						<div className={'w-full space-y-1'}>
							<p className={'text-base text-neutral-600'}>{'To'}</p>
							<div className={'h-10 bg-neutral-200 p-2 text-base'}>
								{fromAmount === '' ? '' : format.amount(balances[toAddress(process.env.CRV_TOKEN_ADDRESS)].normalized, 8, 8)}
							</div>
						</div>
						<div className={'w-[88px] space-y-1'}>
							<p className={'text-base text-neutral-600'}>{'APY'}</p>
							<div className={'h-10 bg-neutral-200 p-2 text-base'}>
								{'420%'}
							</div>
						</div>
					</div>

					<div aria-label={'actions'}>
						<div className={'mb-4'}>
							<p className={'text-xs'}>{'Est. gas 0.4 ETH'}</p>
						</div>
						<div>
							<Button className={'w-full'} onClick={(): void => set_isZapModalOpen(false)}>
								{'Zap'}
							</Button>
						</div>
					</div>
				</Card>
			</Modal>

		</>
	);
}

export default CardZap;
