import {cloneElement, Fragment, useState} from 'react';
import Link from 'next/link';
import {Popover, Transition} from '@headlessui/react';
import {LogoYearn} from '@common/icons/LogoYearn';

import {APPS} from './HeaderPopover.apps';

import type {ReactElement} from 'react';

function LogoPopover(): ReactElement {
	const [isShowing, set_isShowing] = useState(false);

	return (
		<Popover
			onMouseEnter={(): void => set_isShowing(true)}
			onMouseLeave={(): void => set_isShowing(false)}
			className={'relative'}>
			<Popover.Button className={'flex items-center'}>
				<Link href={'/'}>
					<span className={'sr-only'}>{'Back to home'}</span>
					<LogoYearn
						className={'h-8 w-8'}
						back={'text-neutral-900'}
						front={'text-neutral-0'}
					/>
				</Link>
			</Popover.Button>
			<Transition
				as={Fragment}
				show={isShowing}
				enter={'transition ease-out duration-200'}
				enterFrom={'opacity-0 translate-y-1'}
				enterTo={'opacity-100 translate-y-0'}
				leave={'transition ease-in duration-150'}
				leaveFrom={'opacity-100 translate-y-0'}
				leaveTo={'opacity-0 translate-y-1'}>
				<Popover.Panel
					className={'absolute left-1/2 z-10 mt-0 w-80 -translate-x-1/2 px-4 pt-4 sm:px-0 md:w-96'}>
					<div className={'overflow-hidden rounded-lg border border-neutral-200 shadow-lg'}>
						<div className={'relative grid grid-cols-2 bg-neutral-0 md:grid-cols-3'}>
							{Object.values(APPS).map(({name, href, icon}): ReactElement => {
								return (
									<Link
										prefetch={false}
										key={name}
										href={href}
										onClick={(): void => set_isShowing(false)}>
										<div
											onClick={(): void => set_isShowing(false)}
											className={
												'flex cursor-pointer flex-col items-center p-4 transition-colors hover:bg-neutral-200'
											}>
											<div>{cloneElement(icon)}</div>
											<div className={'pt-2 text-center'}>
												<b className={'text-base'}>{name}</b>
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					</div>
				</Popover.Panel>
			</Transition>
		</Popover>
	);
}

export {LogoPopover};
