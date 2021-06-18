"use strict";

var Scanner = require('./scanner.js');
var log = require('winston');
log.level = "debug";

var reservedCodeTokens = {
  BeginSym:   "begin",
  EndSym:     "end",
  ReadSym:    "read",
  WriteSym:   "write",
  EOfScan:    "$"
};

var reservedGrammarTokens = {
  IntLiteral: "IntLiteral",
  PlusOp:     "PlusOp",
  MinusOp:    "MinusOp",
  BeginSym:   "begin",
  EndSym:     "end",
  ReadSym:    "read",
  WriteSym:   "write",
  EOfScan:    "$"
};

let programString;
let scanner;

programString = "begin A := BB + 314 + A; end $";
scanner = new Scanner(programString,reservedCodeTokens);
log.info(scanner.tokensAsString());

// programString = "<statement>-> write(<expr list>) ;";
// scanner = new Scanner(programString,reservedGrammarTokens);
// log.info(scanner.tokensAsString());

// programString = "<add op>    -> PlusOp #ProcessOp($$)";
// scanner = new Scanner(programString,reservedGrammarTokens);
// log.info(scanner.tokensAsString());





