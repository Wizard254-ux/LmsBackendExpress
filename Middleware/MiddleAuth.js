const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Import cookie-parser
const Lecturer = require('../Models/Lecturers');

app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware

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

const refreshToken = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
  
      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token" });
      }
  
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  
      const lecturer = await Lecturer.findById(decoded.id);
      if (!lecturer) {
        return res.status(404).json({ message: "Lecturer not found" });
      }
  
      const newAccessToken = jwt.sign(
        { id: lecturer._id, username: decoded.username, role: 'lecturer' },
        process.env.JWT_SECRET, 
        { expiresIn: '15m' } // Set expiry to 15 minutes
      );
  
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // Corrected maxAge to 15 minutes
      });
  
      res.status(200).json({ message: "Token refreshed successfully" });
    } catch (error) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
};

module.exports = {
    authenticateToken,
    refreshToken // Export refreshToken properly
};
