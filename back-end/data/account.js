const client = require('../utils/redis');
const { v4: uuidv4 } = require('uuid');
const Check = require('../lib/Check');
const dayjs = require('dayjs');
const nodemailer = require('nodemailer');
const Mail = require('nodemailer/lib/mailer');
const mailConfig = require('../utils/mail.json');
const { toCapitalize } = require('../utils/helpers');
const { accounts } = require('../config/mongoCollections');
const bcrypt = require('bcrypt');
const { getStaticData } = require('./static');
const { upload } = require('./file');
const Account = require('../lib/Account');

/**
 * add the account info to register list (waitting for sign up)
 * use redis store the list
 * @param {{firstName: string, lastName: string, department: string, position: string}} accountInfo
 * @param {string} email the target email address (not the account email)
 * @returns {Promise<string>} registerId
 */
const addToRegisterList = async (accountInfo, email) => {
	Check.firstName(accountInfo.firstName);
	Check.lastName(accountInfo.lastName);
	// check the validation of id
	Check.department(accountInfo.department);
	Check.position(accountInfo.position);

	accountInfo.department = await getStaticData('departments', accountInfo.department);
	accountInfo.position = await getStaticData('positions', accountInfo.position);

	const registerId = uuidv4();
	// TIPS the expire time (default is 1 hour)
	const expireTime = dayjs().add(1, 'hour').valueOf();
	await client.set(registerId, JSON.stringify(accountInfo), { PXAT: expireTime });

	await sendEmail({
		to: email,
		subject: 'Taskoo Registe Invitation',
		text: mailTemplate(accountInfo.firstName, registerId)
	});

	return registerId;
};

/**
 * TODO
 * send email to target address
 * @param {Mail.Options} content the email detail content
 */
const sendEmail = async mail => {
	const transporter = nodemailer.createTransport(mailConfig);
	mail.from = 'taskoo.cs554final@gmail.com';
	// send mail
	await transporter.sendMail(mail);
};

const mailTemplate = (firstName, registerId) => {
	return `
		Hi ${toCapitalize(firstName)},

		Welcome to Taskoo, please click the link below to start sign up your account.
		This link will expier in 1 hour.

		http://localhost:3000/#/account/signup/${registerId}

		Best,
		Taskoo Team
	`;
};

/**
 * get the info from resiter list accounding register id
 * @param {string} resiterId
 * @returns {Promise<null | {firstName: string, lastName: string, department: string, position: string}>}
 */
const getRegisterInfo = async registerId => {
	Check._id(registerId);
	const registerInfo = await client.get(registerId);
	return registerInfo ? JSON.parse(registerInfo) : null;
};

/**
 * get the info from account list accounding email
 * @param {string} email
 * @returns {Promise<null | {firstName: string, lastName: string, department: string, position: string}>}
 */
const getUserData = async email => {
	Check.email(email);
	const accountCollection = await accounts();
	const accountData = await accountCollection.findOne({ email });

	return accountData;
};

/**
 * check the identity
 * @param {Account} dbUserData the account data from db
 * @param {string} password the password from client
 * @returns {Promise<Account>}
 */
const checkIdentity = async (dbUserData, password) => {
	const validation = await bcrypt.compare(password, dbUserData.password);
	if (!validation) throw Error('The account email or password is wrong');

	delete dbUserData.disabled;
	delete dbUserData.password;
	return dbUserData;
};

/**
 * query the department and position in account info
 * @param {Account} accountInfo
 * @returns {Promise<Account>}
 */
const decodeAccountInfo = async accountInfo => {
	accountInfo.department = (await getStaticData('departments', accountInfo.department)).name;
	accountInfo.position = (await getStaticData('positions', accountInfo.position)).name;
	delete accountInfo.bucket;

	return accountInfo;
};

/**
 * query all the members in department
 * @param {string} _id department id
 * @returns {Promise<{_id: string, fullName: string, avatar: null | string, position: string, department: string}>}
 */
const getDepartmentMembers = async _id => {
	const collection = await accounts();
	const members = await collection
		.aggregate([
			{ $match: { department: _id } },
			{ $project: { password: 0, disabled: 0, bucket: 0 } },
			{
				$lookup: {
					from: 'departments',
					localField: 'department',
					foreignField: '_id',
					as: 'department',
					pipeline: [{ $project: { _id: 0 } }]
				}
			},
			{
				$lookup: {
					from: 'positions',
					localField: 'position',
					foreignField: '_id',
					as: 'position',
					pipeline: [{ $project: { _id: 0, level: 0 } }]
				}
			},
			{ $unwind: '$department' },
			{ $unwind: '$position' },
			{
				$addFields: {
					department: '$department.name',
					position: '$position.name'
				}
			}
		])
		.toArray();

	return members;
};

/**
 * upload avatar
 * @param {string} _id account id
 * @param {File} file
 * @returns {Promise<string>} the url of the file
 */
const uploadAvatar = async (_id, file) => {
	Check._id(_id);
	const url = await upload(file);

	// update account
	const accountCol = await accounts();
	const { modifiedCount } = await accountCol.updateOne({ _id }, { $set: { avatar: url } });

	if (!modifiedCount) throw Error('Upload failed, please try again later');
	return url;
};

const createAccount = async (email, password, firstName, lastName, department, position) => {
	const accountCollection = await accounts();
	if(accountCollection.findOne({email:email})) throw 'the email has been sign up'
	let newaccount = new Account({
		email: email,
		password: password,
		firstName: firstName,
		lastName: lastName,
		department: department,
		position: position
	});
	newaccount.hashPwd();
	const insertInfo = await accountCollection.insertOne(newaccount);
	if (insertInfo.insertedCount === 0) throw 'Could not add account';
	return email;
};
module.exports = {
	addToRegisterList,
	getRegisterInfo,
	getUserData,
	checkIdentity,
	decodeAccountInfo,
	getDepartmentMembers,
	uploadAvatar,
	createAccount
};
