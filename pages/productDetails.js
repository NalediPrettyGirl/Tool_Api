const express = require('express');
const router = express.Router();

const { db } = require('../api');

// Get business details by ID (public view)
// GET /api/public/business/:id
router.get('/business/:id', async (req, res) => {
    try {
        const businessId = req.params.id;
        const doc = await db.collection('businesses').doc(businessId).get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Business not found' });
        }

        res.status(200).json({
            success: true,
            business: { id: doc.id, ...doc.data() }
        });
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).json({ success: false, message: 'Error fetching business' });
    }
});

// Get products for a business (public view)
// GET /api/public/products/:businessId
router.get('/products/:businessId', async (req, res) => {
    try {
        const businessId = req.params.businessId;
        const snapshot = await db.collection('products')
            .where('businessId', '==', businessId)
            .where('status', '==', 'active')
            .get();

        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
});

// Get reviews for a business
// GET /api/public/reviews/:businessId
router.get('/reviews/:businessId', async (req, res) => {
    try {
        const businessId = req.params.businessId;
        const snapshot = await db.collection('reviews')
            .where('businessId', '==', businessId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, message: 'Error fetching reviews' });
    }
});

// Add a review
// POST /api/public/reviews
router.post('/reviews', async (req, res) => {
    try {
        const { businessId, rating, reviewText, reviewerName } = req.body;

        if (!businessId || !rating || !reviewText || !reviewerName) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newReview = {
            businessId,
            rating: parseInt(rating),
            reviewText,
            reviewerName,
            createdAt: new Date().toISOString(),
            status: 'pending' // Reviews can be moderated
        };

        const docRef = await db.collection('reviews').add(newReview);
        console.log('Review added with ID:', docRef.id);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review: { id: docRef.id, ...newReview }
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ success: false, message: 'Error adding review' });
    }
});

module.exports = router;
