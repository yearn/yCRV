import React, {ReactElement, useState} from 'react';
import {useWallet} from 'contexts/useWallet';

function	About(): ReactElement {
	const	{slippage, set_slippage} = useWallet();
	const	[localSlippage, set_localSlippage] = useState(slippage);

	return (
		<section className={'mt-4 grid w-full grid-cols-1 gap-10 pb-10 md:mt-20 md:grid-cols-2'}>

			<div className={'w-full'}>
				<p className={'pb-6 text-3xl text-neutral-900'}>{'Yearn has'}</p>
				<b className={'text-7xl text-neutral-900'}>{'29,244,486 veCRV'}</b>
			</div>
			<div className={'w-full'}>
				<p className={'pb-6 text-3xl text-neutral-900'}>{'You\'ve earned'}</p>
				<b className={'text-7xl text-neutral-900'}>{'$69,420'}</b>
			</div>

			<div className={'w-full bg-neutral-100 p-10'}>
				<div aria-label={'Win the curve wars with Yearn'} className={'flex flex-col pb-6'}>
					<h2 className={'text-3xl font-bold'}>{'Win the curve wars'}</h2>
					<h2 className={'text-3xl font-bold'}>{'with Yearn.'}</h2>
				</div>
				<div aria-label={'Win the curve wars with Yearn details'}>
					<p className={' pb-4 text-neutral-600'}>{'We’ve completely overhauled our suite of curve products; refining, improving, and simplifying everything. The result? Our users get the highest yields, in the most streamlined way possible. Lfg.'}</p>
					<p className={'text-neutral-600'}>
						{'For more info on each token, and how to use the UI read our '}
						<a
							href={'https://docs.yearn.finance/getting-started/products/ycrv/overview'}
							target={'_blank'}
							className={'text-neutral-900 underline'}
							rel={'noreferrer'}>{'docs'}
						</a>
						{'.'}
					</p>
				</div>
			</div> 

			<div className={'w-full bg-neutral-100 p-10'}>
				<div aria-label={'Swap anytime for better yield'} className={'flex flex-col pb-6'}>
					<h2 className={'text-3xl font-bold'}>{'Swap anytime for'}</h2>
					<h2 className={'text-3xl font-bold'}>{'better yield.'}</h2>
				</div>
				<div aria-label={'Swap anytime for better yield details'}>
					<p className={'pb-4 text-neutral-600'}>
						{'If you have '}
						<span className={'text-neutral-900'}>{'st-yCRV'}</span>
						{' and notice that '}
						<span className={'text-neutral-900'}>{'lp-yCRV'}</span>
						{' is generating better yield, you can swap anytime on the main page. Or vice versa.'}
					</p>
					<p className={'text-neutral-600'}>{'You get more yield, and a fun swap experience. Win win.'}</p>
				</div>
			</div>


		</section>
	);
}

export default About;
