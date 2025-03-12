const jwt = require('jsonwebtoken');

// Middleware to verify admin authentication
exports.verifyAdmin = async (req, res, next) => {
    try {
        // Get access token from cookies
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            console.log('no token provided')
            return res.status(401).json({ message: "No token provided" });
        }

        try {
            // Verify the access token
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

            // Check if the user is an admin
            if (decoded.role !== 'admin') {
                console.log("Access denied. Admin privileges required.")
                return res.status(403).json({ message: "Access denied. Admin privileges required." });
            }

            // Add user info to request object
            req.user = decoded;
            next();
        } catch (error) {
            // If access token is expired, try to use refresh token
            if (error.name === 'TokenExpiredError') {
                const refreshToken = req.cookies.refreshToken;

                if (!refreshToken) {
                    console.log("Session expired. Please login again.")
                    return res.status(401).json({ message: "Session expired. Please login again." });
                }

                try {
                    // Verify refresh token
                    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                   console.log(decoded)
                    // Check if the user is an admin
                    if (decoded.role !== 'admin') {
                        console.log("Access denied. Admin privileges required.")

                        return res.status(403).json({ message: "Access denied. Admin privileges required." });
                    }

                    // Generate new access token
                    const newAccessToken = jwt.sign(
                        {
                            id: decoded.id,
                            username: decoded.username,
                            role: 'admin'
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: '1d' }
                    );

                    // Set new access token cookie
                    res.cookie('accessToken', newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'strict',
                        maxAge: 1 * 24 * 60 * 60 * 1000 // 1 day
                    });

                    // Add user info to request object
                    req.user = decoded;
                    next();
                } catch (refreshError) {
                    console.log("Invalid refresh token")
                    return res.status(401).json({ message: "Invalid refresh token. Please login again." });
                }
            } else {
                console.log("Invalid refresh token")
                return res.status(401).json({ message: "Invalid token" });
            }
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
