import React, {ReactElement} from 'react';
import {AppProps} from 'next/app';
import {AnimatePresence, motion} from 'framer-motion';
import {WithYearn} from '@yearn-finance/web-lib/contexts';
import {WalletContextApp} from 'contexts/useWallet';
import {YearnContextApp} from 'contexts/useYearn';
import {CurveContextApp} from 'contexts/useCurve';
import Header from 'components/Header';
import Meta from 'components/Meta';

import	'../style.css';

const transition = {duration: 0.3, ease: [0.17, 0.67, 0.83, 0.67]};
const variants = {
	initial: {y: 20, opacity: 0},
	enter: {y: 0, opacity: 1, transition},
	exit: {y: -20, opacity: 0, transition}
};

function	WithLayout(props: AppProps): ReactElement {
	const	{Component, pageProps, router} = props;

	return (
		<div id={'app'} className={'mx-auto mb-0 flex max-w-6xl'}>
			<div className={'flex min-h-[100vh] w-full flex-col'}>
				<Header />
				<AnimatePresence mode={'wait'}>
					<motion.div
						key={router.asPath}
						initial={'initial'}
						animate={'enter'}
						exit={'exit'}
						className={'my-0 h-full md:mb-0 md:mt-16'}
						variants={variants}>
						<Component
							router={props.router}
							{...pageProps} />
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
}

function	MyApp(props: AppProps): ReactElement {
	const	{Component, pageProps} = props;
	
	const isNop = false;
	if (isNop) {
		return (
			<WithLayout
				Component={Component}
				pageProps={pageProps}
				router={props.router} />
		);
	}

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
							{/* <div id={'app'} className={'mx-auto mb-0 flex max-w-6xl'}>
								<div className={'flex min-h-[100vh] w-full flex-col'}>
									<div className={'fixed inset-x-0 top-0 z-10 mx-auto w-full max-w-6xl'}>
										<Header />
									</div>
									<div className={'absolute inset-0 flex items-center justify-center bg-black'}>
										<h1 className={'mb-40 animate-pulse text-4xl font-bold text-white md:text-6xl'}>{'R.I.P. ALPHA'}</h1>
									</div>
								</div>
							</div> */}
						</>
					</CurveContextApp>
				</YearnContextApp>
			</WalletContextApp>
		</WithYearn>
	);
}

export default MyApp;
