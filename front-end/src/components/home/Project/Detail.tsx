import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import http from '@/utils/http';
import {
	Box,
	Breadcrumbs,
	Button,
	Checkbox,
	DialogActions,
	DialogContent,
	DialogTitle,
	Fab,
	IconButton,
	Link,
	List,
	ListItem,
	ListItemButton,
	Stack,
	TextField,
	Typography
} from '@mui/material';
import { useParams, Link as NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Styled from '@/components/widgets/Styled';
import dayjs from 'dayjs';
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import { yellow } from '@mui/material/colors';
import { useSnackbar } from 'notistack';
import { useAppDispatch } from '@/hooks/useStore';
import { getFavoriteList } from '@/store/favoriteList';
import { Form } from '@/@types/form';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Tasks from './Tasks';
import {
	FavoriteButtonProps,
	NavBreadcrumbsProps,
	TaskColumnData,
	TaskFormDialogProps,
	TaskMemberListProps
} from '@/@types/props';
import useAccountInfo from '@/hooks/useAccountInfo';
import { toFormData } from '@/utils';
import useNotification from '@/hooks/useNotification';

const Detail: React.FC = () => {
	const { t } = useTranslation();
	const { id } = useParams();
	const dispatch = useAppDispatch();
	const { enqueueSnackbar } = useSnackbar();
	const [projectInfo, setProjectInfo] = useState<Project>({} as Project);
	const [favoriteStatus, setFavoriteStatus] = useState<boolean>(false);
	const [tasks, setTasks] = useState<TaskColumnData>({
		pending: [],
		processing: [],
		testing: [],
		done: []
	} as TaskColumnData);
	const allMembers = useMemo(() => projectInfo.members ?? [], [projectInfo.members]);

	useEffect(() => {
		// get project detail info
		http.get<Project>('/project/detail', { id }).then(res => {
			setProjectInfo(res.data!);
		});

		// check favorite status
		http.get<boolean>('/project/favorite/status', { id }).then(res => {
			setFavoriteStatus(res.data!);
		});

		// get tasks
		http.get<TaskColumnData>('/project/tasks', { id }).then(res => {
			setTasks(res.data!);
		});
	}, []);

	const swithFavoriteStatus = () => {
		const newStatus = !favoriteStatus;
		const func = newStatus ? addToFavorite : removeFromFavorite;
		func().then(() => {
			setFavoriteStatus(newStatus);
			dispatch(getFavoriteList());
		});
	};

	const addToFavorite = () =>
		http
			.post('/project/favorite/add', { id })
			.then(res => enqueueSnackbar(res.message, { variant: 'success' }))
			.catch(err => enqueueSnackbar(err?.message ?? err, { variant: 'error' }));

	const removeFromFavorite = () =>
		http
			.delete('/project/favorite/remove', { id })
			.then(res => enqueueSnackbar(res.message, { variant: 'success' }))
			.catch(err => enqueueSnackbar(err?.message ?? err, { variant: 'error' }));
	return (
		<>
			<Box>
				<NavBreadcrumbs projectName={projectInfo?.name} />
				<Stack spacing={2} mt={2}>
					<Stack direction='row' alignItems='center'>
						<Typography component='h1' variant='h3' sx={{ fontWeight: 'bolder' }}>
							{projectInfo.name}
						</Typography>
						<Typography marginLeft='auto' marginRight={1} variant='body2' color='text.secondary'>
							{t('create')}: {dayjs(projectInfo.createTime).format('MM/DD/YYYY')}
						</Typography>
						<FavoriteButton favorite={favoriteStatus} onClick={swithFavoriteStatus} />
					</Stack>
					{projectInfo?.description && (
						<Typography variant='body1' color='text.secondary'>
							{projectInfo.description}
						</Typography>
					)}
					<Styled.AvatarGroup data={allMembers} max={5} />
				</Stack>
				<Tasks data={tasks} setData={setTasks} sx={{ mt: 5 }} />
			</Box>
			<FormDialog project={id ?? ''} members={projectInfo.members} />
		</>
	);
};

const NavBreadcrumbs: React.FC<NavBreadcrumbsProps> = ({ projectName = '' }) => {
	const { t } = useTranslation();

	return (
		<Breadcrumbs aria-label='breadcrumb'>
			<Typography color='inherit'>{t('menu.studio')}</Typography>
			<Link underline='hover' color='inherit' component={NavLink} to='/home/project'>
				{t('menu.project')}
			</Link>
			<Typography color='text.primary'>{projectName}</Typography>
		</Breadcrumbs>
	);
};

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ favorite = false, onClick }) => {
	return (
		<IconButton onClick={onClick} sx={{ color: yellow[700] }} aria-label='favorite-btn'>
			{favorite ? <StarRoundedIcon color='inherit' /> : <StarOutlineRoundedIcon color='inherit' />}
		</IconButton>
	);
};

class TaskFormClass implements Form.TaskForm {
	name = '';
	description = '';
	project = '';
	members = [];
	dueTime = dayjs().valueOf();
	constructor(project: string) {
		this.project = project;
	}
}

const FormDialog: React.FC<TaskFormDialogProps> = ({ project, members }) => {
	const { t } = useTranslation();
	const { _id } = useAccountInfo();
	const notificate = useNotification();
	const [openDialog, setOpenDialog] = useState<boolean>(false);
	const [taskForm, setTaskForm] = useState<Form.TaskForm>(new TaskFormClass(project));

	const handleInputChange = (val: Partial<Form.TaskForm>) => {
		setTaskForm(preVal => ({ ...preVal, ...val }));
	};

	const handleCancel = () => {
		setOpenDialog(false);
	};
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const members = taskForm.members.map(item => JSON.stringify(item));
		const formData = toFormData<Form.TaskForm<string>>({ ...taskForm, members });
		http
			.post('/task/create', formData)
			.then(res => notificate.success(res.message))
			.catch(err => notificate.error(err?.message ?? err))
			.finally(() => {
				setOpenDialog(false);
				setTaskForm(new TaskFormClass(project));
				addCreator();
			});
	};

	useLayoutEffect(() => {
		// add the creator to the task member list
		addCreator();
	}, [members]);

	const addCreator = () => {
		members &&
			setTaskForm(preVal => {
				const { members: memberList } = preVal;
				const creator = members?.find(item => item._id === _id);
				memberList.unshift({ _id, role: creator?.role! });
				return { ...preVal };
			});
	};

	return (
		<>
			<Fab
				variant='extended'
				color='primary'
				sx={{ position: 'fixed', bottom: 24, right: 24 }}
				onClick={() => setOpenDialog(true)}
			>
				<AddBoxOutlinedIcon sx={{ mr: 1 }} />
				{t('button.newTask')}
			</Fab>
			<Styled.Dialog open={openDialog} onClose={setOpenDialog}>
				<DialogTitle>{t('project.dialogTitle')}</DialogTitle>
				<form onSubmit={handleSubmit}>
					<DialogContent>
						<Stack spacing={2}>
							<Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
								<Stack flexGrow={1}>
									<LocalizationProvider dateAdapter={AdapterDayjs}>
										<Typography variant='h6' component='h3'>
											{t('task.info')}
										</Typography>
										<TextField
											id='name'
											value={taskForm.name}
											label={t('task.form.name')}
											variant='outlined'
											margin='normal'
											onChange={e => handleInputChange({ name: e.target.value })}
										/>
										<DatePicker
											label={t('task.form.dueTime')}
											value={taskForm.dueTime}
											onChange={value => handleInputChange({ dueTime: dayjs(value).valueOf()! })}
											renderInput={params => <TextField margin='normal' {...params} />}
										/>
										<TextField
											id='description'
											value={taskForm.description}
											label={t('task.form.description')}
											multiline
											rows={5}
											margin='normal'
											onChange={e => handleInputChange({ description: e.target.value })}
										/>
									</LocalizationProvider>
								</Stack>
								<MemberList data={members} setMembers={setTaskForm} />
							</Stack>
						</Stack>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCancel}>{t('button.cancel')}</Button>
						<Button variant='contained' type='submit'>
							{t('button.submit')}
						</Button>
					</DialogActions>
				</form>
			</Styled.Dialog>
		</>
	);
};

const MemberList: React.FC<TaskMemberListProps> = ({ data, setMembers }) => {
	const { t } = useTranslation();
	const { _id } = useAccountInfo();

	const handleToggle = (e: React.ChangeEvent<HTMLInputElement>, member: WithRole<Account<StaticData>, StaticData>) => {
		e.target.checked
			? setMembers(preVal => {
					const { members } = preVal;
					members.push({ _id: member._id, role: member.role });
					return { ...preVal, members };
			  })
			: setMembers(preVal => {
					const { members } = preVal;
					const index = members.findIndex(item => item._id === member._id);
					members.splice(index, 1);
					return { ...preVal, members };
			  });
	};

	return (
		<Stack flexGrow={1}>
			<Typography variant='h6' component='h3'>
				{t('task.members')}
			</Typography>
			<List dense sx={{ height: '100%', overflow: 'auto' }}>
				{data.map(member => (
					<ListItem
						key={member._id}
						disablePadding
						secondaryAction={
							<Stack direction='row' alignItems='center'>
								<Typography variant='body2' component='span' color='text.secondary'>
									{member.role.name}
								</Typography>
								<Checkbox
									edge='end'
									{...(member._id === _id ? { checked: true, disabled: true } : {})}
									onChange={e => handleToggle(e, member)}
									inputProps={{ 'aria-labelledby': member._id }}
								/>
							</Stack>
						}
					>
						<Styled.AccountInfo {...member} component={ListItemButton} />
					</ListItem>
				))}
			</List>
		</Stack>
	);
};

export default Detail;
