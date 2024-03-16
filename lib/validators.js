import { body, check, param, validationResult } from 'express-validator';
import { ErrorHandler } from '../utils/utility.js';

const validateHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = errors.array().map(err => err.msg).join('. ');
    return next(new ErrorHandler(extractedErrors, 400))
}

const registerValidator = () => [
    body('name', 'Please enter name').notEmpty(),
    body('username', 'Please enter Username').isEmpty(),
    body('password', 'Please enter Password').isEmpty(),
    body('bio', 'Please enter Bio').notEmpty(),
    check('avatar', 'Please upload an image').notEmpty()
]

const loginValidator = () => [
    body('username', 'Please enter Username').isEmpty(),
    body('password', 'Please enter Password').isEmpty()
]

const newGroupValidator = () => [
    body('name', 'Please enter name').notEmpty(),
    body('members').notEmpty().withMessage('Please enter members').isArray({ min: 2, max: 50 }).withMessage('Members should be between 2 and 50')
]

const addMembersValidator = () => [
    body('chatId', 'Please enter chatId').notEmpty(),
    body('members').notEmpty().withMessage('Please enter members').isArray({ min: 1, max: 10 }).withMessage('Members should be between 1 and 10')
]

const removeMemberValidator = () => [
    body('chatId', 'Please enter chatId').notEmpty(),
    body('userId', 'Please enter userId').notEmpty()
]

const sendAttachmentsValidator = () => [
    body('chatId', 'Please enter chatId').notEmpty(),
    check('files').notEmpty().withMessage('Please upload attachments').isArray({ min: 1, max: 5 }).withMessage('Attachments should be between 1 and 5')
]

const chatIdValidator = () => [
    param('id', 'Please enter chatId').notEmpty()
]

const renameGroupValidator = () => [
    param('id', 'Please enter chatId').notEmpty(),
    body('name', 'Please enter name').notEmpty()
]

const sendRequestValidator = () => [
    body('userId', 'Please enter userId').notEmpty()
]

const acceptRequestValidator = () => [
    body('requestId', 'Please enter requestId').notEmpty(),
    body('status').notEmpty().withMessage('Please enter status').isBoolean().withMessage('Status should be a boolean')
]

const adminValidator = () => [
    body('secretKey', 'Please enter secretKey').notEmpty()
]

export { addMembersValidator, chatIdValidator, loginValidator, newGroupValidator, registerValidator, removeMemberValidator, renameGroupValidator, sendAttachmentsValidator, validateHandler, sendRequestValidator, acceptRequestValidator, adminValidator };