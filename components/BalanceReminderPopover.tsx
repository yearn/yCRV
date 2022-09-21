import React, {Fragment, ReactElement} from 'react';
import {Popover, Transition} from '@headlessui/react';
import {Wallet} from '@yearn-finance/web-lib/icons';
import {useWallet} from 'contexts/useWallet';
import {format, toAddress} from '@yearn-finance/web-lib/utils';
import Image from 'next/image';

export default function BalanceReminderPopover(): ReactElement {
	const	{balances} = useWallet();

	return (
		<Popover className={'relative flex'}>
			{(): ReactElement => (
				<>
					<Popover.Button>
						<Wallet className={'yveCRV--nav-link mt-0.5 h-4 w-4'} />
					</Popover.Button>
					<Transition
						as={Fragment}
						enter={'transition ease-out duration-200'}
						enterFrom={'opacity-0 translate-y-1'}
						enterTo={'opacity-100 translate-y-0'}
						leave={'transition ease-in duration-150'}
						leaveFrom={'opacity-100 translate-y-0'}
						leaveTo={'opacity-0 translate-y-1'}
					>
						<Popover.Panel className={'absolute right-0 top-6 z-50 mt-3 w-screen max-w-[200px] md:top-4 md:-right-4 md:max-w-[280px]'}>
							<div className={'overflow-hidden'}>
								<div className={'border border-neutral-200 bg-neutral-100 p-0'}>
									<a
										href={`https://etherscan.io/address/${process.env.YCRV_TOKEN_ADDRESS}`}
										target={'_blank'} rel={'noreferrer'}
										className={'flow-root px-3 py-2 transition-colors hover:bg-neutral-200 md:px-6 md:py-3'}>
										<span className={'flex flex-row items-center justify-between'}>
											<span className={'flex items-center text-neutral-900'}>
												<Image
													alt={'yCRV'}
													width={24}
													height={24}
													quality={90}
													src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.YCRV_TOKEN_ADDRESS)}/logo-128.png`} />
												<span className={'ml-2'}>{'yCRV'}</span>
											</span>
											<span className={'tabular-nums text-neutral-900'}>
												{format.amount(balances[toAddress(process.env.YCRV_TOKEN_ADDRESS)]?.normalized || 0, 2, 4)}
											</span>
										</span>
									</a>

									<a
										href={`https://etherscan.io/address/${process.env.STYCRV_TOKEN_ADDRESS}`}
										target={'_blank'} rel={'noreferrer'}
										className={'flow-root px-3 py-2 transition-colors hover:bg-neutral-200 md:px-6 md:py-3'}>
										<span className={'flex flex-row items-center justify-between'}>
											<span className={'flex items-center text-neutral-900'}>
												<Image
													alt={'st-yCRV'}
													width={24}
													height={24}
													quality={90}
													src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.STYCRV_TOKEN_ADDRESS)}/logo-128.png`} />
												<span className={'ml-2'}>{'st-yCRV'}</span>
											</span>
											<span className={'tabular-nums text-neutral-900'}>
												{format.amount(balances[toAddress(process.env.STYCRV_TOKEN_ADDRESS)]?.normalized || 0, 2, 4)}
											</span>
										</span>
									</a>

									<a
										href={`https://etherscan.io/address/${process.env.LPYCRV_TOKEN_ADDRESS}`}
										target={'_blank'} rel={'noreferrer'}
										className={'flow-root px-3 py-2 transition-colors hover:bg-neutral-200 md:px-6 md:py-3'}>
										<span className={'flex flex-row items-center justify-between'}>
											<span className={'flex items-center text-neutral-900'}>
												<Image
													alt={'lp-yCRV'}
													width={24}
													height={24}
													quality={90}
													src={`${process.env.BASE_YEARN_ASSETS_URI}/1/${toAddress(process.env.LPYCRV_TOKEN_ADDRESS)}/logo-128.png`} />
												<span className={'ml-2'}>{'lp-yCRV'}</span>
											</span>
											<span className={'tabular-nums text-neutral-900'}>
												{format.amount(balances[toAddress(process.env.LPYCRV_TOKEN_ADDRESS)]?.normalized || 0, 2, 4)}
											</span>
										</span>
									</a>


								</div>
							</div>
						</Popover.Panel>
					</Transition>
				</>
			)}
		</Popover>
	);
}
