'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages
const chai = require('chai');
const shell = require('shelljs');

// Utilities
const config = require(path.resolve(__dirname, 'config.js'));
const tools = require(path.resolve(__dirname, '..', 'lib', 'tools'));

function TZDC(timezone) {
  let sign = "";
  if(timezone < 0) {
    sign = "+"; // local timezone is ahead UTC
    timezone = 0 - timezone;
  } else if(timezone > 0) {
    sign = "-"; // local timezone is behind UTC
  } else {
    // Time Zone Abbreviations Worldwide List
    // https://www.timeanddate.com/time/zones/
    timezone = " 0000"; // ±hhmm
  }

  let diff_h = timezone/60;
  let diff_m = timezone%60;
  if(diff_h < 10) {
    diff_h = "0" + diff_h;
  }
  if(diff_m < 10) {
    diff_m = "0" + diff_m;
  }

  return sign + diff_h + diff_m;
}

function runTesting() {
  describe('API: getTimestamp() testing', () => {
    it('year: YYYY, YYY, YY, Y, yyyy, yyy, yy, y, YYyy, ...', () => {
      const date = new Date();
      const A = date.getFullYear() + "";
      let B = tools.getTimestamp("Y");
      chai.expect(A).to.equal(B);
      B = tools.getTimestamp("YY");
      chai.expect(A).to.equal(B);
      B = tools.getTimestamp("YYY");
      chai.expect(A).to.equal(B);
      B = tools.getTimestamp("YYYY");
      chai.expect(A).to.equal(B);

      B = tools.getTimestamp("y");
      chai.expect(A).to.equal(B);
      B = tools.getTimestamp("yy");
      chai.expect(A).to.equal(B);
      B = tools.getTimestamp("yyy");
      chai.expect(A).to.equal(B);
      B = tools.getTimestamp("yyyy");
      chai.expect(A).to.equal(B);

      B = tools.getTimestamp("YYyy");
      chai.expect(A).to.equal(B);
    });

    it('month: MM, M', () => {
      const date = new Date();
      const M = date.getMonth() + 1;
      let MM = M + "";
      if(M < 10) MM = "0" + M;

      let A = tools.getTimestamp("M");
      chai.expect(A).to.equal(M + "");
      A = tools.getTimestamp("MM");
      chai.expect(A).to.equal(MM);
    });

    it('date: DD, D, dd, d, Dd, dD', () => {
      const date = new Date();
      const D = date.getDate();
      let DD = D + "";
      if(D < 10) DD = "0" + D;

      let A = tools.getTimestamp("D");
      chai.expect(A).to.equal(D + "");
      A = tools.getTimestamp("DD");
      chai.expect(A).to.equal(DD);

      A = tools.getTimestamp("d");
      chai.expect(A).to.equal(D + "");
      A = tools.getTimestamp("dd");
      chai.expect(A).to.equal(DD);

      A = tools.getTimestamp("dD");
      chai.expect(A).to.equal(DD + "");
      A = tools.getTimestamp("Dd");
      chai.expect(A).to.equal(DD);
    });

    it('year-month-date: Y-M-D, YMD, YYMMDD, ...', () => {
      const date = new Date();
      const Y = date.getFullYear();
      const M = date.getMonth() + 1;
      let MM = M + "";
      if(M < 10) MM = "0" + M;
      const D = date.getDate();
      let DD = D + "";
      if(D < 10) DD = "0" + D;

      let A = tools.getTimestamp("Y-M-D");
      chai.expect(A).to.equal(Y + '-' + M + '-' + D);
      A = tools.getTimestamp("YMD");
      chai.expect(A).to.equal(Y + "" + M + "" + D + "");
      A = tools.getTimestamp("YYMMDD");
      chai.expect(A).to.equal(Y + MM + DD + "");
    });

    it('hour: HH, H, hh, h, Hh, hH', () => {
      const date = new Date();
      const H = date.getHours();
      let HH = H + "";
      if(H < 10) HH = "0" + H;

      let A = tools.getTimestamp("H");
      chai.expect(A).to.equal(H + "");
      A = tools.getTimestamp("HH");
      chai.expect(A).to.equal(HH);

      A = tools.getTimestamp("h");
      chai.expect(A).to.equal(H + "");
      A = tools.getTimestamp("hh");
      chai.expect(A).to.equal(HH);

      A = tools.getTimestamp("hH");
      chai.expect(A).to.equal(HH);
      A = tools.getTimestamp("Hh");
      chai.expect(A).to.equal(HH);
    });

    it('minute: mm, m', () => {
      const date = new Date();
      const M = date.getMinutes();
      let MM = M + "";
      if(M < 10) MM = "0" + M;

      let A = tools.getTimestamp("m");
      chai.expect(A).to.equal(M + "");
      A = tools.getTimestamp("mm");
      chai.expect(A).to.equal(MM);
    });

    it('second: SS, S, ss, s, Ss, sS', () => {
      const date = new Date();
      const S = date.getSeconds();
      let SS = S + "";
      if(S < 10) SS = "0" + S;

      let A = tools.getTimestamp("S");
      chai.expect(A).to.equal(S + "");
      A = tools.getTimestamp("SS");
      chai.expect(A).to.equal(SS);

      A = tools.getTimestamp("s");
      chai.expect(A).to.equal(S + "");
      A = tools.getTimestamp("ss");
      chai.expect(A).to.equal(SS);

      A = tools.getTimestamp("sS");
      chai.expect(A).to.equal(SS);
      A = tools.getTimestamp("Ss");
      chai.expect(A).to.equal(SS);
    });

    it('milliseconds: XXXXX, XXXX, XXX, XX, X, xxxxx, ...', () => {
      let date = new Date();
      let X = date.getMilliseconds() + "";
      let A = tools.getTimestamp("X");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("XX");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("XXX");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("XXXX");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("XXXXX");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("x");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("xx");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("xxx");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("xxxx");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("xxxx");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("Xx");
      chai.expect(A).to.equal(X);

      date = new Date();
      X = date.getMilliseconds() + "";
      A = tools.getTimestamp("xX");
      chai.expect(A).to.equal(X);
    });

    it('hour:minute:second.milliseconds: h:m:s.x, hmsx, hh:mm:ss.xx, hhmmssxx, ...', () => {
      let date = new Date();
      let h = date.getHours();
      let hh = h + "";
      const m = date.getMinutes();
      let mm = m + "";
      const s = date.getSeconds();
      let ss = s + "";
      if(h < 10) hh = "0" + h;
      if(m < 10) mm = "0" + m;
      if(s < 10) ss = "0" + s;

      let x = date.getMilliseconds() + "";
      let A = tools.getTimestamp("h:m:s.x");
      chai.expect(A).to.equal(h + ':' + m + ':' + s + '.' + x);

      date = new Date();
      x = date.getMilliseconds() + "";
      A = tools.getTimestamp("hmsx");
      chai.expect(A).to.equal(h + '' +m + '' + s + '' + x);

      date = new Date();
      x = date.getMilliseconds() + "";
      A = tools.getTimestamp("hh:mm:ss.xx");
      chai.expect(A).to.equal(hh + ':' + mm + ':' + ss + '.' + x);

      date = new Date();
      x = date.getMilliseconds() + "";
      A = tools.getTimestamp("hhmmssxx");
      chai.expect(A).to.equal(hh + '' + mm + '' + ss + '' + x);
    });

    it('timezone: Z, ZZ, ZZZ, ZZZZ, ZZZZZ, z, zz, ...', () => {
      const date = new Date();
      const Z = TZDC(date.getTimezoneOffset());

      let A = tools.getTimestamp("Z");
      chai.expect(A).to.equal(Z);
      A = tools.getTimestamp("ZZ");
      chai.expect(A).to.equal(Z);
      A = tools.getTimestamp("ZZZ");
      chai.expect(A).to.equal(Z);
      A = tools.getTimestamp("ZZZZ");
      chai.expect(A).to.equal(Z);
      A = tools.getTimestamp("ZZZZZ");
      chai.expect(A).to.equal(Z);
      A = tools.getTimestamp("z");
      chai.expect(A).to.equal(Z);
      A = tools.getTimestamp("zz");
      chai.expect(A).to.equal(Z);
      A = tools.getTimestamp("zzz");
      chai.expect(A).to.equal(Z);
      A = tools.getTimestamp("zzzz");
      chai.expect(A).to.equal(Z);
      A = tools.getTimestamp("zzzzz");
      chai.expect(A).to.equal(Z);
    });

    it('ISO-8601: YYYY-MM-DD hh:mm:ss ZZZZZ', () => {
      const date = new Date();
      let Y = date.getFullYear();
      let M = date.getMonth() + 1;
      if(M < 10) M = "0" + M;
      let D = date.getDate();
      if(D < 10) D = "0" + D;
      let h = date.getHours();
      if(h < 10) h = "0" + h;
      let m = date.getMinutes();
      if(m < 10) m = "0" + m;
      let s = date.getSeconds();
      if(s < 10) s = "0" + s;
      let x = date.getMilliseconds();
      if(x < 10) x = "00" + x;
      else if(x < 100) x = "0" + x;
      let Z = TZDC(date.getTimezoneOffset());

      const iso8601TA = tools.getTimestamp("ISO-8601");
      const iso8601TB = Y+'-'+M+'-'+D + ' ' + h+':'+m+':'+s + ' ' + Z ;
      chai.expect(iso8601TA).to.equal(iso8601TB);
    });
  });
}

runTesting(config.standardRelease);
