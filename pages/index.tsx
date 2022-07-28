import	React, {ReactElement}	from	'react';
import	CardZap					from	'components/swagRock/CardZap';
import	CardMigrateLegacy		from	'components/swagRock/CardMigrateLegacy';

function	Index(): ReactElement {
	return (
		<section className={'mt-0 flex w-full flex-row items-center justify-center'}>
			<CardMigrateLegacy />
			<CardZap />
		</section>
	);
}

export default Index;
