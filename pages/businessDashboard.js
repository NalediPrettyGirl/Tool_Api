const express = require('express');
const router = express.Router();

const { db } = require('../api');

// Get business by owner email
// GET /api/dashboard/business/:email
router.get('/business/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const snapshot = await db.collection('businesses')
            .where('ownerEmail', '==', email)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const businessDoc = snapshot.docs[0];
            res.status(200).json({
                success: true,
                business: { id: businessDoc.id, ...businessDoc.data() }
            });
        } else {
            res.status(404).json({ success: false, message: 'Business not found' });
        }
    } catch (error) {
        console.error('Error fetching business:', error);
        res.status(500).json({ success: false, message: 'Error fetching business' });
    }
});

// Update business details
// PUT /api/dashboard/business/:id
router.put('/business/:id', async (req, res) => {
    try {
        const businessId = req.params.id;
        const updateData = req.body;

        // Remove fields that shouldn't be updated
        delete updateData.id;
        delete updateData.ownerEmail;
        delete updateData.createdAt;

        updateData.updatedAt = new Date().toISOString();

        await db.collection('businesses').doc(businessId).update(updateData);

        console.log('Business updated:', businessId);
        res.status(200).json({ success: true, message: 'Business updated successfully' });
    } catch (error) {
        console.error('Error updating business:', error);
        res.status(500).json({ success: false, message: 'Error updating business' });
    }
});

// Get all products for a business
// GET /api/dashboard/products/:businessId
router.get('/products/:businessId', async (req, res) => {
    try {
        const businessId = req.params.businessId;
        const snapshot = await db.collection('products')
            .where('businessId', '==', businessId)
            .orderBy('createdAt', 'desc')
            .get();

        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
});

// Add a new product
// POST /api/dashboard/products
router.post('/products', async (req, res) => {
    try {
        const { businessId, name, price, category, description, image } = req.body;

        if (!businessId || !name || !price) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const newProduct = {
            businessId,
            name,
            price: parseFloat(price),
            category: category || 'General',
            description: description || '',
            image: image || null,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        const docRef = await db.collection('products').add(newProduct);
        console.log('Product added with ID:', docRef.id);

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product: { id: docRef.id, ...newProduct }
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ success: false, message: 'Error adding product' });
    }
});

// Update a product
// PUT /api/dashboard/products/:id
router.put('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const updateData = req.body;

        delete updateData.id;
        delete updateData.businessId;
        delete updateData.createdAt;

        if (updateData.price) {
            updateData.price = parseFloat(updateData.price);
        }

        updateData.updatedAt = new Date().toISOString();

        await db.collection('products').doc(productId).update(updateData);

        console.log('Product updated:', productId);
        res.status(200).json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Error updating product' });
    }
});

// Delete a product
// DELETE /api/dashboard/products/:id
router.delete('/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        await db.collection('products').doc(productId).delete();

        console.log('Product deleted:', productId);
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
});

// Get business statistics
// GET /api/dashboard/stats/:businessId
router.get('/stats/:businessId', async (req, res) => {
    try {
        const businessId = req.params.businessId;

        // Get product count
        const productsSnapshot = await db.collection('products')
            .where('businessId', '==', businessId)
            .get();

        const stats = {
            totalProducts: productsSnapshot.size,
            profileViews: Math.floor(Math.random() * 2000) + 500, // Mock data for now
            customerLeads: Math.floor(Math.random() * 50) + 10, // Mock data for now
            activeProducts: productsSnapshot.docs.filter(doc => doc.data().status === 'active').length
        };

        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

module.exports = router;
