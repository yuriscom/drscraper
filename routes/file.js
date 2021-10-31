var express = require('express');
var router = express.Router();

router.get('/getfile', function(req, res){
  var path = req.query['path'];
  path = new Buffer(path, 'base64').toString('ascii');
  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.download(path);
})

module.exports = router;