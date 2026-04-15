const express = require('express');
const router = express.Router();
const { db } = require('../database');

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        // Get total businesses
        const totalBusinessesSnapshot = await db.collection('businesses').get();
        const totalBusinesses = totalBusinessesSnapshot.size;

        // Get pending approvals
        const pendingSnapshot = await db.collection('businesses')
            .where('status', '==', 'pending')
            .get();
        const pendingApprovals = pendingSnapshot.size;

        // Get total users
        const totalUsersSnapshot = await db.collection('users').get();
        const totalUsers = totalUsersSnapshot.size;

        res.json({
            success: true,
            stats: {
                totalBusinesses,
                pendingApprovals,
                totalUsers
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
});

// GET /api/admin/pending - Pending business approvals
router.get('/pending', async (req, res) => {
    try {
        const snapshot = await db.collection('businesses')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .get();

        const businesses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({
            success: true,
            businesses
        });
    } catch (error) {
        console.error('Error fetching pending businesses:', error);
        res.status(500).json({ success: false, message: 'Error fetching pending businesses' });
    }
});

// POST /api/admin/approve/:id - Approve a business
router.post('/approve/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const businessRef = db.collection('businesses').doc(id);
        const businessDoc = await businessRef.get();

        if (!businessDoc.exists) {
            return res.status(404).json({ success: false, message: 'Business not found' });
        }

        await businessRef.update({
            status: 'approved',
            approvedAt: new Date().toISOString()
        });

        res.json({ success: true, message: 'Business approved successfully' });
    } catch (error) {
        console.error('Error approving business:', error);
        res.status(500).json({ success: false, message: 'Error approving business' });
    }
});

// POST /api/admin/reject/:id - Reject a business
router.post('/reject/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const businessRef = db.collection('businesses').doc(id);
        const businessDoc = await businessRef.get();

        if (!businessDoc.exists) {
            return res.status(404).json({ success: false, message: 'Business not found' });
        }

        await businessRef.update({
            status: 'rejected',
            rejectedAt: new Date().toISOString()
        });

        res.json({ success: true, message: 'Business rejected successfully' });
    } catch (error) {
        console.error('Error rejecting business:', error);
        res.status(500).json({ success: false, message: 'Error rejecting business' });
    }
});

module.exports = router;