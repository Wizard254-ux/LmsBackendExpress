const express=require('express')
const app=express()
const jwt=require('jsonwebtoken')
app.use(express.json())
const bcrypt = require('bcryptjs');
const Lecturer = require('../Models/Lecturers');
const LecAccount = require('../Models/LecAccount');



const authenticateToken = (req, res, next) => {
    const accessToken = req.cookies.accessToken;
  
    if (!accessToken) {
      return res.status(401).json({ message: "No access token" });
    }
  
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid access token" });
    }
  };
  exports.refreshToken = async (req, res) => {
    try {
      // Get refresh token from cookies
      const refreshToken = req.cookies.refreshToken;
  
      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
      }
  
      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  
      // Find the lecturer
      const lecturer = await Lecturer.findById(decoded.id);
      if (!lecturer) {
        return res.status(404).json({ message: "Lecturer not found" });
      }
  
      // Generate new access token
      const newAccessToken = jwt.sign(
        { 
          id: lecturer._id, 
          username: decoded.username,
          role: 'lecturer'
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1d' }
      );
  
      // Set new access token in cookie
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure in production
        sameSite: 'strict',
        maxAge: 1 * 24  * 60 * 1000 // 15 minutes
      });
  
      res.status(200).json({ message: "Token refreshed successfully" });
    } catch (error) {
      // Handle token verification errors
      return res.status(401).json({ message: "Invalid refresh token" });
    }
  };

  module.exports={
    authenticateToken
  }