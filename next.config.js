const dotenv = require('dotenv-webpack');

module.exports = ({
	plugins: [new dotenv()],
	images: {
		domains: [
			'rawcdn.githack.com',
			'raw.githubusercontent.com'
		]
	},
	env: {
		/* 🔵 - Yearn Finance **************************************************
		** Stuff used for the SEO or some related elements, like the title, the
		** github url etc.
		**********************************************************************/
		WEBSITE_URI: 'https://web.ycorpo.com/',
		WEBSITE_NAME: 'yWeb',
		WEBSITE_TITLE: 'yWeb',
		WEBSITE_DESCRIPTION: 'Template used for Yearn\'s projects',
		PROJECT_GITHUB_URL: 'https://github.com/yearn/yearn-template',

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

		CRV_TOKEN_ADDRESS: '0xD533a949740bb3306d119CC777fa900bA034cd52',
		YVBOOST_TOKEN_ADDRESS: '0x9d409a0A012CFbA9B15F6D4B36Ac57A46966Ab9a',
		YVECRV_TOKEN_ADDRESS: '0xc5bDdf9843308380375a611c18B50Fb9341f502A',
		CVXCRV_TOKEN_ADDRESS: '0x62b9c7356a2dc64a1969e19c23e4f579f9810aa7',
		THREECRV_TOKEN_ADDRESS: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
		ZAP_YEARN_VE_CRV_ADDRESS: '0x1b5f844A68E12143ce0f509Af4f015564998f92F',
		YVECRV_POOL_LP_ADDRESS: '0x7E46fd8a30869aa9ed55af031067Df666EfE87da'
	}
});
