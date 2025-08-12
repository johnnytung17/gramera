const mongoose = require('mongoose');

const connectDatabaseWithFallback = async () => {
    mongoose.set('strictQuery', false); // Avoid deprecation warning
    
    // Primary connection options with full SSL
    const primaryOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        retryReads: true,
        ssl: true,
        sslValidate: true,
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        writeConcern: {
            w: 'majority',
            j: true,
            wtimeout: 1000
        }
    };

    // Fallback options with relaxed SSL (for problematic networks)
    const fallbackOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 60000,
        maxPoolSize: 5,
        minPoolSize: 1,
        maxIdleTimeMS: 60000,
        retryWrites: true,
        retryReads: true,
        // More permissive SSL settings
        ssl: true,
        sslValidate: false,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        writeConcern: {
            w: 'majority'
        }
    };

    // Minimal options (last resort)
    const minimalOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 20000,
    };

    const connectionMethods = [
        { name: 'Primary (Secure SSL)', options: primaryOptions },
        { name: 'Fallback (Relaxed SSL)', options: fallbackOptions },
        { name: 'Minimal (Basic)', options: minimalOptions }
    ];

    for (let i = 0; i < connectionMethods.length; i++) {
        const method = connectionMethods[i];
        console.log(`🔄 Attempting connection method ${i + 1}/3: ${method.name}`);
        
        try {
            await mongoose.connect(process.env.MONGO_URI, method.options);
            
            console.log(`✅ MongoDB Atlas Connected Successfully using ${method.name}!`);
            console.log("🔗 Database:", mongoose.connection.db.databaseName);
            console.log("🌐 Host:", mongoose.connection.host);
            
            if (i > 0) {
                console.warn("⚠️  Using fallback connection method - consider fixing SSL issues for production");
            }
            
            setupConnectionEventListeners();
            return; // Success, exit function
            
        } catch (error) {
            console.error(`❌ Method ${i + 1} failed:`, error.message);
            
            if (i === connectionMethods.length - 1) {
                // Last attempt failed
                console.error("\n💀 All connection methods failed!");
                await handleConnectionFailure(error);
                throw error;
            } else {
                console.log(`⏳ Trying next method in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
};

const setupConnectionEventListeners = () => {
    mongoose.connection.on('error', (error) => {
        console.error("❌ MongoDB connection error:", error.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on('reconnected', () => {
        console.log("🔄 MongoDB reconnected successfully!");
    });

    mongoose.connection.on('connected', () => {
        console.log("🎉 MongoDB connection established!");
    });
};

const handleConnectionFailure = async (error) => {
    console.error("\n📋 Connection Failure Diagnostics:");
    console.error("─".repeat(50));
    
    if (error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('OPENSSL')) {
        console.error("🔐 SSL/TLS Issues Detected:");
        console.error("   • Network may be blocking SSL connections");
        console.error("   • Corporate firewall might interfere with TLS");
        console.error("   • System clock might be out of sync");
        console.error("   • MongoDB driver version compatibility issue");
        console.error("\n🔧 SSL Troubleshooting:");
        console.error("   1. Try connecting from a different network (mobile hotspot)");
        console.error("   2. Check Windows system time and date");
        console.error("   3. Update Node.js and MongoDB driver: npm update mongoose");
        console.error("   4. Try VPN connection");
        console.error("   5. Contact network administrator about MongoDB Atlas access");
    }
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.error("🌐 Network Issues Detected:");
        console.error("   • DNS resolution problems");
        console.error("   • Network connectivity issues");
        console.error("   • Firewall blocking MongoDB ports");
    }

    if (error.message.includes('authentication') || error.message.includes('credential')) {
        console.error("🔑 Authentication Issues Detected:");
        console.error("   • Incorrect username/password");
        console.error("   • Database user permissions");
        console.error("   • Connection string format");
    }

    console.error("\n🆘 Emergency Solutions:");
    console.error("   1. Use MongoDB Compass to test connection");
    console.error("   2. Try connection from different machine/network");
    console.error("   3. Create new MongoDB Atlas cluster");
    console.error("   4. Use local MongoDB for development");
    
    console.error("\n🔗 Test your connection string format:");
    console.error("   mongodb+srv://username:password@cluster.mongodb.net/database");
    
    console.error("\n📞 Get Help:");
    console.error("   • MongoDB Community: https://community.mongodb.com/");
    console.error("   • Atlas Support: https://support.mongodb.com/");
};

module.exports = connectDatabaseWithFallback;
