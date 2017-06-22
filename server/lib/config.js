/**
 * Configurations
 */

module.exports = {

	master: {
		maxConnections: 1000,	// Max server connections
		port: 9099,				// Listening port
		ips: [],				// List of valid host server ip addresses
		cleanupTimeout: 3000	// Remove unverified connections, cleanup
	},

	host: {
		maxConnections: 1000,				// Max server connections
		port: 8099,							// Listening port
		ips: [],							// List of valid host server ip addresses
		cleanupTimeout: 3000,				// Remove unverified connections, cleanup
		handshake: 'com.beba.game.host'		// Host connection handshake to automatically authenticate
	},

	admin: {
		port: 8080,
		handshake: 'com.beba.game.admin'	// Admin connection handshake to automatically authenticate		
	}

};