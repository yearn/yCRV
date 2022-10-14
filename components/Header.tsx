import React, {ReactElement, useEffect, useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useWeb3} from '@yearn-finance/web-lib/contexts';
import {truncateHex} from '@yearn-finance/web-lib/utils';
import {ModalMobileMenu} from '@yearn-finance/web-lib/components';
import LogoYearn from 'components/icons/LogoYearn';
import BalanceReminderPopover from './BalanceReminderPopover';


function	Header(): ReactElement {
	const	router = useRouter();
	const	{isActive, address, ens, openLoginModal, onDesactivate, onSwitchChain} = useWeb3();
	const	[hasMobileMenu, set_hasMobileMenu] = useState(false);
	const	[walletIdentity, set_walletIdentity] = useState('Connect Wallet');

	useEffect((): void => {
		if (!isActive && address) {
			set_walletIdentity('Invalid Network');
		} else if (ens) {
			set_walletIdentity(ens);
		} else if (address) {
			set_walletIdentity(truncateHex(address, 4));
		} else {
			set_walletIdentity('Connect Wallet');
		}
	}, [ens, address, isActive]);

	return (
		<>
			<header className={'gfixed inset-x-0 top-0 z-50 mb-5 flex w-full max-w-[1200px] flex-row items-center justify-between bg-neutral-0 p-4 text-xs sm:text-sm md:inset-x-auto md:mb-0 md:px-0 md:text-base'}>
				<nav className={'col-s hidden w-1/3 flex-row items-center space-x-3 md:flex md:space-x-6'}>
					<Link href={'/'}>
						<p className={`yveCRV--nav-link ${router.pathname === '/' ? 'active' : '' }`}>
							{'Main'}
						</p>
					</Link>
					{/* <Link href={'/new-vaults'}>
						<p className={`yveCRV--nav-link ${router.pathname === '/new-vaults' ? 'active' : '' }`}>
							{'New Vaults'}
						</p>
					</Link> */}
					{/* <Link href={'/vote'}>
						<p className={`yveCRV--nav-link ${router.pathname === '/vote' ? 'active' : '' }`}>
							{'Vote'}
						</p>
					</Link> */}
					<Link href={'/about'}>
						<p className={`yveCRV--nav-link ${router.pathname === '/about' ? 'active' : '' }`}>
							{'About'}
						</p>
					</Link>
				</nav>
				<div className={'flex w-1/3 md:hidden'}>
					<button onClick={(): void => set_hasMobileMenu(true)}>
						<svg
							className={'text-neutral-500'}
							width={'20'}
							height={'20'}
							viewBox={'0 0 24 24'}
							fill={'none'}
							xmlns={'http://www.w3.org/2000/svg'}>
							<path d={'M2 2C1.44772 2 1 2.44772 1 3C1 3.55228 1.44772 4 2 4H22C22.5523 4 23 3.55228 23 3C23 2.44772 22.5523 2 22 2H2Z'} fill={'currentcolor'}/>
							<path d={'M2 8C1.44772 8 1 8.44772 1 9C1 9.55228 1.44772 10 2 10H14C14.5523 10 15 9.55228 15 9C15 8.44772 14.5523 8 14 8H2Z'} fill={'currentcolor'}/>
							<path d={'M1 15C1 14.4477 1.44772 14 2 14H22C22.5523 14 23 14.4477 23 15C23 15.5523 22.5523 16 22 16H2C1.44772 16 1 15.5523 1 15Z'} fill={'currentcolor'}/>
							<path d={'M2 20C1.44772 20 1 20.4477 1 21C1 21.5523 1.44772 22 2 22H14C14.5523 22 15 21.5523 15 21C15 20.4477 14.5523 20 14 20H2Z'} fill={'currentcolor'}/>
						</svg>
					</button>
				</div>
				<div className={'flex w-1/3 justify-center'}>
					<Link href={'/'}>
						<div className={'cursor-pointer'}>
							<LogoYearn className={'h-8 w-8'} />
						</div>
					</Link>
				</div>
				<div className={'flex w-1/3 items-center justify-end'}>
					<div
						onClick={(): void => {
							if (isActive) {
								onDesactivate();
							} else if (!isActive && address) {
								onSwitchChain(1, true);
							} else {
								openLoginModal();
							}
						}}>
						<p className={'yveCRV--nav-link text-sm'}>
							{walletIdentity}
						</p>
					</div>
					{isActive ? (
						<div className={'ml-4'}>
							<BalanceReminderPopover />
						</div>
					) : <div />}
				</div>
			</header>
			<ModalMobileMenu
				shouldUseWallets={true}
				shouldUseNetworks={false}
				isOpen={hasMobileMenu}
				onClose={(): void => set_hasMobileMenu(false)}>
				<Link href={'/'}>
					<div className={'mobile-nav-item'} onClick={(): void => set_hasMobileMenu(false)}>
						<p className={'font-bold'}>
							{'Home'}
						</p>
					</div>
				</Link>
				{/* <Link href={'/new-vaults'}>
					<div className={'mobile-nav-item'} onClick={(): void => set_hasMobileMenu(false)}>
						<p className={'font-bold'}>
							{'New Vaults'}
						</p>
					</div>
				</Link> */}
				{/* <Link href={'/vote'}>
					<div className={'mobile-nav-item'} onClick={(): void => set_hasMobileMenu(false)}>
						<p className={'font-bold'}>
							{'Vote'}
						</p>
					</div>
				</Link> */}
				<Link href={'/about'}>
					<div className={'mobile-nav-item'} onClick={(): void => set_hasMobileMenu(false)}>
						<p className={'font-bold'}>
							{'About'}
						</p>
					</div>
				</Link>
			</ModalMobileMenu>
		</>
	);
}

export default Header;
