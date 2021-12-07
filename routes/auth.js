const express = require('express');
const { body } = require('express-validator');

const is_auth = require('../middleware/is_auth');
const authController = require('../controllers/auth.js');

const router = express.Router();

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', is_auth, authController.getLogout);
router.get('/signup', authController.getSignup);

router.post('/signup',
  [
    body('email')
      .isEmail()
      .withMessage("Please enter a valid email!")
      .normalizeEmail(),
    body('password', 'Password must be only number and text and atleast 6 char')
      .isLength({min: 6})
      .isAlphanumeric()
      .trim(),
    body('conf_password')
      .custom((value, {req}) => {
        if(value !== req.body.password){
          throw new Error("Passwords don't  match");        // use ' "" differently
        }
        return true;
      })
  ],
  authController.postSignup
);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);   // token goes in req.params
router.post('/newPassword', authController.postNewPassword);

module.exports = router;