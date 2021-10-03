const db = require("../database/db");
const jwt = require("jsonwebtoken");
// const bcrypt = require('bcrypt');
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

exports.login = async (username, password) => {
  const [user] = await db("users").where({
    username,
    password,
  });

  if (user) {
    let payload = {
      id: user.id,
      username: user.username,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  throw new Error("Invalid username or password.");
};
