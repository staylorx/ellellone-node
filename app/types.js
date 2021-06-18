"use strict";

/*
 * data types (sort of) to support the symantic routines
 */

class OperatorRecord {
  
  constructor(kind = OperatorKind.PLUS_OP) {
    this.kind = kind;
  }
  
}

class ExpressionRecord {
  
  constructor(symbol = "BogusSym", kind = ExpressionKind.ID_EXPR, value = "Bogus") {
    this.symbol = symbol;
    this.kind = kind;
    if (kind === ExpressionKind.ID_EXPR || kind === ExpressionKind.TEMP_EXPR) {
      value ? this.name = value.toString() : this.name = "BOGUS";
    }  if (kind === ExpressionKind.LITERAL_EXPR) {
      value ? this.val = parseInt(value,10) : this.val = -999;
    }
  }
  
}

class SemanticRecord {
  constructor(opRec, exprRec, error, kind = SemanticKind.EXPR_REC) {
    this.kind = kind;
    if (opRec !== undefined) {
      this.opRec = opRec;
    } else if ( exprRec !== undefined ) {
      this.exprRec = exprRec;
    } else {
      this.error = error;
    }
  }
}



var ExpressionKind ={
  ID_EXPR:     1,
  LITERAL_EXPR:2,
  TEMP_EXPR:   3
};

var OperatorKind = {
  PLUS_OP:  1,
  MINUS_OP: 2
};

var SemanticKind = {
  OP_REC:   1,
  EXPR_REC: 2,
  ERROR:    3
};

module.exports = { SemanticRecord, ExpressionRecord, OperatorRecord, ExpressionKind, OperatorKind, SemanticKind };