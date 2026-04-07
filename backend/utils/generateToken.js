const jwt = require('jsonwebtoken');

/**
 * @desc    Generates a JWT for authenticated users
 * @param   {string} id - The MongoDB user ID
 * @returns {string} - A signed JWT valid for 30 days
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = generateToken;