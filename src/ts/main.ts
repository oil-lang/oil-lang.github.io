import $ = require('jquery');
import Handlebars = require('handlebars');

import fs = require('fs');
import header = require('../templates/header.hbs');

var svgcontent = fs.readFileSync(__dirname + '/../logo.svg', 'utf8');
var res = header({ logo: { svg: svgcontent }});

$('body').append(res);
