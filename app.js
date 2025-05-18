const express = require('express');
const bodyParser = require('body-parser');
const registerRoute = require('./routes/register');
<<<<<<< HEAD
const adminRoute = require('./routes/admin');
=======
>>>>>>> f7eb7de75c5f3eaa27b2c841ee68306d6beae30d

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/register', registerRoute);
<<<<<<< HEAD
app.use('/admin', adminRoute);
=======
>>>>>>> f7eb7de75c5f3eaa27b2c841ee68306d6beae30d

app.use(express.static('public')); // 允许访问 register.html

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
