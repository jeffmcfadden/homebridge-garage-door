var request = require("request");
var Service, Characteristic;

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-jeffmcfadden-garage-door", "GarageDoor", GarageDoorAccessory);
}

function GarageDoorAccessory(log, config) {
  this.log = log;

  // url info
  this.url         = config["url"];
  this.ip_address  = config["ip_address"];
  this.api_key     = config["api_key"];
  this.password    = config["password"];
  this.name        = config["name"];
  this.zway_device_id = config["zway_device_id"]; //For the status
  this.session_cookie = config["session_cookie"]; //For the status
}

GarageDoorAccessory.prototype = {

  getDoorTargetPositionState: function(callback) {
    this.log("getDoorTargetPositionState");

    local_callback( null, Characteristic.CurrentDoorState.CLOSED );
  },

  getDoorPositionState: function(callback) {
    this.log("getDoorPositionState");

    //response.headers['content-type']

	  var self = this;

    var local_callback = callback;

    url = "http://" + self.ip_address + "/ZAutomation/api/v1/devices/" + self.zway_device_id + "/command/update"
    this.log("url: " + url);

    request({
      url: url,
      method: "GET",
      //'auth': { 'username': this.username, 'password': this.password },
      'headers': { 'Cookie' : "ZWAYSession=" + self.session_cookie }
    },
    function (error, response, body) {
		  self.log( body )

      url = "http://" + self.ip_address + "/ZAutomation/api/v1/devices/" + self.zway_device_id + ""
      self.log("url: " + url);

      request({
        url: url,
        method: "GET",
        //'auth': { 'username': this.username, 'password': this.password },
        'headers': { 'Cookie' : "ZWAYSession=" + self.session_cookie }
      },
      function (error, response, body) {
		    self.log( body )

        var data = JSON.parse(body);

		    self.log( data["data"] )

        var level = data["data"]["metrics"]["level"];

        if (level == "on") {
          local_callback( null, Characteristic.CurrentDoorState.OPEN );
        }else{
          local_callback( null, Characteristic.CurrentDoorState.CLOSED );
        }
      });
    });
  },

  getObstructionDetected: function(callback){
    this.log("getObstructionDetected");

    //Do something
    callback(null, false); //Not possible with my setup
  },

  setDoorTargetPosition: function( state, callback ){
    this.log("setDoorTargetPosition");

    //response.headers['content-type']

	  var self = this;

    var local_callback = callback;

    this.log("api_key: " + self.api_key);


    request.post({ url:self.url,
                   form: {"garage":"garage", "api_key": self.api_key }},
                 function (error, response, body) {
          		    self.log( "Return from telling the door to change state:" )
          		    self.log( body )
                  local_callback(null); //no error
    });
  },

  getName: function(callback) {
    this.log("getName");

    callback(null, this.name);
  },

  identify: function(callback) {
    this.log("Identify requested!");
    callback(); // success
  },

  getServices: function() {

    // you can OPTIONALLY create an information service if you wish to override
    // the default values for things like serial number, model, etc.
    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Jeff McFadden")
      .setCharacteristic(Characteristic.Model, "Garage Door Opener")
      .setCharacteristic(Characteristic.SerialNumber, "GDO-1");

    var garageDoorService = new Service.GarageDoorOpener(this.name);

    garageDoorService.getCharacteristic( Characteristic.CurrentDoorState ).on(    'get', this.getDoorPositionState.bind(this) );
    garageDoorService.getCharacteristic( Characteristic.TargetDoorState ).on(     'get', this.getDoorPositionState.bind(this) );
    garageDoorService.getCharacteristic( Characteristic.ObstructionDetected ).on( 'get', this.getObstructionDetected.bind(this) );
    garageDoorService.getCharacteristic( Characteristic.TargetDoorState ).on(     'set', this.setDoorTargetPosition.bind(this) );


    return [informationService, garageDoorService];
  }
};