import React from 'react';
import Image from 'next/image';
import {toAddress} from '@yearn-finance/web-lib/utils';
import {TDropdownOption} from 'types/types';

const	LEGACY_OPTIONS_FROM: TDropdownOption[] = [
	{
		label: 'yvBOOST',
		value: toAddress(process.env.YVBOOST_TOKEN_ADDRESS as string),
		zapVia: toAddress(process.env.ZAP_YEARN_VE_CRV_ADDRESS as string),
		icon: (
			<Image
				alt={'yvBOOST'}
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.YVBOOST_TOKEN_ADDRESS)}/logo-128.png`} />
		)
	}, {
		label: 'yveCRV',
		value: toAddress(process.env.YVECRV_TOKEN_ADDRESS as string),
		zapVia: toAddress(process.env.ZAP_YEARN_VE_CRV_ADDRESS as string),
		icon: (
			<Image
				alt={'yveCRV'}
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.YVECRV_TOKEN_ADDRESS)}/logo-128.png`}
				loading={'eager'}
				priority />
		)
	}
];

const	LEGACY_OPTIONS_TO: TDropdownOption[] = [
	{
		label: 'st-yCRV',
		value: toAddress(process.env.STYCRV_TOKEN_ADDRESS as string),
		zapVia: toAddress(process.env.ZAP_YEARN_VE_CRV_ADDRESS as string),
		icon: (
			<Image
				alt={'st-yCRV'}
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.STYCRV_TOKEN_ADDRESS)}/logo-128.png`}
				loading={'eager'}
				priority />
		)
	}, {
		label: 'yCRV',
		value: toAddress(process.env.YCRV_TOKEN_ADDRESS as string),
		zapVia: toAddress(process.env.ZAP_YEARN_VE_CRV_ADDRESS as string),
		icon: (
			<Image
				alt={'yCRV'}
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.YCRV_TOKEN_ADDRESS)}/logo-128.png`}
				loading={'eager'}
				priority />
		)
	},
	{
		label: 'lp-yCRV',
		value: toAddress(process.env.LPYCRV_TOKEN_ADDRESS as string),
		zapVia: toAddress(process.env.ZAP_YEARN_VE_CRV_ADDRESS as string),
		icon: (
			<Image
				alt={'lp-yCRV'}
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.LPYCRV_TOKEN_ADDRESS)}/logo-128.png`}
				loading={'eager'}
				priority />
		)
	} 
// {
// 	label: 'vl-yCRV',
// 	value: toAddress(process.env.VLYCRV_TOKEN_ADDRESS as string),
// 	icon: (
// 		<Image
// 			alt={'vl-yCRV'}
// 			width={24}
// 			height={24}
// 			src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.VLYCRV_TOKEN_ADDRESS)}/logo-128.png`}
// 			loading={'eager'}
// 			priority />
// 	)
// }
];

const	ZAP_OPTIONS_FROM: TDropdownOption[] = [
	{
		label: 'CRV',
		value: toAddress(process.env.CRV_TOKEN_ADDRESS as string),
		zapVia: toAddress(process.env.ZAP_YEARN_VE_CRV_ADDRESS as string),
		icon: (
			<Image
				alt={'CRV'}
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.CRV_TOKEN_ADDRESS)}/logo-128.png`} />
		)
	},
	...LEGACY_OPTIONS_TO,
	{
		label: 'Curve CRV/yCRV',
		value: toAddress(process.env.YCRV_CURVE_POOL_ADDRESS as string),
		zapVia: toAddress(process.env.LPYCRV_TOKEN_ADDRESS as string),
		icon: (
			<Image
				alt={'Curve CRV/yCRV'}
				width={24}
				height={24}
				src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.YCRV_CURVE_POOL_ADDRESS)}/logo-128.png`} />
		)
	}
];


const	ZAP_OPTIONS_TO: TDropdownOption[] = [...LEGACY_OPTIONS_TO,
	{
		label: 'Eth (debugging)',
		value: toAddress('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'),
		icon: (
			<Image
				alt={'eth'}
				width={24}
				height={24}
				src={'https://www.covalenthq.com/static/images/icons/display-icons/ethereum-eth-logo.png'}
				loading={'eager'}
				priority />
		)
	}];


export {
	LEGACY_OPTIONS_FROM, LEGACY_OPTIONS_TO, ZAP_OPTIONS_FROM, ZAP_OPTIONS_TO
};