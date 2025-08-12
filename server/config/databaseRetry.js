const mongoose = require('mongoose');

const connectDatabase = async () => {
    mongoose.set('strictQuery', false); // Suppress deprecation warning
    
    // MongoDB Atlas connection options
    const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000, // 15 seconds timeout
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        retryReads: true,
        writeConcern: {
            w: 'majority'
        }
    };

    let retries = 3;
    
    while (retries) {
        try {
            console.log(`🔄 Attempting to connect to MongoDB Atlas... (${4 - retries}/3)`);
            
            await mongoose.connect(process.env.MONGO_URI, options);
            
            console.log("✅ MongoDB Atlas Connected Successfully!");
            console.log("🔗 Database:", mongoose.connection.db.databaseName);
            console.log("🌐 Host:", mongoose.connection.host);
            break;
            
        } catch (error) {
            retries--;
            console.error(`❌ Connection attempt failed: ${error.message}`);
            
            if (retries === 0) {
                console.error("\n💀 All connection attempts failed!");
                console.error("\n📋 Quick Setup Checklist:");
                console.error("   ✓ MongoDB Atlas cluster is running");
                console.error("   ✓ IP address is whitelisted (0.0.0.0/0 for development)");
                console.error("   ✓ Connection string is correct");
                console.error("   ✓ Username and password are correct");
                console.error("   ✓ Network allows MongoDB connections (port 27017)");
                
                console.error("\n🔧 To fix MongoDB Atlas IP whitelist:");
                console.error("   1. Visit: https://cloud.mongodb.com/");
                console.error("   2. Select your project");
                console.error("   3. Go to 'Network Access' in sidebar");
                console.error("   4. Click 'Add IP Address'");
                console.error("   5. Add '0.0.0.0/0' (allows all IPs - development only!)");
                console.error("   6. Wait 2-3 minutes for changes to take effect");
                
                throw new Error("MongoDB connection failed after all retry attempts");
            } else {
                console.log(`⏳ Retrying in 3 seconds... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }

    // Connection event listeners
    mongoose.connection.on('error', (error) => {
        console.error("❌ MongoDB error:", error.message);
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

module.exports = connectDatabase;
