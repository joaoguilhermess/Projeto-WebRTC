const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const InvalidStrings = [""];

function print(Name, id, list) {
	var text = "ID: " + id + ":\n    " + Name + "(\n";
	if (list) {
		for (var i = 0; i < list.length; i++) {
			text += "        ";
			switch (typeof list[i]) {
				case "function":
					text += "function";
					break;
				case "string":
					text += list[i];
					break;
				case "number":
					text += list[i];
					break;
				case "object":
					text += JSON.stringify(list[i]);
					break;
				default:
					text += list[i].toString();
					break;
			}
			if (list.length - i > 1) {
				text += ",\n";
			} else {
				text += "\n";
			}
			// text += "\n";
		}
	}
	text += "    );";

	console.log(text);
}

app.get("/", function(req, res) {
	res.sendFile(__dirname + "//" + "index.html");
});

app.get("/whitneymedium.woff", function(req, res) {
	res.sendFile(__dirname + "//" + "whitneymedium.woff");
});

app.get("/favicon.ico", function(req, res) {
	res.status(400);
});

io.on("connection", function(socket) {
	print("Connect", socket.id);

	socket.on("setname", function(name, callback) {
		try {
			print("SetName", socket.id, [name, callback]);
			if (!name || !callback) {
				return;
			}
			if (InvalidStrings.includes(name)) {
				return callback(false);
			}
			if (!socket.name) {
				socket.name = name;
				callback(true);
			} else {
				callback(false);
			}
		} catch (e) {
			console.error("SetName Error", e);
		}
	});

	socket.on("createroom", function(room, callback) {
		try {
			print("CreateRoom", socket.id, [room, callback]);
			if (!room || !callback) {
				return;
			}
			if (InvalidStrings.includes(room)) {
				return callback(false);
			}
			if (!io.sockets.adapter.rooms[room]) {
				socket.join(room);
				socket.room = room;
				socket.broadcast.to(room).emit("join", socket.id, socket.name);
				callback(true);
			} else {
				callback(false);
			}
		} catch (e) {
			console.error("CreateRoom Error", e);
		}
	});

	socket.on("joinroom", function(room, callback) {
		try {
			print("JoinRoom", socket.id, [room, callback]);
			if (!room || !callback) {
				return;
			}
			if (room == "") {
				return callback(false);
			}
			if (io.sockets.adapter.rooms[room] && !socket.rooms[room]) {
				socket.join(room);
				socket.room = room;
				socket.broadcast.to(room).emit("join", socket.id, socket.name);
				callback(true);
			} else {
				callback(false);
			}
		} catch (e) {
			console.error("JoinRoom Error", e);
		}
	});

	socket.on("message", function(message, callback) {
		try {
			print("Message", socket.id, [message, callback]);
			if (!message || !callback) {
				return;
			}
			if (socket.rooms[socket.room]) {
				io.to(socket.room).emit("message", message);
				callback(true);
			} else {
				callback(false);
			}
		} catch (e) {
			console.error("Message Error", e);
		}
	});

	socket.on("offer", function(id, offer, callback) {
		try {
			print("Offer", socket.id, [id, offer, callback]);
			if (!id || !offer) {
				return;
			}
			if (io.sockets.clients().connected[id]) {
				io.to(id).emit("offer", socket.id, socket.name, offer);
			}
		} catch (e) {
			console.error("Offer Error", e);
		}
	});

	socket.on("leaveroom", function() {
		print("LeaveRoom", socket.id);
	});

	socket.on("answer", function(id, answer, callback) {
		try {
			print("Answer", socket.id, [id, answer, callback]);
			if (!id || !answer) {
				return;
			}
			if (io.sockets.clients().connected[id]) {
				io.to(id).emit("answer", socket.id, socket.name, answer);
			}
		} catch (e) {
			console.error("Answer Error", e);
		}
	});

	socket.on("icecandidate", function(id, candidate) {
		try {
			print("IceCandidate", socket.id, [id, candidate]);
			if (!id || !candidate) {
				return;
			}
			if (io.sockets.clients().connected[id]) {
				io.to(id).emit("icecandidate", socket.id, candidate);
			}
		} catch (e) {
			console.error("IceCandidate Error", e);
		}
	});

	socket.on("disconnecting", function() {
		print("Disconnecting", socket.id);
		if (socket.rooms[socket.room]) {
			io.to(socket.room).emit("leave", socket.id);
		}
	});
});

http.listen(3000, function() {
	console.log("Pronto.");
});