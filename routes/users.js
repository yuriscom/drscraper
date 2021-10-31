var express = require('express');
var secured = require('../lib/middleware/secured');
var router = express.Router();

/* GET user profile. */
router.get('/user', secured(), function (req, res, next) {
  const { _raw, _json, ...userProfile } = req.user;
  res.render('form', {
    userProfile: JSON.stringify(userProfile, null, 2),
    title: 'Form Page'
  });
});

module.exports = router;
