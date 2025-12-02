/* src/app.js - Project file */
const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, '../public')));


const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const replacementRoutes = require('./routes/replacementRoutes');
const jobRoutes = require('./routes/jobRoutes');
const classRoutes = require('./routes/classRoutes');
const classroomRoutes = require('./routes/classroomRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/replacements', replacementRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth/google/classroom', require('./routes/classroomAuthRoutes'));


app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Facilita SENAI API is running' });
});


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access: http://localhost:${PORT}`);
});
