import React from 'react';
import {
	Avatar,
	AvatarGroup,
	Card,
	Chip,
	Dialog,
	ListItem,
	ListItemAvatar,
	ListItemText,
	Slide,
	Tooltip,
	Typography,
	useMediaQuery,
	useTheme
} from '@mui/material';
import { stringAvatar, toFullName } from '@/utils';
import { useTranslation } from 'react-i18next';
import { TransitionProps } from '@mui/material/transitions';
import { Box } from '@mui/system';
import { StyledAccountInfoProps, StyledAvatarGroupProps, StyledDialogProps, StyledStatusProps } from '@/@types/props';

const StyledCard: React.FC = ({ children }) => <Card elevation={3}>{children}</Card>;
const StyledTitle: React.FC = ({ children }) => (
	<Typography component='h2' variant='h5'>
		{children}
	</Typography>
);
const StyledStatus: React.FC<StyledStatusProps> = ({ label }) => {
	const { t } = useTranslation();

	return <Chip label={t(`status.${label.toLowerCase()}`)} color={label.toLowerCase() as any} />;
};
const StyledAccountInfo: React.FC<StyledAccountInfoProps> = ({
	avatar,
	firstName,
	lastName,
	position,
	component = ListItem
}) => {
	const fullName = toFullName(firstName!, lastName!);

	return (
		<Box component={component}>
			<ListItemAvatar>
				{avatar ? <Avatar alt={fullName} src={avatar} /> : <Avatar alt={fullName} {...stringAvatar(fullName)} />}
			</ListItemAvatar>
			<ListItemText primary={fullName} secondary={(position as StaticData)?.name ?? position} />
		</Box>
	);
};
const StyledAvatarGroup: React.FC<StyledAvatarGroupProps> = ({ data, max = 4 }) => {
	return (
		<AvatarGroup max={max} sx={{ justifyContent: 'flex-end' }}>
			{data.map(member => {
				const fullName = toFullName(member.firstName, member.lastName);

				return (
					<Tooltip key={fullName} title={fullName} placement='top'>
						{member.avatar ? (
							<Avatar alt={fullName} src={member.avatar} />
						) : (
							<Avatar alt={fullName} {...stringAvatar(fullName!)} />
						)}
					</Tooltip>
				);
			})}
		</AvatarGroup>
	);
};
const Transition = React.forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement<any, any>;
	},
	ref: React.Ref<unknown>
) {
	return <Slide direction='up' ref={ref} {...props} />;
});
const StyledDialog: React.FC<StyledDialogProps> = ({ open, onClose, children }) => {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
	return (
		<Dialog
			open={open}
			onClose={() => onClose(false)}
			maxWidth='md'
			fullWidth
			fullScreen={fullScreen}
			TransitionComponent={Transition}
		>
			{children}
		</Dialog>
	);
};

export default {
	Card: StyledCard,
	Title: StyledTitle,
	Status: StyledStatus,
	AccountInfo: StyledAccountInfo,
	AvatarGroup: StyledAvatarGroup,
	Dialog: StyledDialog
};
