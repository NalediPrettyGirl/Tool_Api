const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Registration Endpoint
// POST /api/register
router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    // Simple validation
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if user already exists
        const userSnapshot = await db.collection('users').where('email', '==', email).get();
        if (!userSnapshot.empty) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Create new user
        const newUser = { firstName, lastName, email, password }; // In production, hash the password!
        const docRef = await db.collection('users').add(newUser);

        console.log('User registered with ID:', docRef.id);
        res.status(201).json({ message: 'Registration successful', userId: docRef.id });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Get All Users Endpoint
// GET /api/users
router.get('/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            delete data.password; // Don't send passwords back!
            return { id: doc.id, ...data };
        });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Login Endpoint
// POST /api/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const userSnapshot = await db.collection('users')
            .where('email', '==', email)
            .where('password', '==', password) // In production, compare hashed passwords
            .get();

        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const user = userDoc.data();
            
            // Set session
            req.session.user = { id: userDoc.id, firstName: user.firstName, email: user.email };
            
            console.log('User logged in:', user);
            res.status(200).json({ 
                message: 'Login successful', 
                isLoggedIn: true,
                user: req.session.user 
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Get current authenticated user
// GET /api/auth/me
router.get('/auth/me', async (req, res) => {
    try {
        if (req.session && req.session.user) {
            res.status(200).json({ isLoggedIn: true, user: req.session.user });
        } else {
            res.status(200).json({ isLoggedIn: false, message: 'Not authenticated' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// Logout endpoint
// POST /api/auth/logout
router.post('/auth/logout', async (req, res) => {
    try {
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Error destroying session:', err);
                    return res.status(500).json({ message: 'Error logging out' });
                }
                res.status(200).json({ message: 'Logged out successfully' });
            });
        } else {
            res.status(200).json({ message: 'No session to destroy' });
        }
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ message: 'Error logging out' });
    }
});

module.exports = router;
