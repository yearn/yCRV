export const CardVariantsInner = {
	rest: (isFocused: boolean): unknown => ({
		width: isFocused ? 448 : 416,
		height: isFocused ? 784 : 752,
		padding: isFocused ? '64px' : '48px',
		boxShadow: isFocused ? '0px 4px 28px 0px hsla(0, 0%, 0%, 0.25)' : '0px 0px 0px 0px hsla(0, 0%, 0%, 0)',
		transition: {
			duration: 0.6,
			ease: [0.7, -0.4, 0.4, 1.4]
		}
	}),
	hover: {
		width: 448,
		height: 784,
		padding: '64px',
		boxShadow: '0px 4px 28px 0px hsla(0, 0%, 0%, 0.25)',
		transition: {
			duration: 0.6,
			ease: [0.7, -0.4, 0.4, 1.4]
		}
	}
};

export const CardVariants = {
	rest: (isFocused: boolean): unknown => ({
		width: isFocused ? 448 : 440,
		transition: {
			duration: 0.6,
			ease: [0.7, -0.4, 0.4, 1.4]
		}
	}),
	hover: {
		width: 448,
		transition: {
			duration: 0.6,
			ease: [0.7, -0.4, 0.4, 1.4]
		}
	}
};

export const CardZapVariants = {
	rest: {
		scale: 1,
		boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.32)',
		transition: {
			duration: 0.6,
			ease: [0.7, -0.4, 0.4, 1.4]
		}
	},
	hover: {
		scale: 1.2,
		boxShadow: '0px 4px 32px rgba(0, 0, 0, 0.32)',
		transition: {
			duration: 0.6,
			ease: [0.7, -0.4, 0.4, 1.4]
		}
	}
};