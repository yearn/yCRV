import React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useWeb3} from '@yearn-finance/web-lib/contexts/useWeb3';
import Header from '@yearn-finance/web-lib/layouts/Header.next';
import BalanceReminderPopover from '@common/components/BalanceReminderPopover';
import {useMenu} from '@common/contexts/useMenu';
import {LogoYCRV, MenuYCRVOptions} from '@yCRV/Header';

import type {ReactElement} from 'react';

export function	AppHeader(): ReactElement {
	const	router = useRouter();
	const	{isActive} = useWeb3();
	const	{onOpenMenu} = useMenu();
	
	return (
		<Header
			linkComponent={<Link href={''} />}
			currentPathName={router.pathname}
			onOpenMenuMobile={onOpenMenu}
			nav={MenuYCRVOptions}
			logo={<LogoYCRV />}
			extra={isActive ? (
				<div className={'ml-4'}>
					<BalanceReminderPopover />
				</div>
			) : <div />}
		/>
	);
}
