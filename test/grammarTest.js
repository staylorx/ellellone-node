"use strict";

//ECMAScript 6 (NodeJS v6.5.0)
//Grammar tester for LL1
//05-OCT-2016
//Stephen Taylor, University of Colorado Denver
//staylorx@gmail.com

var assert = require('assert');
var Grammar = require('../app/grammar.js');
var log = require('winston');
log.level = "verbose";

describe('Grammar test', function(){
  
  var reservedTokens = {
    BeginSym:   "BEGIN",
    EndSym:     "END",
    ReadSym:    "READ",
    WriteSym:   "WRITE",
    EofScan:    "$"
  };

  it('for grammar lhs, rhs', function(){
    let grammar = new Grammar();
    grammar.addProduction("<LH TEST>",["one","two","three"]);
    assert(grammar.productions[1].LHS === "<LH TEST>","LHS does not match.");
    assert(grammar.productions[1].RHS[1] === "two","RHS does not match.");
  });

});

