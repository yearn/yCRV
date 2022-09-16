import React, {ReactElement} from 'react';
import {AppProps} from 'next/app';
import {AnimatePresence, motion} from 'framer-motion';
import {WithYearn} from '@yearn-finance/web-lib/contexts';
import {Button} from '@yearn-finance/web-lib/components';
import {WalletContextApp} from 'contexts/useWallet';
import {YearnContextApp} from 'contexts/useYearn';
import {CurveContextApp} from 'contexts/useCurve';
import Header from 'components/Header';
import Meta from 'components/Meta';

import	'../style.css';
import Script from 'next/script';

const transition = {duration: 0.3, ease: [0.17, 0.67, 0.83, 0.67]};
const variants = {
	initial: {y: 20, opacity: 0},
	enter: {y: 0, opacity: 1, transition},
	exit: {y: -20, opacity: 0, transition}
};

function	TextAnimation(): ReactElement {
	return (
		<>
			<Script src={'/textanimation.js'} />
			<div className={'text'}>
				<p className={'wordWrapper'}> 
					<span className={'word'}>{'Gigantic'}</span>
					<span className={'word'}>{'Seismic'}</span>
					<span className={'word'}>{'Substantial'}</span>
					<span className={'word'}>{'Immense'}</span>
					<span className={'word'}>{'Colossal'}</span>
					<span className={'word'}>{'Humongous'}</span>
					<span className={'word'}>{'Giant'}</span>
					<span className={'word'}>{'Stupendous'}</span>
					<span className={'word'}>{'Jumbo'}</span>
				</p>
			</div>
		</>
	);
}

function	WithLayout(props: AppProps): ReactElement {
	const	{Component, pageProps, router} = props;

	const isNop = false;
	if (isNop) {
		return (
			<Component
				router={props.router}
				{...pageProps} />
		);
	}

	return (
		<div id={'app'} className={'mx-auto mb-0 flex max-w-6xl'}>
			<div className={'flex min-h-[100vh] w-full flex-col'}>
				<Header />
				<AnimatePresence exitBeforeEnter>
					<motion.div
						key={router.asPath}
						initial={'initial'}
						animate={'enter'}
						exit={'exit'}
						className={'h-full'}
						variants={variants}>
						<div className={'mx-auto mt-20 mb-44 flex w-full max-w-6xl flex-col items-center justify-center'}>
							<div className={'relative h-12 w-[600px] md:h-[104px]'}>
								<TextAnimation />
							</div>
							<div className={'mt-8 mb-6'}>
								<p className={'text-center text-lg md:text-2xl'}>{'Whatever word you choose, get supercharged yields on CRV with Yearn.'}</p>
							</div>
							<div>
								<Button
									as={'a'}
									href={'#swap'}
									className={'w-full'}>
									{'To the yield!'}
								</Button>
							</div>
						</div>
						{/* <Component
							router={props.router}
							{...pageProps} /> */}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}


function	MyApp(props: AppProps): ReactElement {
	const	{Component, pageProps} = props;
	
	return (
		<WithYearn
			options={{
				ui: {
					shouldUseThemes: false
				}
			}}>
			<WalletContextApp>
				<YearnContextApp>
					<CurveContextApp>
						<>
							<Meta />
							<WithLayout
								Component={Component}
								pageProps={pageProps}
								router={props.router} />
							<div id={'app'} className={'mx-auto mb-0 flex max-w-6xl'}>
								<div className={'flex min-h-[100vh] w-full flex-col'}>
									<div className={'fixed top-0 z-10 w-full max-w-6xl'}>
										<Header />
									</div>
									<div className={'absolute inset-0 flex items-center justify-center bg-black'}>
										<h1 className={'mb-40 animate-pulse text-6xl font-bold text-white'}>{'R.I.P ALPHA'}</h1>
									</div>
								</div>
							</div>
						</>
					</CurveContextApp>
				</YearnContextApp>
			</WalletContextApp>
		</WithYearn>
	);
}

export default MyApp;
