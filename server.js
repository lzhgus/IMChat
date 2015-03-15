var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen(3000);

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['public room'];

io.sockets.on('connection', function (socket) {
    
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'public room';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to public room
		socket.join('public room');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to public room');
		// echo to public room that a person has connected to their room
		socket.broadcast.to('public room').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'public room');
	});
	
    
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});
	
    // when the cliken emits 'createroom', this listens and executes
    socket.on('createroom',function(roomname){
        socket.leave(socket.room);
        rooms.push(roomname);
        socket.join(roomname);
        socket.emit('updatechat','SERVER','you have create a new room  '+roomname);
        socket.emit('updatechat','SERVER','you have connected to room '+roomname);
        //// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
        // update socket session room title
		socket.room = roomname;
		socket.broadcast.to(roomname).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		io.sockets.emit('updaterooms', rooms, roomname);
    });
        
        
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});
	

    
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
