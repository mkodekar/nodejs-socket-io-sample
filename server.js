const express = require('express');
const app = express();
const parser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io').listen(http);

app.set('port', (process.env.PORT || 1800));

app.use(parser.urlencoded({
    extended: true
}));

app.use(parser.json());

var pushService = (function () {
    var connections = {}
    return {
        regiseterUser: function (userId, connectionId) {
            if (connections[userId] == undefined) {
                connections[userId] = {}
            }

            connections[userId][connectionId] = null;
            console.log('Registered connection ' + connectionId.substring(0, 4) + '*** for user ' + userId);
        },

        registerSocket: function (userId, connectionId, socket) {
            if (connections[userId] != null && connections[userId][connectionId] == null) {
                socket.userId = userId;
                socket.connectionId = connectionId;
                connections[userId][connectionId] = socket;
                console.log('Registered socket for connection ' + connectionId.substring(0, 4) + '*** and  user ' + userId);
                return true;
            } else {
                console.log('Not found empty conn for connection ' + connectionId.substring(0, 4) + '*** and  user ' + userId);
                return false;
            }
        },

        removeConnection: function (socket) {
            var userId = socket.userId;
            var connnectionId = socket.connectionId;
            if (userId && connnectionId && connections[userId] && connections[userId][connnectionId]) {
                console.log('Removed socket for user ' + userId + ' and connection: ' + connectionId.substring(0, 4) + '***');
                delete connections[socket.connectionId];
            }
        },

        pushMessage: function (userId, message) {
            var userConnections = connections[userId];
            if (userConnections) {
                for (var connectionId in userConnections) {
                    if (userConnections.hasOwnProperty(connectionId)) {
                        var socket = userConnections[connectionId];
                        if (socket != null) {
                            socket.emit('message', message);
                        }
                    }
                }
            }
        },

        pushAll: function(message) {
            socket.emit('message', message);
        }
    }
}());

io.on('connection', function (socket) {
    socket.on('register', function (userId, connectionId) {
        pushService.registerSocket(userId, connectionId, socket);
    });

    socket.on('disconnect', function () {
        pushService.removeConnection(socket);
    });
});

app.post('/api/notification/register', function (req, res) {
    var userId = req.body.userId;
    var connectionId = req.body.connectionId;
    if (userId && connectionId) {
        pushService.regiseterUser(userId, connectionId);
        res.status(200).send({
            success: 1,
            message: 'User registered successfully'
        });
    } else {
        res.status(400).send({
            succes: 0,
            message: 'unable to register user'
        });
    }
});

app.post('/api/notification/push', function (req, res) {
    var userId = req.body.userId;
    var message = req.body.message;

    if (userId && message) {
        pushService.pushAll(message);
        res.status(200).send({
            success: 1,
            message: 'Message sent to the the user'
        });
    } else {
        res.status(400).send({
            success: 0,
            message: 'Unable to send message to the use'
        });
    }
});
http.listen(app.get('port'), function() {
    console.log('Running on port', app.get('port'));
});