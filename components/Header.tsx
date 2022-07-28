import	React, {ReactElement}		from	'react';
import	Link						from	'next/link';
import	{useRouter}					from	'next/router';
import	{useWeb3}					from	'@yearn-finance/web-lib/contexts';
import	{truncateHex}				from	'@yearn-finance/web-lib/utils';
import	LogoYearn					from	'components/icons/LogoYearn';


function	Header(): ReactElement {
	const	router = useRouter();
	const	{isActive, address, ens, openLoginModal, onDesactivate, onSwitchChain} = useWeb3();
	const	[walletIdentity, set_walletIdentity] = React.useState('Connect Wallet');

	React.useEffect((): void => {
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
			<header className={'flex flex-row items-center justify-between pt-4 pb-9 text-xs sm:text-sm md:mb-0 md:text-base'}>
				<nav className={'flex w-1/3 flex-row items-center space-x-3 md:space-x-6'}>
					<Link href={'/'}>
						<p className={`yveCRV--nav-link ${router.pathname === '/' ? 'active' : '' }`}>
							{'Main'}
						</p>
					</Link>
					<Link href={'/new-vaults'}>
						<p className={`yveCRV--nav-link ${router.pathname === '/new-vaults' ? 'active' : '' }`}>
							{'New Vaults'}
						</p>
					</Link>
					<Link href={'/about'}>
						<p className={`yveCRV--nav-link ${router.pathname === '/about' ? 'active' : '' }`}>
							{'About'}
						</p>
					</Link>
				</nav>
				<div className={'flex w-1/3 justify-center'}>
					<Link href={'/'}>
						<div className={'cursor-pointer'}>
							<LogoYearn className={'h-8 w-8'} />
						</div>
					</Link>
				</div>
				<div className={'flex w-1/3 justify-end'} onClick={(): void => {
					if (isActive) {
						onDesactivate();
					} else if (!isActive && address) {
						onSwitchChain(1, true);
					} else {
						openLoginModal();
					}
				}}>
					<p className={'yveCRV--nav-link'}>
						{walletIdentity}
					</p>
				</div>
			</header>
		</>
	);
}

export default Header;
