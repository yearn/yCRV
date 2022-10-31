import React, {ReactElement, useRef} from 'react';
import Link from 'next/link';
import {Button} from '@yearn-finance/web-lib/components';
import {useClientEffect} from '@yearn-finance/web-lib/hooks';
import CardAnyZap from 'components/swagRock/CardAnyZap';

function	TextAnimation(): ReactElement {
	const	interval = useRef<NodeJS.Timer>();
	const	areAlreadySplited = useRef<boolean>(false);
	const	wordArray = useRef<HTMLSpanElement[][]>([]);

	function	onStartAnimation(): void {
		const words = document.querySelectorAll<HTMLElement>('.word');
		let currentWord = 0;

		words[currentWord].style.opacity = '1';
		if (!areAlreadySplited.current) {
			for (const word of words) {
				splitLetters(word);
			}
			areAlreadySplited.current = true;
		}

		function changeWord(): void {
			const cw = wordArray.current[currentWord];
			const nw = currentWord == words.length-1 ? wordArray.current[0] : wordArray.current[currentWord+1];
			if (!cw || !nw) {
				return;
			}
			for (let i = 0; i < cw.length; i++) {
				animateLetterOut(cw, i);
			}
  
			for (let i = 0; i < nw.length; i++) {
				nw[i].className = 'letter behind';
				if (nw?.[0]?.parentElement?.style) {
					nw[0].parentElement.style.opacity = '1';
				}
				animateLetterIn(nw, i);
			}
			currentWord = (currentWord == wordArray.current.length-1) ? 0 : currentWord+1;
		}

		function animateLetterOut(cw: HTMLSpanElement[], i: number): void {
			setTimeout((): void => {
				cw[i].className = 'letter out';
			}, i*80);
		}

		function animateLetterIn(nw: HTMLSpanElement[], i: number): void {
			setTimeout((): void => {
				nw[i].className = 'letter in';
			}, 340+(i*80));
		}

		function splitLetters(word: HTMLSpanElement): void {
			const content = word.innerHTML;
			word.innerHTML = '';
			const letters = [];
			for (let i = 0; i < content.length; i++) {
				const letter = document.createElement('span');
				letter.className = 'letter';
				letter.innerHTML = content.charAt(i);
				word.appendChild(letter);
				letters.push(letter);
			}
  
			wordArray.current.push(letters);
		}

		setTimeout((): void => {
			changeWord();
			setInterval(changeWord, 3000);
		}, 3000);
	}

	function	clearAnimation(): void {
		if (interval.current) {
			clearInterval(interval.current);
		}
	}

	useClientEffect((): void => {
		onStartAnimation();
		return clearAnimation();
	}, []);

	return (
		<>
			<div className={'text'}>
				<p className={'wordWrapper'}> 
					<span className={'word'}>{'Gigantic'}</span>
					<span className={'word'}>{'Seismic'}</span>
					<span className={'word'}>{'Substantial'}</span>
					<span className={'word'}>{'Immense'}</span>
					<span className={'word'}>{'Colossal'}</span>
					<span className={'word'}>{'Humongous'}</span>
					<span className={'word'}>{'Giant'}</span>
					<span className={'word'}>{'Stupendous'}</span>
					<span className={'word'}>{'Jumbo'}</span>
				</p>
			</div>
		</>
	);
}

function	Index(): ReactElement {
	return (
		<>
			<div className={'mx-auto mb-20 flex w-full max-w-6xl flex-col items-center justify-center'}>
				<div className={'relative mt-10 h-12 w-[300px] md:h-[104px] md:w-[600px]'}>
					<TextAnimation />
				</div>
				<div className={'mt-8 mb-10'}>
					<b className={'text-center text-lg md:text-2xl'}>{'Whatever word you choose, get supercharged yields on CRV with Yearn.'}</b>
					<p className={'mt-8 whitespace-pre text-center text-base text-neutral-600'}>
						{'The best CRV yields in DeFi are just a swap away.\nSwap between yCRV ecosystem tokens, or from most ERC20 tokens. '}
					</p>
				</div>
				<div>
					<Link href={'/about'}>
						<Button className={'w-full'}>
							{'Learn more!'}
						</Button>
					</Link>
				</div>
			</div>
			<section id={'swap'} className={'mt-0 flex w-full flex-col items-center justify-center space-y-10 space-x-0 md:flex-row md:space-y-0 md:space-x-4 lg:space-x-0'}>
				<CardAnyZap />
			</section>
		</>
	);
}

export default Index;