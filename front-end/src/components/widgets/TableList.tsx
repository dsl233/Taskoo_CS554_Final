import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Translation } from 'react-i18next';

interface TableListProps<O extends { _id: string; [prop: string]: any }> {
	showHeader?: boolean;
	header: (keyof O)[];
	data: O[] | Record<keyof O, any>[];
	size?: 'small' | 'medium';
}

export default class TableList<T extends DBCollections & { [prop: string]: any }> extends React.Component<
	TableListProps<T>
> {
	render() {
		const { header, data, showHeader = false, size } = this.props;

		return (
			<Translation>
				{t => (
					<TableContainer>
						<Table aria-label='table list' size={size}>
							{showHeader && (
								<TableHead>
									<TableRow>
										{header.map(item => (
											<TableCell key={item as string}>{t(`table.header.${item}`)}</TableCell>
										))}
									</TableRow>
								</TableHead>
							)}
							<TableBody>
								{data.map(row => (
									<TableRow key={row._id}>
										{header.map(item => (
											<TableCell key={item + row._id}>{row[item]}</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Translation>
		);
	}
}