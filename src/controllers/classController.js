/* src/controllers/classController.js - Server controller */
const db = require('../config/db');

exports.getAllClasses = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM classes ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createClass = async (req, res) => {
    try {
        const { name, course, period } = req.body;

        if (!name || !course || !period) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await db.execute(
            'INSERT INTO classes (name, course, period) VALUES (?, ?, ?)',
            [name, course, period]
        );

        res.status(201).json({ message: 'Class created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
