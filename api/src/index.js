import express from 'express';
import session from 'express-session'
import cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import LoginController from './login-controller.js';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const sessionConfig = {
    secret: process.env.SESSION_SECRET || uuidv4(),
    resave: false,
    cookie: { secure: false },
    httpOnly: false,
};
app.use(session(sessionConfig));
if (!sessionConfig.cookie.secure) {
    console.warn("WARNING: Secure cookies are disabled. sessionConfig.cookie.secure should be set to TRUE in a production environment.");
}
if (!sessionConfig.httpOnly) {
    console.warn("WARNING: HTTP only is disabled. sessionConfig.httpOnly should be set to TRUE in a production environment.");
}

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const simpleKeyValueStore = {};
const controller = (new LoginController({
    appName: 'SMS Authenticator Demo',
    store: (k, v) => {
        simpleKeyValueStore[k] = v
    },
    lookup: (k) => {
        return simpleKeyValueStore[k];
    },
    remove: (k) => {
        return delete simpleKeyValueStore[k];
    },
}));

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Content-Type,X-Requested-With");
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Credentials', "true");
    next();
});

// Returns JSON payload of suggested GET parameters to be sent to smswallet.xyz/sign
app.post('/login/init', (req, res) => {
    const callbackUrl = process.env.CALLBACK_URL;
    const redirectPostLogin = req.body.redirect;
    const loginRequest = controller.initLogin({callbackUrl, callbackParams: redirectPostLogin ? {redirect: redirectPostLogin} : null});
    return res.json(loginRequest);
});

// Verifies if a login is valid
app.post('/login/verify', (req, res) => {
    const {signature, messageHash, address, error, cancelled} = req.body;
    console.log('verify', req.body);
    const isLoginSuccessful = controller.verifyLogin({signature, messageHash, address, error, cancelled});
    if (!isLoginSuccessful) {
        return res.status(403).send();
    }
    req.session.address = address;
    return res.status(200).send();
});

// Destroys the session
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).send();
        return res.status(200).send();
    });
});

// A test endpoing to check login status
app.get('/whoami', (req, res) => {
    const address = req.session.address;
    res.json({
        isAuthenticated: !!address,
        address: address,
    });
});

app.listen(3001);
