const express = require('express')
const adminAuth = require('../Middleware/adminAuth')
const contactFormRoute = express.Router()
const ContactUs = require('../Models/ContactUs')

contactFormRoute.post('/contact', async (req, res) => {
  try {
    const { name, email, phoneNumber, message } = req.body

    const contactForm = new ContactUs({
      name,
      email,
      phoneNumber,
      message,
    })

    await contactForm.save()

    res.status(201).json({ message: 'Form submitted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

contactFormRoute.get('/all-forms', adminAuth, async (req, res) => {
  try {
    const allForms = await ContactUs.find()
    res.status(200).json(allForms)
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = contactFormRoute
