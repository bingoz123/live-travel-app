const express = require('express');
const bodyParser = require('body-parser');
const registerRoute = require('./routes/register');
const adminRoute = require('./routes/admin');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api/register', registerRoute);
app.use('/admin', adminRoute);

app.use(express.static('public')); // 允许访问 register.html

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
