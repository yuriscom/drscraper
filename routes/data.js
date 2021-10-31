var express = require('express');
var router = express.Router();

router.get('/scrape', function (req, res, next) {
  var qAr = [];
  for (var k in req.query) {
    qAr.push(k + "=" + req.query[k]);
  }

  var args = qAr.join(" ");
  res.render("data", { command: "ds " + args, wshost: process.env.WSHOST, title:"data" });
});

module.exports = router;
