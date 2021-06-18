"use strict";

var log = require('winston');
var SymbolTable = require("./symbolTable.js");
var types = require("./types.js");
var SemanticStack = require("./semanticStack.js");

/*
 * A class to build out semantic rules as output instructions.
 * ECMAScript 6 (NodeJS v6.5.0)
 * 01-NOV-2016
 * Stephen Taylor, University of Colorado Denver
 * staylorx@gmail.com
 */

class Semantic {

  //Sets the readable stream so the scanner can work on it.
  //The "Start" semantic routine is equivalent to the instantiation
  //of the Symantic class.
  //IN:  consoleFlag is a boolean that determines if the generate will
  //     print to console or stdout. Defaults to false.
  constructor(consoleFlag = false ) {
    log.debug("[Semantic] Constructing semantic...");
    
    this.currentToken = "";  
    this.nextToken = "";  
    this.consoleFlag = consoleFlag; 

    this.symbolTable = new SymbolTable();
    this.maxTemp = 0;
    
    //semantic stack starts with the start symbol
    this.stack = new SemanticStack('<system goal>');

  }

  //Generate an instruction for the machine
  //IN:  an array of arguments
  //OUT: s is a string instruction
  generate(...args) /*: string */ {
    if (args.length < 1 || args.length > 4) {
      throw "[Semantic] Argument count must be between 1 and 4.";
    }
    let s = "";
    s = args[0];
    if (args.length > 1) {
      s += " " + args.slice(1).join(",");
    }
    
    if (this.consoleFlag) {
      //"write" the generation out
      console.log(s);
    }
    
    //return it too so it can be tested easily
    return s;
  }
  
  
  checkId(symbol /*: string */) {
    if (!this.symbolTable.lookup(symbol)) {
      //didn't find the symbol in the lookup table...
      //generate an instruction for it then
      this.symbolTable.enter(symbol);
      let code = this.generate("Declare",symbol,"Integer");
      this.codeLines.push(code);
      return code;
    }
  }
  
  getTemp() /*: string */{
    this.maxTemp++;
    var tempName = "Temp&" + this.maxTemp;
    this.checkId(tempName);
    return tempName;
  }
  
  extractExpr(e /*:typeof types.ExpressionRecord*/) {
    switch (e.kind) {
      case (types.ExpressionKind.ID_EXPR || types.ExpressionKind.TEMP_EXPR):
        return e.name;
      case (types.ExpressionKind.LITERAL_EXPR):
        return e.val;
    }
  }

  extractOp(o /*:typeof types.OperatorRecord*/) {
    if (o.kind === types.OperatorKind.PLUS_OP) {
      return "ADD ";
    } else {
      return "SUB ";
    }
  }

  extract(e /*:typeof types.SemanticRecord*/) {
    switch (e.kind) {
      case (types.SemanticKind.OP_REC):
        return this.extractOp(e.opRec);
      case (types.SemanticKind.EXPR_REC):
        return this.extractExpr(e.exprRec);
      case (types.SemanticKind.ERROR):
        return null;
    }
  }

  //Generates the assign
  //OUT: returns the string generated
  assign(target /*:typeof types.SemanticRecord*/, source /*:typeof types.SemanticRecord*/) /*: string */ {
    let code = this.generate("Store",this.extract(source),target.exprRec.name);
    return code;
  }

  //Generates the read
  //OUT: returns the string generated
  readId(inVar /*: SemanticRecord */) /*: string */{
    let code =  this.generate("Read",inVar.exprRec.name,"Integer");
    return code;
  }

  //Generates the write
  //OUT: returns the string generated
  writeExpr(outExpr /*:typeof types.SemanticRecord*/) {
    let code = this.generate("Write",this.extract(outExpr),"Integer");
    return code;
  }
  
  //OUT: returns an exprRec
  genInfix(e1 /*:typeof types.SemanticRecord*/,op /*:typeof types.SemanticRecord*/,e2 /*:typeof types.SemanticRecord*/)  /*: types.SemanticRecord */{
    let exprRec = new types.ExpressionRecord(types.ExpressionKind.TEMP_EXPR);
    exprRec.name = this.getTemp();
    let code = this.generate(this.extractOp(op),this.extract(e1), this.extract(e2), exprRec.exprRec.name);
    //TODO hacky
    console.log(code);
    return exprRec;
  }

  //returns a new SemanticRecord
  processId() /*: types.SemanticRecord */{
    this.checkId(this.currentStack());
    let name = this.currentStack();
    return new types.ExpressionRecord("Id",types.ExpressionKind.ID_EXPR,name);
  }
  
  //returns an SemanticRecord
  processLiteral() /*: types.SemanticRecord */ {
    let value = this.currentStack();
    return new types.ExpressionRecord("IntLiteral",types.ExpressionKind.LITERAL_EXPR,parseInt(value,10));
  }
  
  //Take a plus/minus token and returns a new OperatorRecord
  processOp() {
    let token = this.currentStack();
    if (token === "PlusOp") {
      return new types.OperatorRecord(types.OperatorKind.PLUS_OP);      
    } else {
      return new types.OperatorRecord(types.OperatorKind.MINUS_OP);      
    }
  }
  
  currentStack() {
    let curS = this.SS.currentItem();
    return this.extract(curS);
  }
  
  //finishing instruction. yay!
  finish() /*: string */ {
    let code = this.generate("Halt");
    return code;
  }

}

module.exports = Semantic;