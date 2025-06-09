require('dotenv').config();
const express      = require('express');
const bodyParser   = require('body-parser');
const axios        = require('axios');

const registerRoute = require('./routes/register');
const adminRoute    = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 内部路由：注册 & 管理
app.use('/api/register', registerRoute);
app.use('/api/admin',    adminRoute);



// 外部 API 代理路由

// 1. 演出列表 (Ticketmaster)
app.get('/api/events', async (req, res) => {
  const city = req.query.city || 'Melbourne';
  const date = req.query.date || '2025-06-20';

  try {
    const response = await axios.get(`https://app.ticketmaster.com/discovery/v2/events.json`, {
      params: {
        apikey: process.env.TM_API_KEY,
        city,
        startDateTime: `${date}T00:00:00Z`,
        endDateTime: `${date}T23:59:59Z`
      }
    });

    const events = response.data._embedded?.events || [];
    const formatted = events.map(e => ({
      id: e.id,
      name: e.name,
      date: e.dates.start.localDate,
      venue: e._embedded.venues[0].name
    }));

    res.json(formatted);
  } catch (err) {
    console.error('events error:', err.message);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});



// 2. 航班查询 (Amadeus)
app.get('/api/flights', async (req, res) => {
  const { origin, dest, date } = req.query;
  if (!origin || !dest || !date) {
    return res.status(400).json({ error: '缺少参数 origin,dest,date' });
  }
  try {
    const tokenRes = await axios.post(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_ID,
        client_secret: process.env.AMADEUS_SECRET
      }).toString(),
      { headers:{ 'Content-Type':'application/x-www-form-urlencoded' }}
    );
    const token = tokenRes.data.access_token;
    const flightRes = await axios.get(
      'https://test.api.amadeus.com/v2/shopping/flight-offers',
      {
        headers: { Authorization: `Bearer ${token}` },
        params:  {
          originLocationCode:      origin,
          destinationLocationCode: dest,
          departureDate:           date,
          adults:                  1
        }
      }
    );
    const offers = flightRes.data.data.map(o => ({
      price:    o.price.total,
      airline:  o.validatingAirlineCodes[0],
      departAt: o.itineraries[0].segments[0].departure.at
    }));
    res.json(offers);
  } catch (err) {
    console.error('flights error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_description || err.message });
  }
});

// 3. 酒店查询 (RapidAPI – Booking.com15)
app.get('/api/hotels', async (req, res) => {
  const { city, checkin, checkout } = req.query;
  if (!city || !checkin || !checkout) {
    return res.status(400).json({ error: '缺少参数 city,checkin,checkout' });
  }
  try {
    const hotRes = await axios.get(
      'https://booking-com15.p.rapidapi.com/api/v1/hotels/search',
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
        },
        params: {
          city_name:     city,
          checkin_date:  checkin,
          checkout_date: checkout,
          adults_number: 1,
          order_by:      'popularity'
        }
      }
    );
    const hotels = hotRes.data.result.map(h => ({
      name:  h.hotel_name,
      price: h.price_breakdown.gross_price,
      score: h.review_score
    }));
    res.json(hotels);
  } catch (err) {
    console.error('hotels error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// 4. 地理定位 (IP → 城市)
app.get('/api/geoip', async (req, res) => {
  try {
    const ip = (req.ip === '::1' ? '117.136.0.1' : req.ip);
    const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`);
    res.json({ city: geoRes.data.city, country: geoRes.data.country_name });
  } catch (err) {
    console.error('geoip error:', err.message);
    res.status(500).json({ error: '定位失败' });
  }
});

// 静态文件
app.use(express.static('public'));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
