import {z} from 'zod';
import {toAddress} from '@builtbymom/web3/utils';

const curveGaugeSchema = z.object({
	swap: z.string().optional().transform(toAddress),
	swap_token: z.string().optional().transform(toAddress),
	name: z.string(),
	shortName: z.string().optional(),
	gauge: z.string().optional().transform(toAddress),
	gauge_data: z
		.object({
			inflation_rate: z.number().or(z.string()).optional().default('0'),
			working_supply: z.string().optional()
		})
		.optional(),
	gauge_controller: z
		.object({
			gauge_relative_weight: z.string().optional(),
			gauge_future_relative_weight: z.string().optional(),
			get_gauge_weight: z.string().optional(),
			inflation_rate: z.number().or(z.string()).optional().default('0')
		})
		.optional(),
	gaugeCrvApy: z
		.array(z.number())
		.optional()
		.catch(() => [0, 0]),
	gaugeFutureCrvApy: z
		.array(z.number())
		.optional()
		.catch(() => [0, 0]),
	swap_data: z
		.object({
			virtual_price: z.string().or(z.number().optional())
		})
		.optional(),
	factory: z.boolean(),
	side_chain: z.boolean().optional(),
	is_killed: z.boolean().optional(),
	hasNoCrv: z.boolean().optional(),
	type: z.string().optional(),
	lpTokenPrice: z.number().nullable().optional(),
	rewardPerGauge: z.string().array().optional()
});

export const curveAllGaugesSchema = z.object({
	success: z.boolean().optional(),
	data: z.record(z.string(), curveGaugeSchema),
	generatedTimeMs: z.number().optional()
});

export type TCurveGauge = z.infer<typeof curveGaugeSchema>;
export type TCurveAllGauges = z.infer<typeof curveAllGaugesSchema>;
