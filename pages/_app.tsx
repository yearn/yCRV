import React, {ReactElement} from 'react';
import {AppProps} from 'next/app';
import {AnimatePresence, motion} from 'framer-motion';
import {WithYearn} from '@yearn-finance/web-lib/contexts';
import Header from 'components/Header';
import Meta from 'components/Meta';
import {CurveContextApp} from 'contexts/useCurve';
import {WalletContextApp} from 'contexts/useWallet';
import {YCRVContextApp} from 'contexts/useYCRV';
import {YearnContextApp} from 'contexts/useYearn';

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
	
	return (
		<WithYearn
			options={{
				baseSettings: {yDaemonBaseURI: process.env.YDAEMON_BASE_URI as string},
				ui: {shouldUseThemes: false}
			}}>
			<WalletContextApp>
				<YearnContextApp>
					<YCRVContextApp>
						<CurveContextApp>
							<>
								<Meta />
								<WithLayout
									Component={Component}
									pageProps={pageProps}
									router={props.router} />
							</>
						</CurveContextApp>
					</YCRVContextApp>
				</YearnContextApp>
			</WalletContextApp>
		</WithYearn>
	);
}

export default MyApp;
