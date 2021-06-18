"use strict";

//ECMAScript v6.5.0
//Supporting Homework #4, refactored from HW#1
//25-SEP-2016
//Stephen Taylor, University of Colorado Denver
//staylorx@gmail.com

var log = require('winston');
var fs = require('fs');
var readline = require('readline');
var Scanner = require('./scanner.js');
var stream = require('stream');
var LineByLine = require('n-readlines');
log.level = "info";

class Grammar {

  constructor(grammarFile /*: string */, reservedTokens ) {
    
    this.reservedTokens = reservedTokens;
    this.productionNumber = 1;
    this.productions = new Map();
    this.nonTerminals = new Set();
    this.terminals = new Set();
    this.derivesLambda = new Set();
    this.firstSet = new Map();
    this.followSet = new Map();
    this.parseTable = new Map();

    if (grammarFile !== undefined) {
      this.grammarReader(grammarFile);
      //this.fillParseTable();
    }
    
    log.verbose("###############################");
    log.verbose("#");
    log.verbose("# Grammar has been constructed.");
    log.verbose("#");
    log.verbose("###############################");

  } //end constructor

  grammarReader(grammarFile) {
    //passed in a file... let's go check it

    this.instream = fs.createReadStream(grammarFile);
    this.outstream = new stream;
    this.rl = readline.createInterface(this.instream, this.outstream);

    var liner = new LineByLine(grammarFile);

    var line;
    while ((line = liner.next().toString())) {
      
      if (line === "false") {
        //strange little oddness of n-readlines library
        break;
      }
      
      log.verbose("[Grammar] Creating scanner");
      var scanner = new Scanner(line,this.reservedTokens);
      var rhArray = new Array();
      var rhArray2 = new Array();
      
      //get the first token... which will be the lhs
      let token = scanner.scan();
      this.nonTerminals.add(scanner.tokenBuffer);
      var lhSymbol = scanner.tokenBuffer;
      
      //sanity check the second token which must be "->"
      token = scanner.scan();
      if (token !== "Produces") {
        throw "[Grammar] The second token should be '->'";
      }
      
      //scan through the rhs
      //the first rhArray is used for calcing the parseTable
      //the second rhArray has the action function in the array also
      while ((token = scanner.scan()) !== "EofSym") {
        if (token === "NonTerminal") {
          this.nonTerminals.add(scanner.tokenBuffer);
          rhArray.push(scanner.tokenBuffer);
          rhArray2.push(scanner.tokenBuffer);
        } else if (token === "Action") {
          rhArray2.push(scanner.tokenBuffer);
        } else {
          this.terminals.add(token);
          rhArray.push(token);
          rhArray2.push(token);
        }
      }
      //add the two sides to the productions map
      this.addProduction(lhSymbol,rhArray,rhArray2);
      
    }
      
  }

  /*
   * Helper to add the left- and right-hand sides
   * to the productions Map.
   */
  addProduction(lhSymbol /*: string*/ ,rhArray /*: Array */, rhArray2) {
    var tempProd = {
      LHS: lhSymbol,
      RHS: rhArray,
      RHSActions: rhArray2,
      productionNumber: this.productionNumber
    };
    this.productions[this.productionNumber++] = tempProd;
  }

  //run through the vocabulary and indicate what can derive lambda
  markLambda() {
    
    log.verbose("markLambda");
    
    var changes = true;
    var rhsDerivesLambda = false;
    var self = this;

    //initialize vocabulary with false
    for (const symbol of self.nonTerminals) {
      self.derivesLambda[symbol] = false;    
    }
    for (const symbol of self.terminals) {
      self.derivesLambda[symbol] = false;
    }

    while(changes) {
      changes = false;

      for (let i = 1; i < this.productionNumber; i++) {
        let P = this.productions[i];
        rhsDerivesLambda = true;      
        
        for (let i = 0; i < P.RHS.length; i++) {
          if (P.RHS[i] === 'Lambda') {
            self.derivesLambda[P.RHS[i]] = true;
          }
          rhsDerivesLambda = rhsDerivesLambda && self.derivesLambda[P.RHS[i]];    
        }
        if (rhsDerivesLambda && !self.derivesLambda[P.LHS] ) {
          changes = true;       
          self.derivesLambda[P.LHS] = true;
        } 
    
       } //end for P in productions
       
     } //end while changes
    
  }

  //helper to look for production A -> a ...
  //returns the production if found, otherwise undefined
  getProduction(A,a) {
    for (let i = 1; i < this.productionNumber; i++) {
      let P = this.productions[i];
      if (P.LHS === A && P.RHS[0] === a) {
        return P;
      }
    }
  }
  
  getProductions(A) /*: Set */ {
    let result = new Set();
    for (let i = 1; i < this.productionNumber; i++) {
      let P = this.productions[i];
      if (P.LHS === A) {
        result.add(P);
      }
    }
    return result;
  }
  
  getProductionByLHS(nonTerminal) {
    for (let i = 1; i < this.productionNumber; i++) {
      let P = this.productions[i];
      if (P.LHS === nonTerminal) {
        return P;
      }
    }
  }
  
  getProductionById(id) {
    for (let i = 1; i < this.productionNumber; i++) {
      let P = this.productions[i];
      if (P.productionNumber === id) {
        return P;
      }
    }
  }
    
  //creates a map of arrays with the LL(1) parse table info.
  fillParseTable() {

    log.verbose("[Grammar] fillParseTable");

    this.fillPredictSet();
    
    for (const nt of this.nonTerminals) {
      let terminalsSet = new Map();
    
      for (let i = 1; i < this.productionNumber; i++) {
        let P = this.productions[i];
        
        if (P.LHS === nt) {
          for (const t of P.predictSet) {
            terminalsSet.set(t,i);
          }
        }
      }
      
      this.parseTable.set(nt,terminalsSet);
    }    
    
  }
  
  //This gets used so much I figured why not make it exact
  //easily comes back as undefined if no production found
  T(X,a) {
    let xResult = this.parseTable.get(X);
    if (xResult !== undefined) {
      return xResult.get(a);
    }
  }
  
  fillFirstSet() {
    
    log.verbose("[Grammar] fillFirstSet");

    //wonderfully difficult to troubleshoot if you don't marklambda
    this.markLambda();
    
    for (const A of this.nonTerminals) {
      if (this.derivesLambda[A]) {
        this.firstSet.set(A, new Set(['Lambda']));
      } else {
        this.firstSet.set(A, new Set());
      }
    }
    
    for (const a of this.terminals) {
      this.firstSet.set(a, new Set()); 
      this.firstSet.get(a).add(a);
      for (const A of this.nonTerminals) {
        //if there exists a production A -> a ...
        if (this.getProduction(A,a) !== undefined) {
          this.firstSet.get(A).add(a);
        }
      }
    }
    
    var notChanged = false;
    while (!notChanged) {
      notChanged = false;
      
      for (let i = 1; i < this.productionNumber; i++) {
        let p = this.productions[i];
  
        //combine the sets
        //clone the first set for later comparison
        let originalSet = cloneSet(this.firstSet.get(p.LHS));
        let unionedSet = unionSet(originalSet,this.computeFirst(p.RHS));

        log.debug("[Grammar] Set firstSet(",p.LHS,"to",unionedSet);
        this.firstSet.set(p.LHS, unionedSet);
        
        //exit when no changes?
        notChanged = isEqual(originalSet,unionedSet);
      }
    } //end while
  } //end fillFirstSet
  
  fillPredictSet() {
    
    log.verbose("[Grammar] fillPredictSet");

    this.fillFollowSet();
    
    for (let i = 1; i < this.productionNumber; i++) {
      let p = this.productions[i];
      log.debug("[Grammar] Calculating predictSet for",p);
      
      if (this.firstSet.get(p.RHS[0]).has('Lambda') || this.firstSet.get(p.RHS[0]).size === 0) {
        p.predictSet = this.followSet.get(p.LHS);
        p.predictSet.delete('Lambda');
      } else {
        p.predictSet = this.firstSet.get(p.RHS[0]);
      }
      
    }
    
  } //end fillPredictSet

  
  fillFollowSet(startSymbol) {
    
    log.verbose("[Grammar] fillFollowSet");

    if (startSymbol === undefined) {
      startSymbol = '<system goal>';
    }
    
    //wonderfully difficult to troubleshoot if you don't marklambda
    this.markLambda();
    this.fillFirstSet();
    
    //prepare the map
    for (const A of this.nonTerminals) {
      this.followSet.set(A, new Set());
    }
    
    this.followSet.get(startSymbol).add('Lambda');
    
    var notChanged = false;
    while (!notChanged) {
      notChanged = false;
      
      for (let i = 1; i < this.productionNumber; i++) {
        let p = this.productions[i];
        
        log.debug("[Grammar] Calculating followSet for",p);
        
        const originalSet = cloneSet(this.followSet.get(p.LHS));

        let rhs = toArray(p.RHS);
        //for each production A -> xBy
        for (let j = 0; j < rhs.length; j++) {

          if (this.nonTerminals.has(rhs[j])) {
            //find the B
            let B = rhs[j];
            let y = rhs[j+1];
            let computeFirst = this.firstSet.get(y);
            let unionedSet = unionSet(this.followSet.get(B),computeFirst);
            this.followSet.set(B, unionedSet);
            this.followSet.get(B).delete('Lambda');
            if (computeFirst === undefined || computeFirst.has('Lambda')) {
              let unionedSet = unionSet(this.followSet.get(B),this.followSet.get(p.LHS));
              notChanged = isEqual(originalSet,unionedSet);
              this.followSet.set(B,unionedSet);
            }
            //exit when no changes?
            notChanged = isEqual(originalSet,this.followSet.get(p.LHS));
          }
        } //for each symbol in the RHS
        
      } //for each production
    }
  }
  
  computeFirst(x) /*: Set */ {
    
    let i = 0;
    let k = x.length;
    
    let result = new Set();
    
    if (k === 0) {
      result.add('Lambda');
    } else {
      
      let firstSetMinusLambda = this.firstSet.get(x[i]);
      firstSetMinusLambda.delete('Lambda');
      result = unionSet(result,firstSetMinusLambda);
      
      while (i < k && this.firstSet.get(x[i]).has('Lambda')) {
        i++;
        firstSetMinusLambda = this.firstSet.get(x[i]);
        firstSetMinusLambda.delete('Lambda');
        result = unionSet(result,firstSetMinusLambda);
      }
      
      if (i === k && this.firstSet.get(x[i]).has('Lambda')) {
        result.add('Lambda');
      }
      
    }
    log.verbose("[Grammar] computeFirst(",x,")","returns",result);

    return result;
  }

}

function toArray(set) {
  let result = new Array();
  for (const s of set) {
    result.push(s);
  }
  return result;
}

function isEqual(aSet, bSet) {
  if (aSet.size !== bSet.size) {
    return false;
  }
  for (const a of aSet) {
    if (!bSet.has(a)) {
      return false;
    }
  }
  for (const b of bSet) {
    if (!aSet.has(b)) {
      return false;
    }
  }
  return true;
}

function unionSet(aSet, bSet) {
  let result = new Set();
  if (aSet === undefined) {
    aSet = new Set();
  }
  if (bSet === undefined) {
    bSet = new Set();
  }
  
  for (const a of aSet) {
    result.add(a);
  }
  for (const b of bSet) {
    result.add(b);
  }
  return result;
}

function cloneSet(aSet) {
  let result = new Set();
  for (const a of aSet) {
    result.add(a);
  }
  return result;
}

module.exports = Grammar;