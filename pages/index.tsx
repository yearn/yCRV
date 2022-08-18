import	React, {ReactElement}	from	'react';
import	CardZap					from	'components/swagRock/CardZap';
import	CardMigrateLegacy		from	'components/swagRock/CardMigrateLegacy';

function	Index(): ReactElement {
	return (
		<section className={'mt-0 flex w-full flex-col items-center justify-center space-y-10 md:flex-row md:space-y-0'}>
			<CardMigrateLegacy />
			<CardZap />
		</section>
	);
}

export default Index;
