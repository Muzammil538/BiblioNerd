const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // In Mongoose 9.x, you only need the URI. 
        // The deprecated options are now handled automatically.
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;