"use strict";

var log = require('winston');
log.level = "info";

class SymbolTable {

  constructor(maxSymbolSize = 1024) {
    log.verbose("[SymbolTable] Creating symbol table of size",maxSymbolSize);
    this.maxSymbol = maxSymbolSize;
    this.symbolTable = new Array(maxSymbolSize);
    this.lastSymbol = 0;
    
    log.verbose("###################################");
    log.verbose("#");
    log.verbose("# SymbolTable has been constructed.");
    log.verbose("#");
    log.verbose("###################################");
  }
  
  lookup(symbol) {
    log.debug("[SymbolTable] Lookup up symbol, '" + symbol );
    let up = false;
    for (let i in this.symbolTable) {
      if (this.symbolTable[i] === symbol) {
        up = true;
        break;
      }
    }
    return up;
  }
  
  enter(symbol) {
    log.debug("[SymbolTable] Entering symbol, '" + symbol + "' to table.");
    if (this.lastSymbol < this.maxSymbol) {
      
      //I don't need to ensure this array is unique
      //but it will drive me nuts if it isn't.
      if (!this.lookup(symbol)) {
        //couldn't find the symbol in the array...
        //so adding it now.
        this.lastSymbol++;
        this.symbolTable[this.lastSymbol] = symbol;
      }
      
    } else {
        this.symbolTableOverflow();
    }
  }
  
  symbolTableOverflow() {
      log.error("[SymbolTable] The symbol table is not large enough.");
      throw "SymbolTableOverflow";
  }
  
}

module.exports = SymbolTable;