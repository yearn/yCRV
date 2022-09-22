/* eslint-disable @typescript-eslint/explicit-function-return-type */
const withPWA = require('next-pwa')({
	dest: 'public',
	disable: process.env.NODE_ENV !== 'production'
});
const {PHASE_EXPORT} = require('next/constants');


module.exports = (phase) => withPWA({
	assetPrefix: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT ? './' : '/',
	images: {
		unoptimized: process.env.IPFS_BUILD === 'true' || phase === PHASE_EXPORT, //Exporting image does not support optimization
		domains: [
			'rawcdn.githack.com',
			'raw.githubusercontent.com'
		]
	},
	env: {
		/* 🔵 - Yearn Finance **************************************************
		** Config over the RPC
		**********************************************************************/
		WEB_SOCKET_URL: {
			1: process.env.WS_URL_MAINNET,
			10: process.env.WS_URL_OPTIMISM,
			250: process.env.WS_URL_FANTOM,
			42161: process.env.WS_URL_ARBITRUM
		},
		JSON_RPC_URL: {
			1: process.env.RPC_URL_MAINNET,
			10: process.env.RPC_URL_OPTIMISM,
			250: process.env.RPC_URL_FANTOM,
			42161: process.env.RPC_URL_ARBITRUM
		},
		ALCHEMY_KEY: process.env.ALCHEMY_KEY,
		INFURA_KEY: process.env.INFURA_KEY,

		YDAEMON_BASE_URI: 'https://ydaemon.yearn.finance',
		// YDAEMON_BASE_URI: 'http://localhost:8080',
		BASE_YEARN_ASSETS_URI: 'https://raw.githubusercontent.com/yearn/yearn-assets/master/icons/multichain-tokens/',

		YVECRV_TOKEN_ADDRESS: '0xc5bDdf9843308380375a611c18B50Fb9341f502A',
		YVBOOST_TOKEN_ADDRESS: '0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a',
		CRV_TOKEN_ADDRESS: '0xD533a949740bb3306d119CC777fa900bA034cd52',

		THREECRV_TOKEN_ADDRESS: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
		YVECRV_POOL_LP_ADDRESS: '0x7E46fd8a30869aa9ed55af031067Df666EfE87da',

		YCRV_TOKEN_ADDRESS: '0x4c1317326fD8EFDeBdBE5e1cd052010D97723bd6',
		STYCRV_TOKEN_ADDRESS: '0x8a0889d47f9Aa0Fac1cC718ba34E26b867437880',
		LPYCRV_TOKEN_ADDRESS: '0x61f46C65E403429266e8b569F23f70dD75d9BeE7',
		GAUGEYCRV_TOKEN_ADDRESS: '0x9672D72D5843ca5C6b1E0CC676E106920D6a650E',
		ZAP_YEARN_VE_CRV_ADDRESS: '0x6F3c2647f0C0fBcCbaF74c400D886033F8c6d2E6',
		
		VLYCRV_TOKEN_ADDRESS: '0x0000000000000000000000000000000000000004'
	},
	async headers() {
		return [
			{
				source: '/',
				headers: [
					{
						key: 'cross-origin-opener-policy',
						value: 'same-origin'
					},
					{
						key: 'cross-origin-embedder-policy',
						value: 'require-corp'
					}
				]
			}
		];
	}

});
