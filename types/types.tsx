import {ReactElement} from 'react';
import {BigNumber} from 'ethers';

export type TYearnVault = {
    inception: number,
    address: string,
    symbol: string,
    display_symbol: string,
    formated_symbol: string,
    name: string,
    display_name: string,
    formated_name: string,
    icon: string,
    token: {
        address: string,
        name: string,
        display_name: string,
        symbol: string,
        description: string,
        decimals: number,
        icon: string,
    },
    tvl: {
        total_assets: string,
        tvl: number,
        price: number
    },
    apy: {
        type: string,
        gross_apr: number,
        net_apy: number,
        fees: {
            performance: number,
            withdrawal: number,
            management: number,
            keep_crv: number,
            cvx_keep_crv: number
        },
        points: {
            week_ago: number,
            month_ago: number,
            inception: number,
        },
        composite: {
            boost: number,
            pool_apy: number,
            boosted_apr: number,
            base_apr: number,
            cvx_apr: number,
            rewards_apr: number
        }
    },
    strategies: [{
		address: string,
		name: string,
		description: string,
    }],
	details: {
		apyTypeOverride: string,
	},
    endorsed: boolean,
    version: string,
    decimals: number,
    type: string,
    emergency_shutdown: boolean,
    updated: number,
    migration: {
        available: boolean,
        address: string,
    }
}

export type TCurveGauges = {
	swap: string
	swap_token: string
	name: string
	gauge: string
	type: string
	side_chain: boolean
	is_killed: boolean
	factory: boolean
	gauge_controller: {
		get_gauge_weight: string
		gauge_relative_weight: string
		inflation_rate: string
	}
	gauge_data: {
		working_supply: string
		inflation_rate: string
	}
	swap_data: {
		virtual_price: string
	}
}

export type	TClaimable = {
	raw: BigNumber,
	normalized: number,
}

export type TDropdownOption = {
	icon?: ReactElement;
	label: string;
	value: string | unknown;
	zapVia?: string;
};

export type TDropdownProps = {
	options: TDropdownOption[];
	defaultOption?: TDropdownOption;
	selected?: TDropdownOption;
	placeholder?: string;
	onSelect:
		| React.Dispatch<React.SetStateAction<TDropdownOption>>
		| ((option: TDropdownOption) => void);
};

export type	TNormalizedBN = {
	raw: BigNumber,
	normalized: number | '',
}