import React, {cloneElement, Fragment, ReactElement, useMemo, useRef} from 'react';
import {Menu, Transition} from '@headlessui/react';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {format, toAddress} from '@yearn-finance/web-lib/utils';
import IconChevron from 'components/icons/IconChevron';
import useWallet from 'contexts/useWallet';

import type {TBalanceData, TDropdownItemProps, TDropdownProps} from 'types/types';

function DropdownItem({
	option,
	onSelect,
	balances,
	buttonRef
}: TDropdownItemProps): ReactElement {
	const	balance = useMemo((): TBalanceData | null => balances?.[toAddress(option.value)] || null, [balances, option.value]);

	return (
		<Menu.Item>
			{({active}): ReactElement => (
				<div
					onClick={(): void => {
						onSelect(option);
						setTimeout((): void => buttonRef.current?.click(), 0);
					}}
					data-active={active}
					className={'yveCRV--dropdown-menu-item'}>
					<div className={'h-6 w-6 rounded-full'}>
						{option?.icon ? cloneElement(option.icon) : null}
					</div>
					<div>
						<p className={`${option.icon ? 'pl-2' : 'pl-0'} font-normal text-neutral-900`}>
							{option.label}
						</p>
						<p className={`${option.icon ? 'pl-2' : 'pl-0'} text-xxs font-normal text-neutral-600`}>
							{`${format.amount(balance?.normalized || 0, 2, 2)} ${option.symbol}`}
						</p>
					</div>
				</div>
			)}
		</Menu.Item>
	);
}

function DropdownEmpty(): ReactElement {
	const {isActive, openLoginModal} = useWeb3();

	if (!isActive) {
		return (
			<div
				onClick={(): void => openLoginModal()}
				className={'flex h-14 cursor-pointer flex-col items-center justify-center px-4 text-center transition-colors hover:bg-neutral-300'}>
				<b className={'text-neutral-900'}>{'Connect Wallet'}</b>
			</div>
		);
	}
		return (
			<div className={'relative flex h-14 flex-col items-center justify-center px-4 text-center'}>
				<div className={'flex h-10 items-center justify-center'}>
					<span className={'loader'} />
				</div>
			</div>
		);
}	

function Dropdown({
	options,
	defaultOption,
	selected,
	onSelect,
	placeholder = '',
	balances
}: TDropdownProps): ReactElement {
	const buttonRef = useRef<HTMLButtonElement>(null);

	return (
		<div>
			<Menu as={'menu'} className={'relative inline-block w-full text-left'}>
				{({open}): ReactElement => (
					<>
						<Menu.Button
							ref={buttonRef}
							className={'flex h-10 w-full items-center justify-between bg-neutral-0 px-3 py-2 text-base text-neutral-900'}>
							<div className={'flex flex-row items-center'}>
								{selected?.icon ? cloneElement(selected.icon) : <div className={'h-6 w-6 rounded-full bg-neutral-500'} />}
								<p className={`pl-2 ${(!selected?.label && !defaultOption?.label) ? 'text-neutral-400' : 'text-neutral-900'} font-normal`}>
									{selected?.label || defaultOption?.label || placeholder}
								</p>
							</div>
							<IconChevron className={`ml-3 h-6 w-6 transition-transform ${open ? '-rotate-180' : 'rotate-0'}`} />
						</Menu.Button>
						<Transition
							as={Fragment}
							show={open}
							enter={'transition duration-100 ease-out'}
							enterFrom={'transform scale-95 opacity-0'}
							enterTo={'transform scale-100 opacity-100'}
							leave={'transition duration-75 ease-out'}
							leaveFrom={'transform scale-100 opacity-100'}
							leaveTo={'transform scale-95 opacity-0'}>
							<Menu.Items className={'yveCRV--dropdown-menu'}>
								{options.length === 0 ? (
									<DropdownEmpty />
								): (
									options.map((option, index): ReactElement => (
										<DropdownItem 
											key={option?.label || index}
											option={option}
											onSelect={onSelect}
											balances={balances}
											buttonRef={buttonRef} />
									)
									))}
							</Menu.Items>
						</Transition>
					</>
				)}
			</Menu>
		</div>
	);
}

export {Dropdown};