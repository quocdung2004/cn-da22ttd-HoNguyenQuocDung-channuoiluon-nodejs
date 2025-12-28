const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Tên không được để trống"], 
    trim: true, 
    minlength: [2, "Tên phải ít nhất 2 ký tự"], 
    maxlength: [50, "Tên không quá 50 ký tự"]
  },
  email: { 
    type: String, 
    required: [true, "Email không được để trống"], 
    unique: true, 
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"]
  },
  password: { 
    type: String, 
    required: [true, "Mật khẩu không được để trống"], 
    minlength: [6, "Mật khẩu phải ít nhất 6 ký tự"]
  }
}, { timestamps: true });

// Hash password trước khi lưu
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method so sánh mật khẩu
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
