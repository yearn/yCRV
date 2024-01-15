import {useWallet} from '@yearn-finance/web-lib/contexts/useWallet';
import {toAddress} from '@yearn-finance/web-lib/utils/address';

import type {TAddress, TDict} from '@yearn-finance/web-lib/types';
import type {TNormalizedBN} from '@yearn-finance/web-lib/utils/format.bigNumber';

export function useBalance({
	address,
	chainID
}: {
	address: string | TAddress;
	chainID: number;
	source?: TDict<TNormalizedBN>;
}): TNormalizedBN {
	const {getBalance} = useWallet();

	return getBalance({address: toAddress(address), chainID: chainID});
}