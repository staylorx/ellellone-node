"use strict";

//ECMAScript 6 (NodeJS v6.5.0)
//Homework #3
//18-SEP-2016
//Stephen Taylor, University of Colorado Denver
//staylorx@gmail.com

var assert = require('assert');
var fs = require('fs');
var Parser = require('../app/parser.js');
var stringTable = require("string-table");
var log = require('winston');
log.level = "verbose";

//made this configurable because with each assignment these change slightly
var ValidTokens = {
  BeginSym:   "begin",
  EndSym:     "end",
  ReadSym:    "read",
  WriteSym:   "write",
  Id:         "ID",
  IntLiteral: "INT",
  LParen:     "(",
  RParen:     ")",
  SemiColon:  ";",
  Comma:      ",",
  AssignOp:   ":=",
  PlusOp:     "+",
  MinusOp:    "-",
  EofSym:     "$"
};

xdescribe('Parser Tests', function(){

  it('Testing the Parser, example from the assignment.', function(){
    let programString = `begin A := BB + 314 + A; end`;
    var parser = new Parser(programString, ValidTokens, "grammar1.txt");
    try {
      parser.parse();
      var w = fs.createWriteStream('out/hw3-1.txt');
      w.write("Input:\n")
      w.write(programString + "\n");
      w.write("\nDetailed Output:\n")
      w.write(stringTable.create(parser.totalOutput,{ headerSeparator: '*', rowSeparator: '~' }));
      w.end();
      assert(true,"Parsing completed successfully.");
    } catch(err) {
      assert(false,"Parsing failed: " + err);
      return;
    }
  });

  it('Testing the Parser, 2nd example.', function(){
    let programString = `
      begin 
        read(A,B,C,D,G);
        Q := A + B + C; 
        Z := D + G;
        Y := Q + Z;
      end`;
    var parser = new Parser(programString, ValidTokens, "grammar1.txt");
    try {
      parser.parse();
      var w = fs.createWriteStream('out/hw3-2.txt');
      w.write("Input:\n")
      w.write(programString + "\n");
      w.write("\nDetailed Output:\n")
      w.write(stringTable.create(parser.totalOutput,{ headerSeparator: '*', rowSeparator: '~' }));
      w.end();
      assert(true,"Parsing completed successfully.");
    } catch(err) {
      assert(false,"Parsing failed: " + err);
      return;
    }
  });

});
