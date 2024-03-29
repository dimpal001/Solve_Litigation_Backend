require('dotenv').config()

const PORT = process.env.PORT
const SECRET_KEY = process.env.SECRET_KEY
const MONGODB_URI = process.env.MONGODB_URI

module.exports = { PORT, SECRET_KEY, MONGODB_URI }
