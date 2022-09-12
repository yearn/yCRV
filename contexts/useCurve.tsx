import React, {createContext, useContext} from 'react';
import useSWR from 'swr';
import axios from 'axios';
import type {TCurveGauges} from 'types/types';

export type TCurveContext = {
	gauges: TCurveGauges[],
}
const	defaultProps: TCurveContext = {
	gauges: []
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const	fetcher = async (url: string): Promise<any> => axios.get(url).then((res): any => res.data);
const	CurveContext = createContext<TCurveContext>(defaultProps);
export const CurveContextApp = ({children}: {children: React.ReactElement}): React.ReactElement => {
	/* 🔵 - Yearn Finance ******************************************************
	**	Fetch all the CurveGauges to be able to create some new if required
	***************************************************************************/
	const	{data} = useSWR('https://api.curve.fi/api/getGauges', fetcher);

	/* 🔵 - Yearn Finance ******************************************************
	**	Setup and render the Context provider to use in the app.
	***************************************************************************/
	return (
		<CurveContext.Provider value={{gauges: Object.values(data?.data?.gauges || [])}}>
			{children}
		</CurveContext.Provider>
	);
};


export const useCurve = (): TCurveContext => useContext(CurveContext);
export default useCurve;