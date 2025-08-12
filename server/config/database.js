const mongoose = require('mongoose');

const connectDatabase = () => {
    mongoose.set('strictQuery', true);
    
    // MongoDB Atlas connection options
    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // Increase timeout to 10 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 2, // Reduce minimum connections
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        retryWrites: true,
        retryReads: true,
        // SSL/TLS Configuration to fix SSL errors
        ssl: true,
        sslValidate: true,
        // Add TLS options to handle SSL alert errors
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        // Connection pool settings
        writeConcern: {
            w: 'majority',
            j: true,
            wtimeout: 1000
        }
    };
    
    mongoose.connect(process.env.MONGO_URI, options)
    .then(() => {
        console.log("✅ MongoDB Atlas Connected Successfully!");
        console.log("🔗 Database:", mongoose.connection.db.databaseName);
        console.log("🔐 SSL/TLS: Enabled and verified");
    }).catch((error) => {
        console.error("❌ MongoDB Connection Error:", error.message);
        
        // Check for specific SSL/TLS errors
        if (error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('OPENSSL')) {
            console.error("🔐 SSL/TLS Connection Issue Detected!");
            console.error("💡 SSL-specific solutions:");
            console.error("   1. Update your MongoDB connection string to use SSL");
            console.error("   2. Check if your network/firewall blocks SSL connections");
            console.error("   3. Try connecting from a different network");
            console.error("   4. Ensure your MongoDB Atlas cluster supports your MongoDB driver version");
            console.error("   5. Check Windows system date/time (SSL certificates are time-sensitive)");
        } else {
            console.error("💡 General connection solutions:");
            console.error("   1. Check if your IP address is whitelisted in MongoDB Atlas");
            console.error("   2. Verify your MongoDB connection string and credentials");
            console.error("   3. Check your network connection");
            console.error("   4. Ensure MongoDB Atlas cluster is running");
        }
        
        console.error("🔗 Your connection string format should be:");
        console.error("   mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority&ssl=true");
        
        // Don't exit immediately, let the retry logic handle it
        console.error("🔄 Retrying connection in 5 seconds...");
        setTimeout(() => {
            process.exit(1);
        }, 5000);
    });

    // Connection events
    mongoose.connection.on('error', (error) => {
        console.error("❌ MongoDB connection error:", error);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on('reconnected', () => {
        console.log("🔄 MongoDB reconnected");
    });
}

module.exports = connectDatabase;