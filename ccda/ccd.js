var fs = require("fs");
var util = require("util");
var common = require("./common");

var Processor = require("./processor");
var OIDs = require("./oids");
var Component = require("./component");
var Cleanup = require("./cleanup");

var shared = require('./shared');

var Patient = require('./demographics').Patient;
var ResultsSection = require('./results').ResultsSection;
var VitalSignsSection = require('./vitals').VitalSignsSection;
var ProblemsSection = require('./problems').ProblemsSection;
var ImmunizationsSection = require('./immunizations').ImmunizationsSection;
var SocialHistorySection = require('./socialHistory').SocialHistorySection;

var MedicationInformation = Component.define("MedicationInformation")
.templateRoot("2.16.840.1.113883.10.20.22.4.23")
.fields([
  ["productName","0..1", "h:manufacturedMaterial/h:code", 
    shared.ConceptDescriptor.shall({valueSetOid: "2.16.840.1.113883.3.88.12.80.17"})],
  ["freeTextProductName","0..1", "h:manufacturedMaterial/h:code/h:originalText", shared.TextWithReference],
  //TODO: datatype?  ["manufacturer","0..1", "h:manufacturerOrganization", ??],
]);

var MedicationActivity = Component.define("MedicationActivity")
.templateRoot("2.16.840.1.113883.10.20.22.4.16")
.fields([
  ["sourceIds","1..*", "h:id", shared.Identifier],
  ["deliveryMethod","0..1", "h:code", shared.ConceptDescriptor],
  ["route","0..1", "h:routeCode", shared.SimplifiedCode],
  ["site","0..1", "h:approachSiteCode", shared.ConceptDescriptor],
  ["administrationUnit","0..1", "h:administrationUnitCode", shared.ConceptDescriptor],
  ["times", "1..*", "h:effectiveTime", shared.EffectiveTime],
  ["medicationName", "1..1", "h:consumable/h:manufacturedProduct", MedicationInformation],
  ["freeTextSig","0..1", "h:text", shared.TextWithReference],
  ["dose","0..1", "h:doseQuantity", shared.PhysicalQuantity],
  ["rate","0..1", "h:rateQuantity", shared.PhysicalQuantity],
])
.cleanupStep(Cleanup.extractAllFields(["medicationName"]))
.cleanupStep(function(){
  // separate out two effectiveTimes

  // 1.  startDate --- endDate
  var range = this.js.times.filter(function(t){
    return -1 === ['PIVL_TS', 'EIVL_TS'].indexOf(t.js.xsitype);
  });

  // 2.  dosing interval
  var period= this.js.times.filter(function(t){
    return -1 !== ['PIVL_TS', 'EIVL_TS'].indexOf(t.js.xsitype);
  });

  delete this.js.times;

  if (range.length > 0) {
    this.js.dateRange = range[0];
  }

  if (period.length > 0) {
    this.js.dosePeriod = period[0].js.period;
  }
});

var MedActivityRx = MedicationActivity.define("Prescription")
.withMood("INT")
.uriBuilder({
  category:"entries",
  type:"medicationsPrescribed"
});

var MedActivityHx = MedicationActivity.define("MedActivityHx")
.withMood("EVN")
.uriBuilder({
  category:"entries",
  type:"medicationsReported"
});

var MedicationsSection = Component.define("MedicationsSection")
.templateRoot(["2.16.840.1.113883.10.20.22.2.1", "2.16.840.1.113883.10.20.22.2.1.1"])
.fields([
  ["medicationsPrescribed","0..*", MedActivityRx.xpath(), MedActivityRx],
  ["medicationsReported","0..*", MedActivityHx.xpath(), MedActivityHx],
])
.uriBuilder({
  category: "sections",
  type: "medications"
})
.cleanupStep(Cleanup.ensureMutuallyExclusive([
  "medicationsPrescribed",
  "medicationsReported", 
]));

var CCD = exports.CCD = Component.define("CCD")
.fields([
  ["sourceIds", "1..*", "h:id", shared.Identifier],
  ["demographics", "1..1", "//h:recordTarget/h:patientRole", Patient],
  ["vitals", "0..1", VitalSignsSection.xpath(), VitalSignsSection],
  ["results", "0..1", ResultsSection.xpath(), ResultsSection],
  ["medications", "0..1", MedicationsSection.xpath(), MedicationsSection],
  ["immunizations", "0..1", ImmunizationsSection.xpath(), ImmunizationsSection],
  ["socialHistory", "0..1", SocialHistorySection.xpath(), SocialHistorySection],
  ["problems", "0..1", ProblemsSection.xpath(), ProblemsSection],
])
.uriBuilder({
  category: "documents",
  type: "ccda"
}).cleanupStep(Cleanup.fixSectionUris, 1);

