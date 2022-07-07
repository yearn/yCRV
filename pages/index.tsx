import	React, {ReactElement}	from	'react';
import	CardYvBoost				from	'components/swagRock/CardYvBoost';
import	CardYveCRV				from	'components/swagRock/CardYveCRV';
import	CardZap					from	'components/swagRock/CardZap';

function	Index(): ReactElement {
	return (
		<section className={'mt-0 flex w-full flex-row items-center justify-center'}>
			<CardYveCRV />
			<CardZap />
			<CardYvBoost />
		</section>
	);
}

export default Index;
