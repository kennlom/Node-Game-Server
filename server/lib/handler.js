// Include the crypto library to use sha1
var crypto = require('crypto');



module.exports = function()
{
	return new controller();
};


/**
 * Controller module
 */
var controller = function()
{
	var self = this;

	// List of event listeners
	// The controller will call the event listener when the event triggered.
	// If no listeners are available, the event will be lost.
	this.listeners			= {};
	this.connection			= null;
	this.reconnectTimeout	= 3000;	// Reconnection timeout for lost connection


	/**
	 * Set event listeners
	 */
	this.setEventListeners = function(listeners)
	{
		this.listeners = listeners;
	};

	/**
	 * On incoming data handler
	 */
	this.onData = function(socket, data)
	{
		// Convert data bytes to string and append to buffer
		// TODO: reset buffer when over size limits
		socket.buffer += data.toString();

		// Keep buffering the data until we get an end of data identifier "\n"
		if(socket.buffer.substr(-1) == '\n')
		{
			socket
				.buffer
				.split('\n')
				.forEach(function(data){

					// If a handshake is not yet completed, try it now.
					// Only process incoming data if client have already completed handshake
					if(socket.handshakeCompleted == false)
					{
						self.checkHandshake(socket, data);
					}
					else
					{
						self.dispatchEvent(socket, self.getEvent(data), data);
					}

				});

			// Reset buffer
			socket.buffer = '';
		}
	};

	/**
	 * Check handshake
	 */
	this.checkHandshake = function(socket, data)
	{
		if(data == 'com.beba.game.v1.0')
		{
			socket.handshakeCompleted = true;
		}
		else if(data == 'com.beba.game.host')
		{
			socket.handshakeCompleted = true;
			self.dispatchEvent(socket, 'host_authorization');
		}
		else if(data == 'com.beba.game.admin')
		{
			socket.handshakeCompleted = true;
			self.dispatchEvent(socket, 'admin_authorization');
		}
		else
		{
			// If we have a websocket connection
			// https://developer.mozilla.org/en-US/docs/WebSockets/Writing_WebSocket_servers
			// Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
			if(data.indexOf('Sec-WebSocket-Key') >= 0)
			{
				var key = data.substr(data.indexOf(':') + 1).trim().toString();
				key = key.concat('258EAFA5-E914-47DA-95CA-C5AB0DC85B11'); // websocket magic string (see mozilla)

				// Get the base64 value of the sha1 hash of the concatenated string
				var base64 = crypto.createHash('sha1').update(key).digest('base64');

				// Send the handshake back to the client
				var header = '';
				header = header.concat('HTTP/1.1 101 Switching Protocols\r\n');
				header = header.concat('Upgrade: websocket\r\n');
				header = header.concat('Connection: Upgrade\r\n');
				header = header.concat('Sec-WebSocket-Accept: ' + base64 + '\r\n\r\n');
				
				socket.handshakeCompleted = true;

				//console.log(header);
				//console.log(data);
				//console.log(key);
				socket.write(header);
			}
		}
	};

	/**
	 * Dispatch events
	 */
	this.dispatchEvent = function(socket, event, data)
	{
		if(event == '') return;

		// If an event listener is registered for this event
		// then call the event listener
		if(typeof self.listeners[event] === 'function')
			self.listeners[event](socket, data);
	};

	/**
	 * Get name of event
	 */
	this.getEvent = function(data)
	{
		if(data == '') return '';

		try {
			var obj = JSON.parse(data);
			return obj.event;
		} catch (err) {
			// console.log('Unknown Error Occurred', err);
		}

		return '';
	};

	/**
	 * Get data object
	 */
	 this.getDataObject = function(data)
	 {
		try {
			return JSON.parse(data);
		} catch (err) {
			return {};
		}
	 };
};


















/**
 * Handler for master server
 */
var functions = {
	GetHosts: function(socket) {
		// Get list of available hosts
		// Return some hosts so client can pick one to connect to
	},
	StartNewGame: function(socket) {
		// Start a new game
		// Distribute new game info to all connected host servers
	},
	KillGame: function(socket) {
		// Kill a game
		// Send killed game info to all connected host servers
	},

};


