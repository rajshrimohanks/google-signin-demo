// All imports
const express = require('express');
const dotenv = require('dotenv');
const bodyparser = require('body-parser');
const cors = require('cors');
const { google } = require('googleapis');

// Init dotenv
const dotenvLoadResult = dotenv.config({ encoding: 'utf8' });
if (dotenvLoadResult.error) {
  throw dotenvLoadResult.error;
}

// Create express app
const port = process.env.PORT;
const app = express();
app.use(cors());
app.use(bodyparser.json());

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Create oAuth client
const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: `${process.env.BASE_URL}:${port}`
});

// Render index page.
app.get('/', (req, res, next) => {
  res.render('index', {
    serverUrl: `${process.env.BASE_URL}:${port}`
  });
});

app.get('/client', (req, res, next) => {
  res.render('client-code-only', {
    serverUrl: `${process.env.BASE_URL}:${port}`,
    googleSignInClientId: process.env.GOOGLE_CLIENT_ID
  });
});

// Endpoint to get the auth URL.
app.get('/auth', (req, res, next) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    // Set to 'consent' to always re-authorize the app with Google 
    // so that it retrieves the refresh_token everytime. 
    // Setting it to 'select_account' will only get the refresh_token
    // the very first time the app is authorized.
    prompt: 'consent',
    redirect_uri: `${process.env.BASE_URL}:${port}`,
    scope: 'https://www.googleapis.com/auth/content'
  });
  res.status(200);
  res.json({
    url: url
  });
});

// Endpoint to get the access token using the auth code.
app.post('/store', async (req, res, next) => {

  try {
    const { tokens } = await oauth2Client.getToken(req.body.code)
    oauth2Client.setCredentials(tokens);  // Optional. Set to use the client for further requests.

    res.status(200);
    res.json({
      status: 'ok',
      tokens: tokens
    });
  } catch (error) {
    console.error(error);
    res.status(500);
    res.json({
      status: 'error',
      error: error
    });
  }
});

// Kickstart the app.
app.listen(port, () => {
  console.log('App started in port:', port);
});
