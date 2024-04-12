const jwt = require('jsonwebtoken')
const config = require('../Middleware/config')
const User = require('../Models/User')

const userAuth = async (req, res, next) => {
  const authorization = req.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    req.token = authorization.replace('Bearer ', '')
  }

  if (!req.token) {
    return res.status(401).json({ error: 'Unauthorized. Token missing.' })
  }

  try {
    const decodedToken = jwt.verify(req.token, config.SECRET_KEY)
    const userId = decodedToken.userId
    const user = await User.findById(userId)

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    if (user.userType === 'staff' || user.userType === 'admin') {
      req.user = user
      next()
    } else {
      return res.status(403).json({ error: 'Access denied' })
    }
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' })
  }
}

module.exports = userAuth
