const express = require('express')
const Citation = require('../Models/Citation')
const Courts = require('../Models/Courts')
const staffAuth = require('../Middleware/staffAuth')
const adminAuth = require('../Middleware/adminAuth')

const filterRoute = express.Router()

filterRoute.get('/get-highCourt', adminAuth, async (req, res) => {
  try {
    const courts = await Courts.find(
      { name: { $regex: /high court/i } },
      'name'
    )
    res.status(200).json({ courts })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

filterRoute.get('/get-tribunal', adminAuth, async (req, res) => {
  try {
    const courts = await Courts.find({ name: { $regex: /tribunal/i } }, 'name')
    res.status(200).json({ courts })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

filterRoute.get('/get-year/:court', adminAuth, async (req, res) => {
  try {
    const court = req.params.court

    const years = await Citation.aggregate([
      {
        $match: {
          institutionName: court,
          dateOfOrder: { $exists: true, $ne: null },
        },
      },
      { $group: { _id: { $year: '$dateOfOrder' } } },
      { $project: { _id: 0, year: '$_id' } },
      { $sort: { year: 1 } },
    ])

    console.log('Years:', years)

    res.status(200).json({ years })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

filterRoute.get('/get-months/:court/:year', staffAuth, async (req, res) => {
  try {
    const court = req.params.court
    const year = parseInt(req.params.year)

    const months = await Citation.aggregate([
      {
        $match: {
          institutionName: court,
          $expr: { $eq: [{ $year: '$dateOfOrder' }, year] },
        },
      },
      { $group: { _id: { $month: '$dateOfOrder' } } },
      { $project: { _id: 0, month: '$_id' } },
      { $sort: { month: 1 } },
    ])

    res.status(200).json({ months })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

filterRoute.get(
  '/get-days/:court/:year/:month',
  staffAuth,
  async (req, res) => {
    try {
      const court = req.params.court
      const year = parseInt(req.params.year)
      const month = parseInt(req.params.month)

      const days = await Citation.aggregate([
        {
          $match: {
            institutionName: court,
            $expr: {
              $eq: [{ $year: '$dateOfOrder' }, year],
              $eq: [{ $month: '$dateOfOrder' }, month],
            },
          },
        },
        { $group: { _id: { $dayOfMonth: '$dateOfOrder' } } },
        { $project: { _id: 0, day: '$_id' } },
        { $sort: { day: 1 } },
      ])

      res.status(200).json({ days })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

filterRoute.get(
  '/get-citations/:court/:year/:month/:day',
  staffAuth,
  async (req, res) => {
    try {
      const court = req.params.court
      const year = parseInt(req.params.year)
      const month = parseInt(req.params.month)
      const day = parseInt(req.params.day)

      const citations = await Citation.find(
        {
          institutionName: court,
          dateOfOrder: {
            $gte: new Date(year, month - 1, day),
            $lt: new Date(year, month - 1, day + 1),
          },
        },
        '_id status type citationNo title dateOfOrder institutionName lastModifiedDate'
      )

      res.status(200).json({ citations })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

module.exports = filterRoute
