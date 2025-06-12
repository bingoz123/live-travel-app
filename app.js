require('dotenv').config();
const express      = require('express');
const bodyParser   = require('body-parser');
const axios        = require('axios');

const registerRoute = require('./routes/register');
const adminRoute    = require('./routes/admin');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const loginRoute = require('./routes/login');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 配置cookie和会话中间件
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'live-travel-app-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));


app.use('/api/register', registerRoute);
app.use('/api/admin',    adminRoute);
app.use('/api/login', loginRoute);

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
  const { origin, dest } = req.query;

  if (!origin || !dest) {
    return res.status(400).json({ error: '缺少参数 origin 和 dest' });
  }

  try {
    const response = await axios.get(`http://api.aviationstack.com/v1/flights`, {
      params: {
        access_key: process.env.AVIATIONSTACK_KEY,
        dep_iata: origin,
        arr_iata: dest
      }
    });

    const flights = response.data.data.map(f => ({
      airline: f.airline.name,
      flight: f.flight.iata,
      departAt: f.departure.scheduled,
      arriveAt: f.arrival.scheduled,
      terminal: f.departure.terminal || 'N/A',
      gate: f.departure.gate || 'N/A'
    }));

    res.json(flights);
  } catch (err) {
    console.error('aviationstack error:', err.response?.data || err.message);
    res.status(500).json({ error: '航班数据获取失败' });
  }
});

// 5. 城市名 → 经纬度
app.get('/api/geo', async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: 'Missing city name' });

  try {
    const geo = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: city,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'hotel-search-app' // 必须加，否则 Nominatim 会拒绝请求
      }
    });

    if (!geo.data || geo.data.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    const { lat, lon } = geo.data[0];
    res.json({ lat, lon });
  } catch (err) {
    console.error('Geo API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to locate city' });
  }
});


// 3. 酒店查询 (RapidAPI – Booking.com15)
app.get('/api/hotels', async (req, res) => {
  const { lat, lon, checkin = '2025-06-12', checkout = '2025-06-14' } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  try {
    const response = await axios.get('https://booking-com.p.rapidapi.com/v1/hotels/search-by-coordinates', {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.RAPIDAPI_HOST
      },
      params: {
        units: 'metric',
        room_number: 1,
        adults_number: 1,
        checkout_date: checkout,
        checkin_date: checkin,
        latitude: lat,
        longitude: lon,
        filter_by_currency: 'AUD',
        locale: 'en-gb',
        order_by: 'popularity'
      }
    });

    console.log('✅ API returned:', JSON.stringify(response.data, null, 2));

    const hotels = response.data.result?.map(h => ({
      name: h.hotel_name,
      price: h.min_total_price || 'N/A',
      score: h.review_score || 'N/A'
    })) || [];

    res.json(hotels);
  } catch (err) {
    console.error('❌ API error detail:', err.response?.data || err.message);
    res.status(500).json({ error: 'Hotel API request failed' });
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
