// app.js
require('dotenv').config();         // 读取 .env
const express     = require('express');
const bodyParser  = require('body-parser');
const axios       = require('axios');

// 已有的路由
const registerRoute = require('./routes/register');
const adminRoute    = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ---------- 内部路由 ----------
app.use('/api/register', registerRoute);
app.use('/admin',        adminRoute);

// ---------- 外部 API 代理路由 ----------

/**
 * 演出列表（Songkick / Bandsintown / Ticketmaster）
 * GET /api/events?city=xxx&date=YYYY-MM-DD
 */
app.get('/api/events', async (req, res) => {
  try {
    const city = req.query.city || 'Melbourne';
    const date = req.query.date || '2025-06-20';
    // 以 Ticketmaster 为例
    const tm = await axios.get(
      'https://app.ticketmaster.com/discovery/v2/events.json',
      {
        params: {
          apikey:        process.env.TM_API_KEY,
          city, 
          startDateTime:`${date}T00:00:00Z`
        }
      }
    );
    const list = (tm.data._embedded?.events || []).map(ev => ({
      id:    ev.id,
      name:  ev.name,
      date:  ev.dates.start.localDate,
      venue: ev._embedded.venues[0].name
    }));
    res.json(list);
  } catch (err) {
    console.error('events error:', err.message);
    res.status(500).json({ error: '无法获取演出数据' });
  }
});

/**
 * 航班查询（Amadeus Flight Offers Search 示例）
 * GET /api/flights?origin=SYD&dest=MEL&date=2025-06-15
 */
app.get('/api/flights', async (req, res) => {
  try {
    const { origin='SYD', dest='MEL', date='2025-06-15' } = req.query;

    // 1) 先拿 OAuth2 Token
    const tokenRes = await axios.post(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     process.env.AMADEUS_ID,
        client_secret: process.env.AMADEUS_SECRET
      }).toString(),
      { headers:{ 'Content-Type':'application/x-www-form-urlencoded' }}
    );
    const token = tokenRes.data.access_token;

    // 2) 用 Token 查询航班
    const flightRes = await axios.get(
      'https://test.api.amadeus.com/v2/shopping/flight-offers',
      {
        headers: { Authorization: `Bearer ${token}` },
        params:  { originLocationCode: origin, destinationLocationCode: dest, departureDate: date, adults:1 }
      }
    );
    const offers = flightRes.data.data.map(o => ({
      price:     o.price.total,
      airline:   o.validatingAirlineCodes[0],
      departAt:  o.itineraries[0].segments[0].departure.at
    }));
    res.json(offers);
  } catch (err) {
    console.error('flights error:', err.message);
    res.status(500).json({ error: '无法获取航班数据' });
  }
});

/**
 * 酒店查询
 */
app.get('/api/hotels', async (req, res) => {
  try {
    const { city='Melbourne', checkin='2025-06-15', checkout='2025-06-17' } = req.query;
    const hotRes = await axios.get(
      'https://booking-com.p.rapidapi.com/v1/hotels/search',
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'booking-com.p.rapidapi.com'
        },
        params: {
          city_name: city,
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
    console.error('hotels error:', err.message);
    res.status(500).json({ error: '无法获取酒店数据' });
  }
});

/**
 * 地理定位（IP → 城市）
 * GET /api/geoip
 */
app.get('/api/geoip', async (req, res) => {
  try {
    // 取客户端 IP（可能需要反代真实 IP）
    const ip = req.ip === '::1' ? '117.136.XX.XX' : req.ip;
    const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`);
    res.json({ city: geoRes.data.city, country: geoRes.data.country_name });
  } catch (err) {
    console.error('geoip error:', err.message);
    res.status(500).json({ error: '定位失败' });
  }
});

// ---------- 静态文件 ----------
app.use(express.static('public'));

// 启动
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
