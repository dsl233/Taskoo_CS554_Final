import React, { forwardRef, RefObject, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { PieChart,TreemapChart,SunburstChart } from 'echarts/charts';
import { GraphicComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { Box } from '@mui/material';
import { ChartProps } from '@/@types/props';


const Chart: React.ForwardRefRenderFunction<RefObject<HTMLElement>, ChartProps> = (
	{ option, sx, height = '100%', width = '100%' },
	ref
) => {
	const chartRef = useRef<HTMLDivElement>(null);

	useImperativeHandle(ref, () => ({ current: chartRef.current }));

	let chart: echarts.ECharts;
	useLayoutEffect(() => {
		const resize = () => {
			chart?.resize();
		};

		if (!chart) {
			chart = echarts.init(chartRef.current!);
			chartRef.current?.addEventListener('resize', resize);
		}
		chart.setOption(option);

		return () => {
			chartRef.current?.removeEventListener('resize', resize);
			echarts.dispose(chart);
		};
	}, [option]);

	return <Box sx={{ ...sx, width, height }} ref={chartRef}></Box>;
};

echarts.use([
	GraphicComponent,
	CanvasRenderer,
	PieChart,
	TooltipComponent,
	LegendComponent,
	LabelLayout,
	UniversalTransition,
	TreemapChart,
	SunburstChart
]);


export default forwardRef(Chart);
