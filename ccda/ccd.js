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

var AgeObservation = Component.define("AgeObservation")
.templateRoot("2.16.840.1.113883.10.20.22.4.31");

var ProblemStatus = Component.define("ProblemStatus")
.templateRoot("2.16.840.1.113883.10.20.22.4.6");

var HealthStatus = Component.define("HealthStatus")
.templateRoot("2.16.840.1.113883.10.20.22.4.5");

var ProblemObservation = Component.define("ProblemObservation")
.templateRoot("2.16.840.1.113883.10.20.22.4.4")
.fields([
  ["sourceIds","1..*", "h:id", shared.Identifier],
  ["problemType","1..1", "h:code", shared.ConceptDescriptor],
  ["problemName","1..1", "h:value", shared.ConceptDescriptor],
  ["freeTextProblemName","0..1", "h:text", shared.TextWithReference],
  ["dateRange", "1..1", "h:effectiveTime", shared.EffectiveTime],
  ["resolved","1..1", "h:effectiveTime", Processor.pathExists("./@high")],
  ["ageAtOnset", "0..1", 
    AgeObservation.xpath() + "/h:value", 
    shared.PhysicalQuantity],
  ["problemStatus","0..1", 
    ProblemStatus.xpath() + "/h:value", 
    shared.ConceptDescriptor],
  ["healthStatus","0..1", 
    HealthStatus.xpath() + "/h:value", 
    shared.ConceptDescriptor]
]);

var NonProblemObservation = ProblemObservation
.define("NonProblemObservation")
.withNegationStatus(true)
.uriBuilder({
  category: "entries",
  type: "nonProblems"
});

var ProblemOrganizer = Component.define("ProblemOrganizer")
.templateRoot("2.16.840.1.113883.10.20.22.4.3")
.fields([
  ["sourceIds","1..*", "h:id", shared.Identifier],
  ["dateRange", "1..1", "h:effectiveTime", shared.EffectiveTime],
  ["concernStatus", "1..1", "h:statusCode/@code", shared.SimpleCode("2.16.840.1.113883.11.20.9.19")],
  ["problems", "1..*", ProblemObservation.xpath(), ProblemObservation],
  ["nonProblems", "0..*", NonProblemObservation.xpath(), NonProblemObservation]
])
.uriBuilder({
  category: "entries",
  type: "problemConcerns"
});


var ProblemsSection = Component.define("ProblemsSection")
.templateRoot("2.16.840.1.113883.10.20.22.2.5.1") // coded entries required
.fields([
  ["problemConcerns","0..*", ProblemOrganizer.xpath(), ProblemOrganizer],
])
.uriBuilder({
  category: "sections",
  type: "problems"
});


var VitalSignObservation = Component.define("VitalSignObservation")
.templateRoot("2.16.840.1.113883.10.20.22.4.27")
.fields([
  ["sourceIds","1..*", "h:id", shared.Identifier],
  ["vitalName","1..1", "h:code", shared.ConceptDescriptor],
  ["measuredAt", "1..1", "h:effectiveTime", shared.EffectiveTime],
  ["physicalQuantity","1..1", "h:value[@xsi:type='PQ']", shared.PhysicalQuantity],
  ["freeTextValue","0..1", "h:text", shared.TextWithReference],
  ["interpretations", "0..*", "h:interpretationCode[@codeSystem='2.16.840.1.113883.5.83']", shared.SimplifiedCode]
])
.uriBuilder({
  category: "entries",
  type: "vitals"
});


var VitalSignsOrganizer = Component.define("VitalSignsOrganizer")
.templateRoot("2.16.840.1.113883.10.20.22.4.26")
.fields([
  ["panelName","0..1", "h:code", shared.ConceptDescriptor],
  ["sourceIds","1..*", "h:id", shared.Identifier],
  ["vitals", "1..*", VitalSignObservation.xpath(), VitalSignObservation]
])
.uriBuilder({
  category: "organizers",
  type: "vitals"
});


var VitalSignsSection = Component.define("VitalSignsSection")
.templateRoot("2.16.840.1.113883.10.20.22.2.4.1")
.fields([
  //["name","0..1", "h:code", shared.ConceptDescriptor],
  ["panels","0..*", VitalSignsOrganizer.xpath(), VitalSignsOrganizer],
])
.uriBuilder({
  category: "sections",
  type: "vitals"
});

var ImmunizationRefusalReason = Component.define("ImmunizationRefusalReason")
.templateRoot("2.16.840.1.113883.10.20.22.4.53");

var ImmunizationInformation = Component.define("ImmunizationInformation")
.templateRoot("2.16.840.1.113883.10.20.22.4.54")
.fields([
  ["productName","0..1", ".//h:manufacturedMaterial/h:code", shared.ConceptDescriptor],
  ["freeTextProductName","0..1", ".//h:manufacturedMaterial/h:code/h:originalText", shared.TextWithReference],
  ["lotNumber","0..1", "h:lotNumberText/text()"],
]);

var ImmunizationActivity = Component.define("ImmunizationActivity")
.templateRoot("2.16.840.1.113883.10.20.22.4.52")
.withMood("EVN")
.fields([
  ["sourceIds","1..*", "h:id", shared.Identifier],
  ["deliveryMethod","0..1", "h:code", shared.ConceptDescriptor],
  ["route","0..1", "h:routeCode", shared.SimplifiedCode],
  ["site","0..1", "h:approachSiteCode", shared.ConceptDescriptor],
  ["administrationUnit","0..1", "h:administrationUnitCode", shared.ConceptDescriptor],
  ["date", "1..1", "h:effectiveTime", shared.EffectiveTime],
  ["seriesNumber", "0..1", "h:repeatNumber/@value", shared.EffectiveTime],
  ["immunizationName", "1..1", "h:consumable/h:manufacturedProduct", ImmunizationInformation],
  ["freeText","0..1", "h:text", shared.TextWithReference],
  ["skippedFor", "0..1", ImmunizationRefusalReason.xpath()+"/h:code", shared.SimplifiedCode]
])
.uriBuilder({
  category: "entries",
  type: "immunizationsGiven"
})
.cleanupStep(Cleanup.extractAllFields(["immunizationName"]));

var PlannedImmunization = ImmunizationActivity.define("PlannedImmunization")
.withMood("INT")
.uriBuilder({
  category:"entries",
  type:"immunizationsPlanned"
});

var RefusedImmunization = ImmunizationActivity.define("RefusedImmunization")
.withNegationStatus(true)
.uriBuilder({
  category:"entries",
  type:"immunizationsSkipped"
});

var ImmunizationsSection = Component.define("ImmunizationsSection")
.templateRoot(["2.16.840.1.113883.10.20.22.2.2", "2.16.840.1.113883.10.20.22.2.2.1"])
.fields([
  ["immunizationsGiven","0..*", ImmunizationActivity.xpath(), ImmunizationActivity],
  ["immunizationsPlanned","0..*", PlannedImmunization.xpath(), PlannedImmunization],
  ["immunizationsSkipped","0..*", RefusedImmunization.xpath(), RefusedImmunization],
])
.uriBuilder({
  category: "sections",
  type: "immunizations"
})
.cleanupStep(Cleanup.ensureMutuallyExclusive([
  "immunizationsSkipped",
  "immunizationsGiven", 
  "immunizationsPlanned"
]));


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

var SmokingStatusObservation = Component.define("SmokingStatusObservation")
.templateRoot([
  "2.16.840.1.113883.10.20.22.4.78", // the correct templateId
  "2.16.840.1.113883.10.22.4.78" // incorrect id published in 1.1 DSTU
])
.fields([
  ["sourceIds","1..*", "h:id", shared.Identifier],
  ["smokingStatus","0..1", "h:value", 
    shared.ConceptDescriptor.shall({
      valueSetOid: "2.16.840.1.113883.11.20.9.38"
    })],
  // TODO: want a better name for this field -- but what does it mean?
  // http://www.hl7.org/dstucomments/showdetail_comment.cfm?commentid=98
  ["dateRange", "1..1", "h:effectiveTime", shared.EffectiveTime],
])
.uriBuilder({
  category: "entries",
  type: "smokingStatus"
}) ;

var SocialHistorySection = Component.define("SocialHistorSection")
.templateRoot(["2.16.840.1.113883.10.20.22.2.17"])
.fields([
  ["smokingStatuses","0..*", SmokingStatusObservation.xpath(), SmokingStatusObservation]
])
.uriBuilder({
  category: "sections",
  type: "socialHistory"
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

