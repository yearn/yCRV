import React, {memo} from 'react';
import localFont from 'next/font/local';
import {useRouter} from 'next/router';
import {YCRVContextApp} from 'apps/useYCRV';
import {AnimatePresence, motion} from 'framer-motion';
import {Analytics} from '@vercel/analytics/react';
import {arbitrum, base, fantom, mainnet, optimism, polygon} from '@wagmi/chains';
import {WithYearn} from '@yearn-finance/web-lib/contexts/WithYearn';
import {cl} from '@yearn-finance/web-lib/utils/cl';
import {localhost} from '@yearn-finance/web-lib/utils/wagmi/networks';
import AppHeader from '@common/components/Header';
import Meta from '@common/components/Meta';
import {CurveContextApp} from '@common/contexts/useCurve';
import {WalletContextApp} from '@common/contexts/useWallet';
import {YearnContextApp} from '@common/contexts/useYearn';
import {variants} from '@common/utils/animations';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

const aeonik = localFont({
	variable: '--font-aeonik',
	display: 'swap',
	src: [
		{
			path: '../public/fonts/Aeonik-Regular.woff2',
			weight: '400',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Bold.woff2',
			weight: '700',
			style: 'normal'
		},
		{
			path: '../public/fonts/Aeonik-Black.ttf',
			weight: '900',
			style: 'normal'
		}
	]
});

function AppWrapper(props: AppProps): ReactElement {
	const router = useRouter();
	const {Component, pageProps} = props;

	return (
		<>
			<Meta />
			<div
				id={'app'}
				className={cl('mx-auto mb-0 flex font-aeonik')}>
				<div className={'block h-full min-h-max w-full'}>
					<AppHeader />
					<div className={'mx-auto my-0 max-w-6xl pt-4 md:mb-0 md:mt-16 md:!px-0'}>
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
									{...pageProps}
								/>
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</div>
			<Analytics />
		</>
	);
}

/**** 🔵 - Yearn Finance ***************************************************************************
 ** The 'App' function is a React functional component that returns a ReactElement. It uses several
 ** hooks and components to build the main structure of the application.
 **
 ** The 'useCurrentApp' hook is used to get the current app manifest.
 **
 ** The 'MenuContextApp', 'YearnContextApp', and 'WalletContextApp' are context providers that
 ** provide global state for the menu, Yearn, and wallet respectively.
 ** The 'Meta' component is used to set the meta tags for the page.
 ** The 'WithLayout' component is a higher-order component that wraps the current page component
 ** and provides layout for the page.
 **
 ** The 'NetworkStatusIndicator' component is used to display the network status.
 ** The returned JSX structure is wrapped with the context providers and includes the meta tags,
 ** layout, and network status indicator.
 **************************************************************************************************/
const App = memo(function App(props: AppProps): ReactElement {
	const {Component, pageProps} = props;

	return (
		<YearnContextApp>
			<WalletContextApp>
				<YCRVContextApp>
					<CurveContextApp>
						<AppWrapper
							Component={Component}
							pageProps={pageProps}
							router={props.router}
						/>
					</CurveContextApp>
				</YCRVContextApp>
			</WalletContextApp>
		</YearnContextApp>
	);
});

/**** 🔵 - Yearn Finance ***************************************************************************
 ** The 'MyApp' function is a React functional component that returns a ReactElement. It is the main
 ** entry point of the application.
 **
 ** It uses the 'WithYearn' context provider to provide global state for Yearn. The 'WithYearn'
 ** component is configured with a list of supported chains and some options.
 **
 ** The 'App' component is wrapped with the 'WithYearn' component to provide it with the Yearn
 ** context.
 **
 ** The returned JSX structure is a main element with the 'WithYearn' and 'App' components.
 **************************************************************************************************/
function MyApp(props: AppProps): ReactElement {
	return (
		<main className={cl('flex flex-col h-screen', aeonik.className)}>
			<WithYearn
				supportedChains={[mainnet, optimism, polygon, fantom, base, arbitrum, localhost]}
				options={{
					baseSettings: {
						yDaemonBaseURI: process.env.YDAEMON_BASE_URI as string
					},
					ui: {shouldUseThemes: false}
				}}>
				<App {...props} />
			</WithYearn>
		</main>
	);
}

export default MyApp;
