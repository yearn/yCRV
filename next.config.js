const withPWA = require('next-pwa');

module.exports = withPWA({
	images: {
		domains: [
			'rawcdn.githack.com',
			'raw.githubusercontent.com'
		]
	},
	pwa: {
		dest: 'public',
		register: true,
		skipWaiting: true,
		disable: process.env.NODE_ENV === 'development'
	},
	env: {
		/* 🔵 - Yearn Finance **************************************************
		** Config over the RPC
		**********************************************************************/
		WEB_SOCKET_URL: {
			1: process.env.WS_URL_MAINNET,
			250: process.env.WS_URL_FANTOM,
			42161: process.env.WS_URL_ARBITRUM
		},
		JSON_RPC_URL: {
			1: process.env.RPC_URL_MAINNET,
			250: process.env.RPC_URL_FANTOM,
			42161: process.env.RPC_URL_ARBITRUM
		},
		ALCHEMY_KEY: process.env.ALCHEMY_KEY,
		INFURA_KEY: process.env.INFURA_KEY,

		BASE_YEARN_ASSETS_URI: 'https://raw.githubusercontent.com/yearn/yearn-assets/master/icons/multichain-tokens/',

		YVECRV_TOKEN_ADDRESS: '0xc5bDdf9843308380375a611c18B50Fb9341f502A',
		YVBOOST_TOKEN_ADDRESS: '0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a',
		CRV_TOKEN_ADDRESS: '0xD533a949740bb3306d119CC777fa900bA034cd52',

		CVXCRV_TOKEN_ADDRESS: '0x62b9c7356a2dc64a1969e19c23e4f579f9810aa7',

		THREECRV_TOKEN_ADDRESS: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
		ZAP_YEARN_VE_CRV_ADDRESS: '0xF8981FB33b45aeac48CacC12d845A7C11dA5fC6E',
		YVECRV_POOL_LP_ADDRESS: '0x7E46fd8a30869aa9ed55af031067Df666EfE87da',

		YCRV_TOKEN_ADDRESS: '0x0000000000000000000000000000000000000001',
		STYCRV_TOKEN_ADDRESS: '0x0000000000000000000000000000000000000002',
		LPYCRV_TOKEN_ADDRESS: '0x0000000000000000000000000000000000000003',
		VLYCRV_TOKEN_ADDRESS: '0x0000000000000000000000000000000000000004'
	}
});
