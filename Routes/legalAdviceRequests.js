// route to handle all legal advice requests

const express = require('express');
const legalAdviceRequestRouter = express.Router();
const LegalAdviceRequest = require('../Models/LegalAdviceRequest');
const multer = require('multer');
const userAuth = require('../Middleware/userAuth');
const adminAuthMiddleware = require('../Middleware/adminAuth');

const storage = multer.memoryStorage()
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true)
    } else {
        cb(new Error('Only PDF files are allowed'), false)
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 5 MB limit
    fileFilter,
})

// get all legal advice requests
legalAdviceRequestRouter.get('/', adminAuthMiddleware, async (req, res) => {
    try {
        const requests = await LegalAdviceRequest.find({}).populate('user');
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// get a single legal advice request
legalAdviceRequestRouter.get('/:id', async (req, res) => {
    try {
        const request = await LegalAdviceRequest.findById(req.params.id).populate();
        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// get attachments for a legal advice request
legalAdviceRequestRouter.get('/:id/attachments', adminAuthMiddleware, async (req, res) => {
    try {
        const request = await LegalAdviceRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        if (!request.attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
        }
        res.send(request.attachment.data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// create a legal advice request
legalAdviceRequestRouter.post('/', userAuth, upload.single('attachment'), async (req, res) => {

    const { caseDetails } = req.body;
    const attachment = {
        data: req.file ? req.file.buffer : null,
        contentType: req.file ? req.file.mimetype : null,
    }

    try {

        if (!caseDetails) {
            return res.status(400).json({ message: 'Case details are required' });
        }

        const request = new LegalAdviceRequest({
            caseDetails: req.body.caseDetails,
            attachment: attachment,
            user: req.user._id
        });
        const newRequest = await request.save();
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = legalAdviceRequestRouter;