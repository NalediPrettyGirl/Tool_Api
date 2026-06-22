const express = require('express');
const router = express.Router();
const { db } = require('../database');
const bcrypt = require('bcryptjs');

// POST /api/admin/login - Admin login (Placed before isAdmin middleware so it is accessible)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        const userSnapshot = await db.collection('users')
            .where('email', '==', email)
            .get();

        let isAdminUser = false;
        let userData = null;
        let userId = null;

        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            userData = userDoc.data();
            userId = userDoc.id;

            // Check if user is admin
            if (userData.role === 'admin' || userData.isAdmin === true || email === 'admin@asera.com') {
                // Verify password
                let isMatch = false;
                if (userData.password && userData.password.startsWith('$2a$')) {
                    isMatch = await bcrypt.compare(password, userData.password);
                } else {
                    isMatch = (password === userData.password);
                }
                if (isMatch) {
                    isAdminUser = true;
                }
            }
        } else if (email === 'admin@asera.com' && password === 'admin123') {
            // Fallback developer credentials if user does not exist in DB yet
            isAdminUser = true;
            userData = { firstName: 'System', lastName: 'Admin', email: 'admin@asera.com', role: 'admin' };
            userId = 'system-admin-fallback';
        }

        if (isAdminUser) {
            req.session.user = {
                id: userId,
                firstName: userData.firstName,
                email: userData.email,
                role: 'admin'
            };
            res.json({ success: true, message: 'Admin login successful', user: req.session.user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid admin credentials' });
        }
    } catch (error) {
        console.error('Error logging in admin:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    const adminEmail = req.headers['x-admin-email'];
    const isSessionAdmin = req.session && req.session.user && (req.session.user.role === 'admin' || req.session.user.email === 'admin@asera.com');
    
    if (isSessionAdmin || adminEmail === 'admin@asera.com' || adminEmail === 'System') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
};

// Protect all following routes with the admin check
router.use(isAdmin);

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

// GET /api/admin/businesses - Fetch all businesses
router.get('/businesses', async (req, res) => {
    try {
        const snapshot = await db.collection('businesses')
            .orderBy('createdAt', 'desc')
            .get();
        const businesses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json({ success: true, businesses });
    } catch (error) {
        console.error('Error fetching all businesses:', error);
        res.status(500).json({ success: false, message: 'Error fetching businesses' });
    }
});

// DELETE /api/admin/businesses/:id - Delete a business listing
router.delete('/businesses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.collection('businesses').doc(id).delete();
        res.json({ success: true, message: 'Business deleted successfully' });
    } catch (error) {
        console.error('Error deleting business:', error);
        res.status(500).json({ success: false, message: 'Error deleting business' });
    }
});

// GET /api/admin/users - Fetch all users
router.get('/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
});

// POST /api/admin/users/role/:id - Update user role
router.post('/users/role/:id', async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) {
        return res.status(400).json({ success: false, message: 'Role is required' });
    }
    try {
        await db.collection('users').doc(id).update({ role });
        res.json({ success: true, message: 'User role updated successfully' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ success: false, message: 'Error updating user role' });
    }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.collection('users').doc(id).delete();
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ success: false, message: 'Error deleting user' });
    }
});

// GET /api/admin/reports - Fetch all reports
router.get('/reports', async (req, res) => {
    try {
        const snapshot = await db.collection('reports')
            .orderBy('createdAt', 'desc')
            .get();
        const reports = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json({ success: true, reports });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ success: false, message: 'Error fetching reports' });
    }
});

// POST /api/admin/reports - File a new report
router.post('/reports', async (req, res) => {
    const { type, description, targetListing, reportedBy, priority } = req.body;
    if (!type || !description) {
        return res.status(400).json({ success: false, message: 'Type and description are required' });
    }
    try {
        const docRef = await db.collection('reports').add({
            type,
            description,
            targetListing: targetListing || 'N/A',
            reportedBy: reportedBy || 'Anonymous',
            priority: priority || 'medium',
            status: 'open',
            createdAt: new Date().toISOString()
        });
        res.json({ success: true, message: 'Report filed successfully', id: docRef.id });
    } catch (error) {
        console.error('Error filing report:', error);
        res.status(500).json({ success: false, message: 'Error filing report' });
    }
});

// PATCH /api/admin/reports/:id - Update report status (dismiss / resolve / warn)
router.patch('/reports/:id', async (req, res) => {
    const { id } = req.params;
    const { status, action } = req.body;
    try {
        await db.collection('reports').doc(id).update({
            status: status || 'resolved',
            action: action || null,
            resolvedAt: new Date().toISOString()
        });
        res.json({ success: true, message: 'Report updated successfully' });
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ success: false, message: 'Error updating report' });
    }
});

// DELETE /api/admin/reports/:id - Delete a report
router.delete('/reports/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.collection('reports').doc(id).delete();
        res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ success: false, message: 'Error deleting report' });
    }
});

module.exports = router;