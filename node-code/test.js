var fs = require('fs');

var c = require('../index');



var xml = fs.readFileSync('example.xml', 'utf-8');

c(xml, {}, function(err, result) {

    var js = result.toJSON();

    console.log(JSON.stringify(js, null, 2));

});