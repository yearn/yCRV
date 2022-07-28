import	React, {ReactElement}			from	'react';

function	About(): ReactElement {
	return (
		<section className={'mt-4 grid w-full grid-cols-2 gap-10'}>
			<div className={'w-full bg-neutral-100 p-12'} style={{boxShadow: '0px 4px 28px 0px hsla(0, 0%, 0%, 0.25)'}}>
				<div aria-label={'card title'} className={'flex flex-col pb-8'}>
					<h2 className={'text-3xl font-bold'}>{'Win the curve wars'}</h2>
					<h2 className={'text-3xl font-bold'}>{'with Yearn.'}</h2>
				</div>
				<div aria-label={'card description'}>
					<p className={'text-neutral-600'}>{'yveCRV and yvBOOST are no longer supported (RIP), but you can easily migrate them to our new and improved tokens. Simply swap below and start earning that sweet sweet yield. '}</p>
				</div>
			</div>


			<div className={'w-full bg-neutral-100 p-12'} style={{boxShadow: '0px 4px 28px 0px hsla(0, 0%, 0%, 0.25)'}}>
				<div aria-label={'card title'} className={'flex flex-col pb-8'}>
					<h2 className={'text-3xl font-bold'}>{'Swap anytime for'}</h2>
					<h2 className={'text-3xl font-bold'}>{'better yield.'}</h2>
				</div>
				<div aria-label={'card description'}>
					<p className={'pb-4 text-neutral-600'}>{'If you have st-yCRV and notice that lp-yCRV is generating better yield, you can swap anytime on the main page. Or vice versa.'}</p>
					<p className={'text-neutral-600'}>{'You get more yield, and a fun swap experience. Win win.'}</p>
				</div>
			</div>


			<div className={'w-full bg-neutral-100 p-12'} style={{boxShadow: '0px 4px 28px 0px hsla(0, 0%, 0%, 0.25)'}}>
				<div aria-label={'card title'} className={'flex flex-col pb-8'}>
					<h2 className={'text-3xl font-bold'}>{'Better tokens,'}</h2>
					<h2 className={'text-3xl font-bold'}>{'better yield.'}</h2>
				</div>
				<div aria-label={'card description'}>
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


			<div className={'w-full bg-neutral-100 p-12'} style={{boxShadow: '0px 4px 28px 0px hsla(0, 0%, 0%, 0.25)'}}>
				<div aria-label={'card title'} className={'flex flex-col pb-8'}>
					<h2 className={'text-3xl font-bold'}>{'“But ser... I have yveCRV'}</h2>
					<h2 className={'text-3xl font-bold'}>{'and yvBOOST”'}</h2>
				</div>
				<div aria-label={'card description'}>
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
		</section>
	);
}

export default About;
