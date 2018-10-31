
var express     = require('express');
var bodyParser  = require('body-parser');
var mysql       = require('mysql');
var http        = require('http');
var socketIO    = require('socket.io');
var fs          = require('fs');
var path        = require('path');
var polyline    = require('@mapbox/polyline');

const app       = express();
config          = require('config');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.get('/', function(req,res){
    res.sendFile(__dirname + '/index.html');
});

connection = mysql.createConnection(config.get('database_settings'));
    
    connection.connect(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }else{
            console.log('database connected at...', config.get('database_settings.mysqlPORT'));
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.

var server = app.listen(config.get('PORT'), function () {
    console.log(`Server running at ${config.get('PORT')} `);
});

var io = socketIO(server);
var chunks = [];
var delay = 0;
var latitude, longitude, ride_id;
io.on('connection', function(socket){
    socket.on('message-input', function( data ) {
        latitude = data.latitude;
        longitude = data.longitude;
        ride_id = data.ride_id;
        var sql = ` INSERT INTO data SET ? `
        connection.query(sql, [data], function(err, result){
            if(err){
                console.log(err);
            }
        })
});
socket.on('message-request', function( data ) {
    let polylineData=[];
    var sql = ` SELECT * FROM data WHERE ride_id = ? `
    connection.query(sql, [data], function(err, result){
        if(err){
            console.log("error", err);
        }else{
            result.map(function(temp){
                polylineData.push([parseFloat(temp.latitude),parseFloat(temp.longitude)]);
            });
            let polylineString=polyline.encode(polylineData);
            socket.emit('message-output', polylineString);
        }

    })
});

});