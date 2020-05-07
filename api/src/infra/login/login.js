const express = require('express');
const LoginService = require('./LoginService');

const router = express.Router();

router.post('/login', (req, res) => {
  
  LoginService.login(req.body.username, req.body.password)
    .then(token => {
      res.json(token);
    })
    .catch(err => {
      res.status(400).json({
        success: false,
        message: 'Usuário ou senha inválidos.'
      });
    });
});

router.post('/login/company', (req, res) => {

});

module.exports = router;
