import React, {ReactElement, useMemo, useState} from 'react';
import {Card} from '@yearn-finance/web-lib/components';
import {useSettings} from '@yearn-finance/web-lib/contexts';

type TWrappedInput = {
	title: string;
	caption: string;
	initialValue: string;
	onSave: (value: string) => void;
}

function	WrappedInput({title, caption, initialValue, onSave}: TWrappedInput): ReactElement {
	const	[isFocused, set_isFocused] = useState(false);
	const	[value, set_value] = useState(initialValue);
	const	isInitialValue = useMemo((): boolean => value === initialValue, [value, initialValue]);

	return (
		<label>
			<p className={`transition-colors ${isFocused ? 'text-primary-500' : 'text-neutral-900'}`}>
				{title}
			</p>
			<div data-focused={isFocused} className={'yearn--input relative'}>
				<input
					onFocus={(): void => set_isFocused(true)}
					onBlur={(): void => set_isFocused(false)}
					className={'h-10 w-full overflow-x-scroll p-2 outline-none scrollbar-none border-2 border-neutral-700 bg-neutral-0'}
					placeholder={'Use default RPC'}
					value={value}
					type={'text'}
					onChange={(e): void => set_value(e.target.value)}
				/>
				<div className={`absolute inset-y-0 right-2 flex justify-center ${isInitialValue ? 'pointer-events-none opacity-0' : 'opacity-100'} transition-opacity`}>
					<button
						onClick={(): void => onSave(value)}
						className={'flex h-8 yearn--button bg-neutral-900'}>
						<p className={'text-sm text-neutral-0 '}>{'Save'}</p>
					</button>
				</div>
			</div>
			<p className={'mt-1 pl-2 text-xs transition-colors text-neutral-600'}>
				{caption}
			</p>
		</label>
	);
}


function	SectionRPCEndpoints(): ReactElement {
	const	{onUpdateNetworks} = useSettings();
	const	[, set_nonce] = useState(0);

	return (
		<Card className="bg-neutral-100 p-10">
			<div className={'flex w-full flex-row justify-between pb-4'}>
				<h2 className={'text-3xl font-bold'}>{'RPC Endpoints'}</h2>
			</div>
			<div className={'text-justify'}>
				<p>
					{'The RPC Endpoints are the ways in which your wallet communicates with a given network. Without this, the dApp will not be able to read or write informations on the blockchain.'}
				</p>
				<div className={'mt-4 grid grid-cols-1 gap-4'}>
					<WrappedInput
						title={''}
						caption={'Endpoint to use to read and write on the Ethereum Mainnet chain (chainID: 1).'}
						initialValue={''}
						onSave={(value): void => {
							onUpdateNetworks({1: {rpcURI: value}});
							set_nonce((n: number): number => n + 1);
						}} />

					<WrappedInput
						title={''}
						caption={'Endpoint to use to read and write on the Optimism chain (chainID: 10).'}
						initialValue={''}
						onSave={(value): void => {
							onUpdateNetworks({10: {rpcURI: value}});
							set_nonce((n: number): number => n + 1);
						}} />

					<WrappedInput
						title={''}
						caption={'Endpoint to use to read and write on the Fantom Opera chain (chainID: 250).'}
						initialValue={''}
						onSave={(value): void => {
							onUpdateNetworks({250: {rpcURI: value}});
							set_nonce((n: number): number => n + 1);
						}} />

					<WrappedInput
						title={''}
						caption={'Endpoint to use to read and write on the Arbitrum chain (chainID: 42161).'}
						initialValue={''}
						onSave={(value): void => {
							onUpdateNetworks({42161: {rpcURI: value}});
							set_nonce((n: number): number => n + 1);
						}} />
				</div>
			</div>
		</Card>
	);
}


function	SectionYearnAPIBaseURI(): ReactElement {
	const	{onUpdateBaseSettings, settings: baseAPISettings} = useSettings();

	return (
		<Card className="bg-neutral-100 p-10">
			<div className={'flex w-full flex-row justify-between pb-4'}>
				<h2 className={'text-3xl font-bold'}>{'Yearn\'s APIs'}</h2>
			</div>
			<div className={'text-justify'}>
				<p>
					{'The Yearn\'s API endpoints are used to get some specific Yearn\'s related information about the vaults, the strategies and much more.'}
				</p>
				<div className={'mt-4 grid grid-cols-1 gap-4'}>
					<WrappedInput
						title={''}
						caption={'yDaemon API endpoint to get the list of Vaults and Strategies along with their details.'}
						initialValue={baseAPISettings.yDaemonBaseURI}
						onSave={(value): void => onUpdateBaseSettings({
							...baseAPISettings,
							yDaemonBaseURI: value
						})} />
					<WrappedInput
						title={''}
						caption={'Legacy API endpoint to get the list of Vaults and Strategies along with their details.'}
						initialValue={baseAPISettings.apiBaseURI}
						onSave={(value): void => onUpdateBaseSettings({
							...baseAPISettings,
							apiBaseURI: value
						})} />
					<WrappedInput
						title={''}
						caption={'Meta API endpoint to get the some human readable information about the vaults, strategies and protocols.'}
						initialValue={baseAPISettings.metaBaseURI}
						onSave={(value): void => onUpdateBaseSettings({
							...baseAPISettings,
							metaBaseURI: value
						})} />
				</div>
			</div>
		</Card>
	);
}


function	DisclaimerPage(): ReactElement {
	return (
		<div className={'mt-4 grid w-full grid-cols-1 gap-10 pb-10 md:mt-20 md:grid-cols-2'}>
			<SectionYearnAPIBaseURI />
			<SectionRPCEndpoints />
		</div>
	);
}

export default DisclaimerPage;
