const express = require('express');
const router = express.Router();

const { db } = require('../api');


// Add Business Endpoint
// POST /api/businesses
router.post('/businesses', async (req, res) => {
    const {
        name, category, description, city, province,
        phone, email, website, logo, policeClearance, ownerEmail
    } = req.body;

    if (!name || !category || !description || !city || !province || !phone) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const newBusiness = {
        name,
        category,
        description,
        city,
        province,
        phone,
        email,
        website,
        ownerEmail: ownerEmail || email, // Link business to user's email
        logo: logo ? logo : null,
        policeClearance: policeClearance ? 'Doc Uploaded' : 'No Doc',
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    try {
        const docRef = await db.collection('businesses').add(newBusiness);
        console.log('New business added with ID:', docRef.id);
        res.status(201).json({ message: 'Business added successfully', business: { id: docRef.id, ...newBusiness } });
    } catch (error) {
        console.error('Error adding business:', error);
        res.status(500).json({ message: 'Error adding business to database' });
    }
});

// Get All Businesses Endpoint
// GET /api/businesses
router.get('/businesses', async (req, res) => {
    try {
        const snapshot = await db.collection('businesses').get();
        const businesses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(businesses);
    } catch (error) {
        console.error('Error fetching businesses:', error);
        res.status(500).json({ message: 'Error fetching businesses' });
    }
});

// Check if user has a business
// GET /api/businesses/check/:email
router.get('/businesses/check/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const snapshot = await db.collection('businesses')
            .where('ownerEmail', '==', email)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const businessDoc = snapshot.docs[0];
            res.status(200).json({
                hasBusiness: true,
                business: { id: businessDoc.id, ...businessDoc.data() }
            });
        } else {
            res.status(200).json({ hasBusiness: false });
        }
    } catch (error) {
        console.error('Error checking business:', error);
        res.status(500).json({ message: 'Error checking business' });
    }
});

module.exports = router;