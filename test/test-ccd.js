var expect = require('chai').expect;
var assert = require('chai').assert;

var fs = require('fs');
var path = require('path');

var parser = require('../index');
var jsutil = require('../lib/jsutil');

describe('full ccd parser', function() {
    var ccd = null;
    
    before(function(done) {
        filepath  = path.join(__dirname, 'fixtures/files/CCD_1.xml');
        var xml = fs.readFileSync(filepath, 'utf-8');;
        parser(xml, {}, function(err, result) {
            ccd = result.toJSON();
            jsutil.deepDelete(ccd, '_id');
            //var json2Write = JSON.stringify(ccd, undefined, '\t');
            //var jsonFilePath = filepath.replace('.xml', '.json');
            //fs.writeFileSync(jsonFilePath, json2Write);
            done();
        });
    });
    
    it('full deep check', function(done) {
        expect(ccd).to.exist;
        var filepath  = path.join(__dirname, 'fixtures/json/CCD_1.json');
        var json2Read = fs.readFileSync(filepath, 'utf-8');;
        var expectedCCD = JSON.parse(json2Read, function(key, value) {
            var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
            if (typeof value === 'string') {
                var a = reISO.exec(value);
                if (a) {
                    return new Date(value);
                }
            }
            return value;
        });
        expect(ccd).to.deep.equal(expectedCCD);
        done();
    });
    
    it ('demographics spot check', function(done) {
        expect(ccd.demographics).to.exist;
        
        expect(ccd.demographics.name).to.exists;
        expect(ccd.demographics.name.family).to.equal('Jones');
        expect(ccd.demographics.name.givens).to.have.length(2);
        expect(ccd.demographics.name.givens).to.have.members(['Isabella', 'Isa']);
        
        expect(JSON.stringify(ccd.demographics.birthTime)).to.equal('"1975-05-01T00:00:00.000Z"');
        
        expect(ccd.demographics.telecoms).to.exists;
        expect(ccd.demographics.telecoms).to.have.length(1);
        expect(ccd.demographics.telecoms[0].value).to.equal('tel:(816)276-6909');
        expect(ccd.demographics.telecoms[0].use).to.equal('primary home');

        done();
    });

    it ('vitals spot check', function(done) {
        expect(ccd.vitals).to.exist;
        expect(ccd.vitals.panels).to.have.length(2);
        expect(ccd.vitals.panels[0].vitals).to.have.length(3);
        expect(ccd.vitals.panels[0].vitals[0].vitalName).exist;
        expect(ccd.vitals.panels[0].vitals[0].vitalName.label).to.equal('Height');
        done();
    });
});