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
        var msg = util.format('Unrecognized component: %s', options.component);
        callback(new Error(msg));
    }
    var filepath = options.filepath;
    if (! filepath) {
        var msg = 'No output file is specified.';
        callback(new Error(msg));
    }
    var formatter = getFormatter(options.formatter);
    if (! formatter) {
        var msg = util.format('Unrecognized formatter: %s', options.formatter);
        callback(new Error(msg));
    }
    
    var json = component.document();
    var doc = formatter(json);
    fs.writeFileSync(filepath, doc);
    callback();
};