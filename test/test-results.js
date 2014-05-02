var expect = require('chai').expect;
var assert = require('chai').assert;

var fs = require('fs');
var path = require('path');

var parser = require('../index');
var jsutil = require('../lib/jsutil');

describe('results parser', function() {
    var results = null;
    
    before(function(done) {
        filepath  = path.join(__dirname, 'fixtures/file-snippets/CCD_1_Results.xml');
        var xml = fs.readFileSync(filepath, 'utf-8');;
        parser(xml, {xmlType: 'results'}, function(err, result) {
            results = result.toJSON();
            jsutil.deepDelete(results, '_id');
            //var json2Write = JSON.stringify(ccd, undefined, '\t');
            //var jsonFilePath = filepath.replace('.xml', '.json');
            //fs.writeFileSync(jsonFilePath, json2Write);
            done();
        });
    });
    
    it('full deep check', function(done) {
        expect(results).to.exist;
        var filepath  = path.join(__dirname, 'fixtures/file-snippets/json/CCD_1_Results.json');
        var json2Read = fs.readFileSync(filepath, 'utf-8');;
        var expectedResults = jsutil.jsonParseWithDate(json2Read);
        expect(results).to.deep.equal(expectedResults);
        done();
    });
    
    it ('spot check', function(done) {
        expect(results).to.exist;
        expect(results.panels).to.have.length(1);
        
        expect(results.panels[0].panelName).to.exist;
        expect(results.panels[0].panelName.code).to.equal('43789009');
        expect(results.panels[0].panelName.label).to.equal("CBC WO DIFFERENTIAL");
        
        expect(results.panels[0].results).to.exist;
        expect(results.panels[0].results).to.have.length(3);
        
        expect(results.panels[0].results[2].resultName).to.exist;
        expect(results.panels[0].results[2].resultName.code).to.equal('26515-7');
        expect(results.panels[0].results[2].resultName.label).to.equal('PLT');
        
        done();
    });
});