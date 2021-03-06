
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

exports.index = function(req, res) {
  if (!req.session.user) {
    res.render('index');
  } else {
    res.redirect('/_dashboard');
  }
};

exports.http404 = function(req, res) {
  res.render('404', {status: 404});
};

fs.readdirSync(__dirname).forEach(function(file) {
  if (file === path.basename(__filename))
    return;
  var func_name = path.basename(file, '.js');
  var func = require('./' + func_name);
  if (func.index)
    func = func.index;
  exports[func_name] = func;
});
