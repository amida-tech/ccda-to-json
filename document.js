var fs = require('fs');

var components = {
    ccd: require('./ccda/ccd').CCD,
    demographics: require('./ccda/demographics').Patient,
    vitals: require('./ccda/vitals').VitalSignsSection,
    medications: require('./ccda/medications').MedicationsSection,
    problems: require('./ccda/problems').ProblemsSection,
    immunizations: require('./ccda/immunizations').ImmunizationsSection,
    results: require('./ccda/results').ResultsSection
};

var getComponent = function(component) {
    if (component) {
        return components[component];
    } else {
        return components.ccd;
    }
};

var formatters = {
    stringify: function(json) {
        return JSON.stringify(json, undefined, '\t');
    }
};


var getFormatter = function(name) {
    if (name) {
        return formatters[name];
    } else {
        return formatters.stringify;
    }
};

module.exports = function(options, callback) {
    var component = getComponent(options.component);
    if (! component) {
        var msg1 = util.format('Unrecognized component: %s', options.component);
        callback(new Error(msg1));
    }
    var filepath = options.filepath;
    if (! filepath) {
        var msg2 = 'No output file is specified.';
        callback(new Error(msg2));
    }
    var formatter = getFormatter(options.formatter);
    if (! formatter) {
        var msg3 = util.format('Unrecognized formatter: %s', options.formatter);
        callback(new Error(msg3));
    }
    
    var json = component.document();
    var doc = formatter(json);
    fs.writeFileSync(filepath, doc);
    callback();
};