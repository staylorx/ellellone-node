"use strict";

//ECMAScript 6 (NodeJS v6.5.0)
//Homework #3
//18-SEP-2016
//Stephen Taylor, University of Colorado Denver
//staylorx@gmail.com

var Parser = require('../app/parser.js');
var log = require('winston');
log.level = "debug";

var reservedCodeTokens = {
  BeginSym:   "begin",
  EndSym:     "end",
  ReadSym:    "read",
  WriteSym:   "write",
  EOfScan:    "$"
};

//grammar tokens include the IntLiteral which in grammar is a kind of Id. Fun.
var reservedGrammarTokens = {
  IntLiteral: "IntLiteral",
  PlusOp:     "PlusOp",
  MinusOp:    "MinusOp",
  BeginSym:   "begin",
  EndSym:     "end",
  ReadSym:    "Read",
  WriteSym:   "Write",
  EOfScan:    "$"
};

//let programString = `begin read (IN); OUT:= IN+100+1; write(OUT); end $ `;
let programString = "begin A := BB + 314 + A; end $";
var parser = new Parser(programString, reservedGrammarTokens, reservedCodeTokens, "grammar2.txt");

parser.LLDriver();

console.log("==============");
console.log("Output for HW8");
for (let line of parser.w8) {
  console.log(line);
}

console.log("Finished");