# LiveTravel Concerts

## Project Description

LiveTravel Concerts is an all-in-one travel entertainment app that allows users to discover live music events and book and travel to them in one place. By integrating live concert listings with Ticketmaster, and flights and hotels with Amadeus/Booking.com, the app intelligently recommends the best packages for gigs and trips based on destination, date, genre and budget. Users can view events on the app's smart map, filter by star or genre, and add favourite events to their personal 'favourites'. Beyond ticketing and travel, LiveTravel Concerts promotes the platform by refining good recommendations through user reviews, shared photos and social feedback.

## Setup Instructions

### Prerequisites

- Node.js
- MySQL database

### Installation Steps

1. Clone the repository:
   ```
   git clone https://github.com/bingoz123/live-travel-app.git
   cd live-travel-app-main
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the database:
   - Create a MySQL database named `live_travel`
   - Import the database schema from `db/livetravel.sql`

4. Configure environment variables:
   - Create a `.env` file in the root directory based on the provided example
   - Update the following variables with your own API keys and database credentials:
     - TM_API_KEY (Ticketmaster API key)
     - AMADEUS_ID and AMADEUS_SECRET (Amadeus API credentials)
     - RAPIDAPI_KEY (RapidAPI key for Booking.com)
     - DB_HOST, DB_USER, DB_PASS, DB_NAME (MySQL database connection details)

5. Start the application:
   ```
   node app.js
   ```

6. Access the application in your browser at `http://localhost:3000`

## Features and Functionality

### User Authentication
- User registration with email and username (routes/register.js)
- Secure login with password hashing and captcha verification (routes/login.js)
- Session management for authenticated users (app.js)

### Event Discovery
- Browse upcoming performances and concerts via Ticketmaster API (public/events.html)
- Filter events by city and date (public/events.html)
- View detailed event information including venue and performance time (public/events.html)

### Travel Planning
- Search for flights between cities using Amadeus API (public/flights.html)
- View flight options with pricing and airline information (public/flights.html)
- Find hotels at event destinations through Booking.com API (public/hotels.html)
- Compare hotel options with pricing and ratings (public/hotels.html)

### Location Services
- Automatic location detection based on IP address (public/geoip.html)
- Personalized recommendations based on user's current location (public/geoip.html)

### Admin Features
- User management (add, edit, delete users) (routes/admin.js)
- View registered user information (routes/admin.js)
- System administration and monitoring (routes/admin.js)

### Technical Features
- RESTful API architecture
- Integration with multiple third-party APIs
- Responsive web interface
- Secure authentication with bcrypt password hashing
- MySQL database for data persistence