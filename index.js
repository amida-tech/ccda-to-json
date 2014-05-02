var Component = require('./ccda/Component');
var common = require('./ccda/common');
var ccd = require('./ccda/ccd');

var xmlToJSONers = {
   ccd: require('./ccda/ccd').CCD,
   demographics: require('./ccda/demographics').Patient,
   vitals: require('./ccda/vitals').VitalSignsSection,
   medications: require('./ccda/medications').MedicationsSection,
   problems: require('./ccda/problems').ProblemsSection,
   immunizations: require('./ccda/immunizations').ImmunizationsSection
};

var getXMLToJSONer = function(xmlType) {
    if (xmlType) {
        return xmlToJSONers[xmlType];
    } else {
        return xmlToJSONers['ccd'];
    }
};

module.exports = function(src, options, callback) {
    if (arguments.length === 2){
        callback = options;
        options = {};
    }

    if (options.hideFields){
        Component.cleanupStep(Cleanup.hideFields(options.hideFields), "paredown");
    };
    
    var patientId = options.patientId || 0;
    var xml = common.parseXml(src);
    
    var xmlToJSONer = getXMLToJSONer(options.xmlType);
    var ret = new xmlToJSONer();
    ret.patientId = patientId;

    //TODO can we leverage external terminology services
    //explicitly here, to support browser- and server-side JS?
    ret.codes = []; // skip code resoution for now
    
    ret.src = src;
    ret.errors = [];
    ret.run(xml);

    ret.cleanupTree(); // first build the data objects up 
    ret.cleanupTree("paredown"); // then pare down to essentials
    callback(null, ret);
};

