import	React, {ReactElement}			from	'react';

function	About(): ReactElement {
	return (
		<section className={'mt-4 grid w-full grid-cols-1 gap-10 md:grid-cols-2'}>
			<div className={'w-full bg-neutral-100 p-10'}>
				<div aria-label={'Win the curve wars with Yearn'} className={'flex flex-col pb-6'}>
					<h2 className={'text-3xl font-bold'}>{'Win the curve wars'}</h2>
					<h2 className={'text-3xl font-bold'}>{'with Yearn.'}</h2>
				</div>
				<div aria-label={'Win the curve wars with Yearn details'}>
					<p className={'text-neutral-600'}>{'We’ve completely overhauled our suite of curve products; refining, improving, and simplifying everything. The result? Our users get the highest yields, in the most streamlined way possible. Lfg.'}</p>
				</div>
			</div>


			<div className={'w-full bg-neutral-100 p-10'}>
				<div aria-label={'Swap anytime for better yield'} className={'flex flex-col pb-6'}>
					<h2 className={'text-3xl font-bold'}>{'Swap anytime for'}</h2>
					<h2 className={'text-3xl font-bold'}>{'better yield.'}</h2>
				</div>
				<div aria-label={'Swap anytime for better yield details'}>
					<p className={'pb-4 text-neutral-600'}>{'If you have st-yCRV and notice that lp-yCRV is generating better yield, you can swap anytime on the main page. Or vice versa.'}</p>
					<p className={'text-neutral-600'}>{'You get more yield, and a fun swap experience. Win win.'}</p>
				</div>
			</div>


			<div className={'w-full bg-neutral-100 p-10'}>
				<div aria-label={'Better tokens, better yield'} className={'flex flex-col pb-6'}>
					<h2 className={'text-3xl font-bold'}>{'Better tokens,'}</h2>
					<h2 className={'text-3xl font-bold'}>{'better yield.'}</h2>
				</div>
				<div aria-label={'Better tokens, better yield details'}>
					<p className={'pb-4 text-neutral-600'}>{'By simplifying our product (and naming conventions) we can focus on getting users the best ‘hands off’ yield around.'}</p>
					<p className={'pb-4 text-neutral-600'}>
						<span className={'text-neutral-900'}>{'yCRV'}</span>
						{' can be staked for '}
						<span className={'text-neutral-900'}>{'st-yCRV'}</span>
						{', or LP’d for '}
						<span className={'text-neutral-900'}>{'lp-yCRV'}</span>
						{'.'}
					</p>
					<p className={'text-neutral-600'}>{'Whichever option you pick, rewards are auto claimed and auto compound - giving you supercharged yield without you having to lift a finger. After all, lazy yield is the best yield.'}</p>
				</div>
			</div>


			<div className={'w-full bg-neutral-100 p-10'}>
				<div aria-label={'“But ser... I have yveCRV and yvBOOST”'} className={'flex flex-col pb-6'}>
					<h2 className={'text-3xl font-bold'}>{'“But ser... I have yveCRV'}</h2>
					<h2 className={'text-3xl font-bold'}>{'and yvBOOST”'}</h2>
				</div>
				<div aria-label={'“But ser... I have yveCRV and yvBOOST” details'}>
					<p className={'pb-4 text-neutral-600'}>
						{'Streamlining and simplifying our products means that '}
						<span className={'text-neutral-900'}>{'yveCRV'}</span>
						{' and '}
						<span className={'text-neutral-900'}>{'yvBOOST'}</span>
						{' are now legacy tokens that no longer earn yield (RIP).'}
					</p>
					<p className={'text-neutral-600'}>
						{'But *Professor Farnsworth voice* good news everybody; you can migrate them for '}
						<span className={'text-neutral-900'}>{'yCRV'}</span>
						{', '}
						<span className={'text-neutral-900'}>{'st-yCRV'}</span>
						{' or '}
						<span className={'text-neutral-900'}>{'lp-yCRV'}</span>
						{' on the main page.'}
					</p>
				</div>
			</div>

			<div className={'w-full bg-neutral-100 p-10'}>
				<div aria-label={'Don’t get caught slippin’'} className={'flex flex-col pb-6'}>
					<h2 className={'text-3xl font-bold'}>{'Don’t get '}</h2>
					<h2 className={'text-3xl font-bold'}>{'caught slippin’'}</h2>
				</div>
				<div aria-label={'Don’t get caught slippin’ details'}>
					<p className={'pb-4 text-neutral-600'}>
						{'Slippage is set to 1% and hidden by default to streamline the experience for the average user.'}
					</p>
					<p className={'pb-4 text-neutral-600'}>
						{'For advanced apes users worried about MEV we advise using flashbots rpc.'}
					</p>
					<p className={'text-neutral-600'}>
						{'If the above sentence causes your brain to wrinkle and eyes to glaze over, then you do not need to worry about this step. '}
					</p>
				</div>
			</div>
		</section>
	);
}

export default About;
