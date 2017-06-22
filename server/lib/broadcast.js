/**
 * Handle event notifications / broadcasting
 */

module.exports = function()
{
	var self = this;

	this.channels = {
		"hosts": 	{"count": 0, "sockets":{}},
		"players": 	{"count": 0, "sockets":{}},
		"games": 	{"count": 0, "sockets":{}},
	};

	/**
	 * Join a channel
	 */
	this.join = function(name, socket)
	{
		if(typeof this.channels[name] !== 'undefined')
		{
			this.channels[name].count++;
			this.channels[name].sockets[socket.id] = socket;
		}
	};

	/**
	 * Leave all
	 */
	this.leaveAll = function(socketId)
	{
		// Remove the socket from all channels
		Object.keys(self.channels).forEach(function(channel){
			self.channels[channel].sockets[ socketId ] = null;
	        delete self.channels[channel].sockets[ socketId ];
		});
	};

	/**
	 * Leave a channel
	 */
	this.leave = function()
	{

	};

	/**
	 * Broadcast
	 */
	this.broadcast = function(name, dataFunction)
	{
		console.log('Broadcasting:', name);
		// console.log(this.channels)


		if(typeof this.channels[name] !== 'undefined' && this.channels[name].count > 0)
		{
			var data = dataFunction();

			Object.keys(self.channels[name].sockets).forEach(function(id){
				self.channels[name].sockets[id].write(data + '\n');
			});
		}

	};
};