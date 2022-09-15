import React, {ReactElement} from 'react';
import CardZap from 'components/swagRock/CardZap';
import CardMigrateLegacy from 'components/swagRock/CardMigrateLegacy';

function	Index(): ReactElement {
	return (
		<section id={'swap'} className={'mt-0 flex w-full flex-col items-center justify-center space-y-10 space-x-0 md:flex-row md:space-y-0 md:space-x-4 lg:space-x-0'}>
			<CardMigrateLegacy />
			<CardZap />
		</section>
	);
}

export default Index;
