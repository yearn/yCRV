import React from 'react';
import Head from 'next/head';
import Script from 'next/script';

import meta from '../../../public/manifest.json';

import type {ReactElement} from 'react';

function Meta(): ReactElement {
	return (
		<>
			<Head>
				<title>{meta.name}</title>
				<meta
					httpEquiv={'X-UA-Compatible'}
					content={'IE=edge'}
				/>
				<meta
					name={'viewport'}
					content={
						'minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover'
					}
				/>
				<meta
					name={'description'}
					content={meta.name}
				/>
				<meta
					name={'msapplication-TileColor'}
					content={meta.title_color}
				/>
				<meta
					name={'theme-color'}
					content={meta.theme_color}
				/>

				<meta
					name={'application-name'}
					content={meta.name}
				/>
				<meta
					name={'apple-mobile-web-app-title'}
					content={meta.name}
				/>
				<meta
					name={'apple-mobile-web-app-capable'}
					content={'yes'}
				/>
				<meta
					name={'apple-mobile-web-app-status-bar-style'}
					content={'default'}
				/>
				<meta
					name={'format-detection'}
					content={'telephone=no'}
				/>
				<meta
					name={'mobile-web-app-capable'}
					content={'yes'}
				/>
				<meta
					name={'msapplication-config'}
					content={'/favicons/browserconfig.xml'}
				/>
				<meta
					name={'msapplication-tap-highlight'}
					content={'no'}
				/>

				<link
					rel={'manifest'}
					href={'/manifest.json'}
				/>
				<link
					rel={'mask-icon'}
					href={'/favicons/safari-pinned-tab.svg'}
					color={meta.theme_color}
				/>
				<link
					rel={'shortcut icon'}
					type={'image/x-icon'}
					href={'/favicons/favicon.ico'}
				/>
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'32x32'}
					href={'/favicons/favicon-32x32.png'}
				/>
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'16x16'}
					href={'/favicons/favicon-16x16.png'}
				/>
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'512x512'}
					href={'/favicons/favicon-512x512.png'}
				/>
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'192x192'}
					href={'/favicons/android-icon-192x192.png'}
				/>
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'144x144'}
					href={'/favicons/android-icon-144x144.png'}
				/>
				<link
					rel={'apple-touch-icon'}
					href={'/favicons/apple-icon.png'}
				/>
				<link
					rel={'apple-touch-icon'}
					sizes={'152x152'}
					href={'/favicons/apple-icon-152x152.png'}
				/>
				<link
					rel={'apple-touch-icon'}
					sizes={'180x180'}
					href={'/favicons/apple-icon-180x180.png'}
				/>
				<link
					rel={'apple-touch-icon'}
					sizes={'167x167'}
					href={'/favicons/apple-icon-167x167.png'}
				/>
				<link
					rel={'icon'}
					type={'image/png'}
					sizes={'512x512'}
					href={'/favicons/favicon-512x512.png'}
				/>
				<meta
					name={'googlebot'}
					content={'index,nofollow'}
				/>
				<meta charSet={'utf-8'} />
				<meta
					property={'twitter:image'}
					content={meta.og}
				/>
				<meta
					property={'twitter:card'}
					content={'summary_large_image'}
				/>
				<meta
					property={'twitter:title'}
					content={meta.name}
				/>
				<meta
					property={'twitter:description'}
					content={meta.description}
				/>

				<meta
					property={'og:image'}
					content={meta.og}
				/>
				<meta
					property={'og:url'}
					content={meta.uri}
				/>
				<meta
					property={'og:title'}
					content={meta.name}
				/>
				<meta
					property={'og:description'}
					content={meta.description}
				/>
			</Head>

			<Script
				defer
				data-domain={`${meta.domain}`}
				src={'/js/script.js'}
			/>
		</>
	);
}

export default Meta;
