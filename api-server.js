const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { auth, requiredScopes } = require("express-oauth2-jwt-bearer");
const fetch = require("node-fetch");
const authConfig = require("./src/auth_config.json");
const bodyParser = require("body-parser")

const app = express();

// const port = process.env.API_PORT || 3001;
const port = 443
const appPort = process.env.SERVER_PORT || 3000;
const appOrigin = authConfig.appOrigin || `http://localhost:${appPort}`;

if (
  !authConfig.domain ||
  !authConfig.audience ||
  authConfig.audience === "YOUR_API_IDENTIFIER"
) {
  console.log(
    "Exiting: Please make sure that auth_config.json is in place and populated with valid domain and audience values"
  );

  process.exit();
}

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: appOrigin }));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const checkJwt = auth({
  audience: authConfig.audience,
  issuerBaseURL: `https://${authConfig.domain}/`,
  algorithms: ["RS256"],
});

app.post("/api/pizza/order", checkJwt, async (req, res) => {
  try {
    if (!req.auth.payload.scope.split(" ").find(it => it === "update:order_pizza")) {
      throw new Error("The scope \"update:order_pizza\" is required.")
    }
    const accessToken = await getTokenForManagementAPI()
    const user = await getUser(accessToken, req.auth.payload.sub)
    if (!user || !user.email_verified) {
      throw new Error("Please verify your email")
    }
    if (getPizzaCount(req.body) === 0) {
      throw new Error("Please select you pizza")
    }

    let history = []
    if (user.user_metadata && user.user_metadata.history) {
      history = user.user_metadata.history
    }
    history.push({
      date: Date.now(),
      order: req.body
    })
    const response = await addUserMetadata(accessToken, req.auth.payload.sub, {history:history})
    res.send({
      status: "OK",
      result: JSON.stringify(req.body)
    })
  } catch (e) {
    res.send({
      status: "Error",
      message: e.message
    })
  }
})

const getUser = async (token, uid) => {
  const res = await fetch(`https://${authConfig.domain}/api/v2/users/${uid}`, {
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    }
  })
  if (!res.ok) {
    return null
  }
  return await res.json()
}

const getPizzaCount = (data) => {
  let count = 0
  Object.keys(data).forEach(function(key) {
    count += this[key]
  }, data)
  return count
}

const addUserMetadata = async (token, uid, obj) => {
  return await fetch(`https://${authConfig.domain}/api/v2/users/${uid}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({user_metadata:obj})
  })
}

const getTokenForManagementAPI = async () => {
  const res = await fetch(`https://${authConfig.domain}/oauth/token`, {
    method: "POST",
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      client_id: authConfig.management.client_id,
      client_secret: authConfig.management.client_secret,
      audience: authConfig.management.audience,
      grant_type: "client_credentials"
    })
  })
  if (!res.ok) {
    return null
  }
  return (await res.json()).access_token
}

const fs = require("fs")
const server = require("https").createServer({
  key: fs.readFileSync("./cert/privatekey.pem"),
  cert: fs.readFileSync("./cert/cert.pem")
}, app)
server.listen(port, () => console.log(`API Server listening on port ${port}`));
