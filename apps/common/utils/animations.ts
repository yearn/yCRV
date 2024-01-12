export const transition = {duration: 0.4, ease: 'easeInOut'};

export const variants = {
	initial: {y: -80, opacity: 0, transition},
	enter: {y: 0, opacity: 1, transition},
	exit: {y: -80, opacity: 0, transition}
};
