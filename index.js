// A wrapper for MongoDB's MongoClient that 
// handles keeping the connection open and
// dealing with reconnections.
//
// In Node.js applications MongoDB connections 
// are meant to be opened once and kept opened 
// while the Node.js app is running 
// (http://stackoverflow.com/a/15688610/446681).
// This code encapsulates the logic required to
// do this.  
//
// Be aware that currently only one database can 
// be handled through this code. As such, only the 
// first call to setup is honored, subsequent calls 
// are ignored.
//
// Typical usage is:
//  
//  // In your main server.js
//  var mongoConnect = require('./mongoConnect');
//  mongoConnect.setup('mongodb://localhost:27017/yourDB');
//
//  // In your database access code
//  var mongoConnect = require('./mongoConnect');
//  mongoConnect.execute(function(err, db) {
//    Your code to do something with the db goes here
//    e.g. db.collection('xxx').find(...)
//  })
//

var MongoClient = require('mongodb').MongoClient;
var dbUrl = null; 
var isConnected = false;
var db = null;
var dbOptions = {
  db: {},
  server: {
    auto_reconnect: true,
    socketOptions: {keepAlive: 1}
  },
  replSet: {},
  mongos: {}
};
var log = function() {}; // by default don't log


var connectAndExecute = function(callback) {

  log('Connecting...');
  MongoClient.connect(dbUrl, dbOptions, function(err, dbConn) {
    
    if(err) {
      log('Cannot connect: ' + err);
      callback(err);
      return;
    } 
    
    log('Connected!');
    isConnected = true;
    db = dbConn;

    // http://stackoverflow.com/a/18715857/446681
    db.on('close', function() {
      log('Connection was closed!!!');
      isConnected = false;
    });

    log('Executing...');
    callback(null, db);
  
  });

}


exports.execute = function(callback) {

  if(isConnected) {
    log('Executing...');
    callback(null, db);
  }
  else {
    connectAndExecute(callback);
  }

};


exports.setup = function(mongoUrl, mongoOptions, verbose) {
  
  if(dbUrl != null) {
    return;
  }

  dbUrl = mongoUrl;

  if(mongoOptions) {
    dbOptions = mongoOptions;
  }

  if(verbose === true) {
    log = function(msg) {
      console.log('mongoConnect: ' + msg); 
    };
    log('Verbose mode is on');
  }

};

