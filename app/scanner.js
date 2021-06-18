"use strict";

//ECMAScript v6.5.0
//Supporting Homework #4, refactored from HW#1
//25-SEP-2016
//Stephen Taylor, University of Colorado Denver
//staylorx@gmail.com

var log = require('winston');
var Readable = require('stream').Readable;
log.level = "info";

var Action = {
  ERROR:         8, //1000
  MOVE_APPEND:   5, //0110
  MOVE_NOAPPEND: 4, //0100
  HALT_APPEND:   2, //0010
  HALT_NOAPPEND: 0, //0000
  HALT_REUSE:    1  //0001
};

//lots of room for improvement here but using indexOf against the state string works.
//I could use a regex here but if I could do that then why would I do any of this? :)
//Watch out for the Unix newline vs linefeed-newline.
//currentState 5 has an "other" block which is useful if nothing matches at all,
//otherwise this throws a couple of exceptions, one for no valid currentState,
//the other is a character can't be matched and there is no valid 'other' path.
//
//The code field is to keep me straight in all of this, but also when I reach
//an accepting (aka "terminal") state I have a name for that place.
var bootstrapTable = {
  "0": { 
    code: "StartState",
    states: {
      "$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":{state:1,action:Action.MOVE_APPEND},
      "0123456789":{state:2,action:Action.MOVE_APPEND},
      " ":{state:3,action:Action.MOVE_NOAPPEND},
      "+":{state:14,action:Action.HALT_APPEND},
      "-":{state:4,action:Action.MOVE_APPEND},
      ":":{state:6,action:Action.MOVE_APPEND}, 
      ",":{state:17,action:Action.HALT_APPEND}, 
      ";":{state:18,action:Action.HALT_APPEND}, 
      "(":{state:19,action:Action.HALT_APPEND}, 
      ")":{state:20,action:Action.HALT_APPEND},
      "\t":{state:3,action:Action.MOVE_NOAPPEND}, 
      "\r":{state:3,action:Action.MOVE_NOAPPEND},
      "\n":{state:3,action:Action.MOVE_NOAPPEND},
      "<":{state:7,action:Action.MOVE_APPEND},
      ">":{state:7,action:Action.MOVE_APPEND},
      "#":{state:8,action:Action.MOVE_APPEND},
      "λ":{state:24,action:Action.HALT_NOAPPEND},
    }
  },
  "1": { 
    code: "LettersNumbersUnderscores",
    states: {
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":{state:1,action:Action.MOVE_APPEND},
      "0123456789":{state:1,action:Action.MOVE_APPEND},
      " ":{state:11,action:Action.HALT_NOAPPEND}, 
      "+":{state:11,action:Action.HALT_REUSE},
      "-":{state:11,action:Action.HALT_REUSE},
      "=":{state:11,action:Action.HALT_REUSE}, 
      ":":{state:11,action:Action.HALT_REUSE},
      ",":{state:11,action:Action.HALT_REUSE},
      ";":{state:11,action:Action.HALT_REUSE},
      "(":{state:11,action:Action.HALT_REUSE},
      ")":{state:11,action:Action.HALT_REUSE}, 
      "_":{state:1,action:Action.MOVE_APPEND}, 
      "\t":{state:11,action:Action.HALT_NOAPPEND}, 
      "\r":{state:11,action:Action.HALT_NOAPPEND},
      "\n":{state:11,action:Action.HALT_NOAPPEND} 
    }
   },
  "2": { 
    codes: "Numbers",
    states: {
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":{state:12,action:Action.HALT_REUSE}, 
      "0123456789":{state:2,action:Action.MOVE_APPEND},
      " ":{state:12,action:Action.HALT_NOAPPEND},
      "+":{state:12,action:Action.HALT_REUSE},
      "-":{state:12,action:Action.HALT_REUSE},
      "=":{state:12,action:Action.HALT_REUSE}, 
      ":":{state:12,action:Action.HALT_REUSE},
      ",":{state:12,action:Action.HALT_REUSE},
      ";":{state:12,action:Action.HALT_REUSE},
      "(":{state:12,action:Action.HALT_REUSE},
      ")":{state:12,action:Action.HALT_REUSE}, 
      "_":{state:12,action:Action.HALT_REUSE},
      "\t":{state:12,action:Action.HALT_NOAPPEND},
      "\r":{state:12,action:Action.HALT_NOAPPEND}, 
      "\n":{state:12,action:Action.HALT_NOAPPEND} 
    }
  },
  "3": {
    codes: "EmptySpaces",
    states: {
      "$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":{state:13,action:Action.HALT_REUSE},
      "0123456789":{state:13,action:Action.HALT_REUSE}, 
      " ":{state:3,action:Action.MOVE_NOAPPEND}, 
      "+":{state:13,action:Action.HALT_REUSE},
      "-":{state:13,action:Action.HALT_REUSE}, 
      "=":{state:13,action:Action.HALT_REUSE},
      ":":{state:13,action:Action.HALT_REUSE},
      ",":{state:13,action:Action.HALT_REUSE},
      "λ":{state:24,action:Action.HALT_NOAPPEND},
      ";":{state:13,action:Action.HALT_REUSE}, 
      "(":{state:13,action:Action.HALT_REUSE},
      ")":{state:13,action:Action.HALT_REUSE},
      "_":{state:13,action:Action.HALT_REUSE},
      "\t":{state:3,action:Action.MOVE_NOAPPEND}, 
      "\r":{state:3,action:Action.MOVE_NOAPPEND},
      "\n":{state:3,action:Action.MOVE_NOAPPEND},
      "#":{state:8,action:Action.MOVE_APPEND},
      "<":{state:13,action:Action.HALT_REUSE},
    }
  },
  "4": { 
    code: "DashStart",
    states: {
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":{state:21,action:Action.HALT_REUSE},
      "0123456789":{state:21,action:Action.HALT_REUSE},
      " ":{state:21,action:Action.HALT_NOAPPEND}, 
      "+":{state:21,action:Action.HALT_REUSE},
      "-":{state:5,action:Action.MOVE_NOAPPEND},
      "=":{state:21,action:Action.HALT_REUSE},
      ":":{state:21,action:Action.HALT_REUSE},
      ",":{state:21,action:Action.HALT_REUSE},
      ";":{state:21,action:Action.HALT_REUSE},
      "(":{state:21,action:Action.HALT_REUSE},
      ")":{state:21,action:Action.HALT_REUSE}, 
      "\r":{state:21,action:Action.HALT_NOAPPEND}, 
      "\n":{state:21,action:Action.HALT_NOAPPEND}, 
      ">":{state:23,action:Action.HALT_NOAPPEND}, 
      }
  },
  "5": {
    code: "CommentOrProduction",
    other: {state:5,action:Action.MOVE_NOAPPEND},
    states: {
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":{state:5,action:Action.MOVE_NOAPPEND},
      "0123456789":{state:5,action:Action.MOVE_NOAPPEND},
      " ":{state:5,action:Action.MOVE_NOAPPEND},
      "+":{state:5,action:Action.MOVE_NOAPPEND},
      "-":{state:5,action:Action.MOVE_NOAPPEND},
      "=":{state:5,action:Action.MOVE_NOAPPEND}, 
      ":":{state:5,action:Action.MOVE_NOAPPEND}, 
      ",":{state:5,action:Action.MOVE_NOAPPEND},
      ";":{state:5,action:Action.MOVE_NOAPPEND},
      "(":{state:5,action:Action.MOVE_NOAPPEND},
      ")":{state:5,action:Action.MOVE_NOAPPEND},
      "_":{state:5,action:Action.MOVE_NOAPPEND}, 
      "\t":{state:5,action:Action.MOVE_NOAPPEND}, 
      "\r":{state:15,action:Action.HALT_NOAPPEND},
      "\n":{state:15,action:Action.HALT_NOAPPEND}
    }
  },
  "6": {
    code: "LooksLikeAnAssignOp",
    states: {
      "=":{state:16,action:Action.HALT_APPEND} 
    }
  },
  "7": {
    code: "NonTerminal",
    states: {
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":{state:7,action:Action.MOVE_APPEND},
      " ":{state:7,action:Action.MOVE_APPEND},
      ">":{state:22,action:Action.HALT_APPEND}
    }
  },
  "8": {
    code: "ActionSymbol",
    states: {
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":{state:8,action:Action.MOVE_APPEND},
      "0123456789":{state:8,action:Action.MOVE_APPEND},
      " ":{state:25,action:Action.HALT_NOAPPEND},
      "(":{state:9,action:Action.MOVE_APPEND},
    }
  },
  "9": {
    code: "ActionSymbolParens",
    states: {
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":{state:9,action:Action.MOVE_APPEND},
      "0123456789":{state:9,action:Action.MOVE_APPEND},
      " ":{state:9,action:Action.MOVE_APPEND},
      "$":{state:9,action:Action.MOVE_APPEND},
      ",":{state:9,action:Action.MOVE_APPEND},
      ")":{state:25,action:Action.HALT_APPEND}
    }
  },
  "11": { code: "Id", skip:false },
  "12": { code: "IntLiteral", skip:false },
  "13": { code: "EmptySpace", skip:true },
  "14": { code: "PlusOp", skip:false },
  "15": { code: "Comment", skip:true },
  "16": { code: "AssignOp", skip:false },
  "17": { code: "Comma", skip:false },
  "18": { code: "SemiColon", skip:false },
  "19": { code: "LParen", skip:false },
  "20": { code: "RParen", skip:false },
  "21": { code: "MinusOp", skip:false },
  "22": { code: "NonTerminal", skip:false },
  "23": { code: "Produces", skip:false },
  "24": { code: "Lambda", skip:false },
  "25": { code: "Action", skip:false }
};

class Scanner {

  //Sets the readable stream so the scanner can work on it.
  //IN:  readableInput is either a Readable or a {S,s}tring
  //IN:  an object of valid tokens
  constructor(readableInput, reservedTokens) {
    
    this.readable = new Readable();
    this.readable.setEncoding('UTF8');
    
    this.tokenBuffer = "";
    
    //init these to spaces... since I know I'm skipping spaces
    this.currentChar = " ";
    this.nextChar = " ";

    //TODO make this flexible by bringing these through the constructor
    this.reservedTokens = reservedTokens;
    this.table = bootstrapTable;

    if (typeof(readableInput) == 'string' || readableInput instanceof String) {
      this.readable.push(readableInput);
      //add EOF to the stream... very important to end the stream!
      this.readable.push(null);
    } else if (readableInput instanceof Readable) {
      this.readable = readableInput;
    } else {
      throw("[Scanner] No suitable input to scan.");
    }
    this.tokenBuffer = "";
    
    //get this party started... seed the nextChar
    this.consumeChar();
    
    log.verbose("###############################");
    log.verbose("#");
    log.verbose("# Scanner has been constructed.");
    log.verbose("#");
    log.verbose("###############################");
  }

  //Looks up reserved tokens
  //IN:  checkString is the identifier to be checked
  //OUT: returns the token as string or undefined if not found
  checkExceptions(checkToken) {
    for (var token in this.reservedTokens) {
      if (this.reservedTokens[token] == checkToken) {
        return token;
      }
    }
    return undefined;
  }
  
  //IN:  currentState is integer indicating the current state to work from
  //IN:  character is the character to be found... and therefore the category of character
  //OUT: return object including state and action... or undefined if not found
  lookupState(currentState /*: integer */,character) {
    
    //assume a character state as a guard
    if (character === undefined || character === null) {
      return this.lookupState(currentState,"\n");  
    }
    
    var foundState = this.table[currentState];
    
    if (foundState !== undefined) {
      
      //found a currentState... now lets dig in and find the actions
      for (let state in foundState.states) {
        if (state.indexOf(character) !== -1) {
          //found the character... return the state
          return foundState.states[state];
        }
      }
      
      //can't find it. Is there an 'other' section?
      if (foundState.other !== undefined) {
        return foundState.other;        
      } else {
        //no 'other' section. Bad juju
        throw "[Scanner] lookupState: Cannot find character '"+character+"' in for state '" + currentState + "'";
      }
    
    } else {
      throw "[Scanner] lookupState: Invalid State Provided";
    }

  }
  
  //IN:  currentState is integer indicating the current state to work from
  //OUT: return object with code and skip if found, otherwise gripe
  lookupCode(currentState /*: integer */) /*: string */ {
    
    var foundState = this.table[currentState];
    
    if (foundState !== undefined) {
      //found a currentState... return the code
      return foundState;
    } else {
      throw "[Scanner] lookupState: Invalid State Provided";
    }

  }
  
  //Resets the buffer to the empty string
  clearBuffer() {
    this.tokenBuffer = "";
  }

  //pick off a single character and set it to nextChar
  //this is always going to be off by one 
  //but it obviates the need for writing back to the stream.
  consumeChar() {
    this.currentChar = this.nextChar;
    this.nextChar = this.readable.read(1);
  }

  //An error function
  //IN:  currentChar is the offending character that can't be parsed
  //OUT: log an error message
  lexicalError(currentChar) {
    log.error("[Scanner] character " + currentChar + " could not be parsed.");
  }
  
  //Scanner recognizes micro identifiers and integer constances.
  //It skips white space such as tabs, spaces, and EOL.
  //OUT: returns single token
  scan() {
  
    this.clearBuffer();
    var currentState = 0;
    var token, reservedToken;
    
    //loop through until stream has no more characters.
    do {
      
      let actionBlock = this.lookupState(currentState,this.currentChar);
      log.debug("[Scanner] CurrentState:",currentState,",CurrentChar:",this.currentChar,",NextChar:",this.nextChar,",ActionState:",actionBlock.state,",TokenBuffer:",this.tokenBuffer);
        
      switch (actionBlock.action) {
        case Action.ERROR:
          //TODO a thing here
          break;
        case Action.MOVE_APPEND:
          currentState = actionBlock.state;
          this.tokenBuffer += this.currentChar;
          this.consumeChar();
          break;
        case Action.MOVE_NOAPPEND:
          currentState = actionBlock.state;
          this.consumeChar();
          break;
        case Action.HALT_APPEND:
          token = this.lookupCode(actionBlock.state);
          this.tokenBuffer += this.currentChar;
          reservedToken= this.checkExceptions(this.tokenBuffer);
          this.consumeChar();
          if (reservedToken !== undefined) {
            return reservedToken;
          } else if (token !== undefined && !token.skip) {
            return token.code;
          } else {
            //reset and keep moving
            this.clearBuffer();
            currentState = 0;
          }
          break;
        case Action.HALT_NOAPPEND:
          token = this.lookupCode(actionBlock.state);
          reservedToken = this.checkExceptions(this.tokenBuffer);
          this.consumeChar();
          if (reservedToken !== undefined) {
            return reservedToken;
          } else if (token.code !== undefined && !token.skip) {
            return token.code;
          } else {
            //reset and keep moving
            this.clearBuffer();
            currentState = 0;
          }
          break;
        case Action.HALT_REUSE:
          token = this.lookupCode(actionBlock.state);
          reservedToken = this.checkExceptions(this.tokenBuffer);
          if (reservedToken !== undefined) {
            return reservedToken;
          } else if (token.code !== undefined && !token.skip) {
            return token.code;
          } else {
            //reset and keep moving
            this.clearBuffer();
            currentState = 0;
          }
          break;
      }
      
    } while (this.currentChar !== null || this.tokenBuffer);
    
    return "EofSym";

  }
 
  /*
   * Helper method run the scans and output as a string
   * OUT: String of all the tokens together
   */
  tokensAsString() {
  
    let token = "";
    //run through the stream
    var outString = "";
    while ((token = this.scan()) !== "EofSym") {
      outString += token + " ";
      log.debug(token);
    }
    outString += "EofSym";
    
    return outString;
  }
  
}

module.exports = Scanner;