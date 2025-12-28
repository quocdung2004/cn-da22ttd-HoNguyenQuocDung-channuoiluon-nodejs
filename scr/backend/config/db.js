const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connString = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aquaeel_db';

    console.log(`Đang kết nối tới: ${connString}`); // In ra để debug xem nó đang dùng cái nào

    const conn = await mongoose.connect(connString);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;


