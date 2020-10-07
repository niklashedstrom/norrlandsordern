const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const helmet = require('helmet');
const crypto = require('crypto');
const passwordGen = require('generate-password');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./database');
const mailer = require('./mailer');

const auth = {
  autenticated: (req, res, next) => {
    if (req.user) {
      next()
    } else {
      res.redirect('/login')
    }
  }
}

const getPercentage = (dist) => {
  const totalDist = 540811.52;
  return dist/totalDist;
}

const getPosition = (dist) => {
  const startPos = [55.710783, 13.210120];
  const endPos = [60.201391, 16.739080];
  const percentage = getPercentage(dist);
  const lat = startPos[0] + percentage*(endPos[0]-startPos[0]);
  const lon = startPos[1] + percentage*(endPos[1]-startPos[1]);
  return {lat, lon};
}

const backUrl = (url) => url.split('/').slice(0,-1).join('/')

const formatNumber = (number, decimals) => {
  if (decimals == 0)
    return (number).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ').slice(0,-3)
  else
    return (number).toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$& ')
}

const formatDate = (date) => {
  const pad = (number) => ('000' + number).slice(-2)
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const formatDateDiff = (from, to) => {
  const diff = to - from;
  const minutes = parseInt(diff/1000/60)
  const hours = parseInt(minutes/60)
  const days = parseInt(hours/24)

  if (days != 0) return (days == 1) ? '1 dag' : days + ' dagar';
  if (hours != 0) return (hours == 1) ? '1 timme' : hours + ' timmar';
  return (minutes == 1) ? '1 minut': minutes + ' minuter';
}

passport.use(new LocalStrategy((username, password, done) => {
  if (!username || !password)
    return done(null, false, {message: 'Missing username or password'})

  db.authenticateUser(username, password)
    .then(user => done(null, user))
    .catch(() => done(null, false, {message: 'Wrong username or password'}))
}))

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.getUser(id)
    .then(user => done(null, user))
    .catch(() => done(new Error('Failed to find user'), null))
});

const app = express();

app.set('view engine', 'pug');

app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'cats', //TODO: Real secret
  resave: false,
  saveUninitialized: true,
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('hex');
  next();
})
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.get('/', (req, res) => {
  console.log('GET /')
  Promise.all([db.getTotalNorrlands(), db.getLatestNorrlands(10), db.getToplist(10)]).then(values => {
    const [cl, latestNorrlands, toplist ] = values;
    const m = (cl/33*0.066).toFixed(2);
    res.render('home', {
      user: req.user,
      volume: cl,
      latestNorrlands: latestNorrlands.map(n => ({...n, diff: (new Date()) - n.created_at})),
      toplist: toplist,
      percentage: getPercentage(m),
      ...getPosition(m),
      formatNumber: formatNumber,
      formatDate: formatDate,
      formatDateDiff: formatDateDiff,
    });
  })
})

app.get('/users/:id', auth.autenticated, async (req, res) => {
  if (!req.user.admin || req.user.id != req.params.id) return res.sendStatus(401)
  try {
    const norrlands = await db.getNorrlands(req.params.id);
    const user = await db.getUser(req.params.id);
    return res.render('user', {
      user: user,
      me: user.id == req.user.id,
      norrlands: norrlands,
      formatNumber: formatNumber,
      formatDate: formatDate,
      formatDateDiff: formatDateDiff,
      lastLogged: req.query.id
    });
  } catch (e) {
    console.log(e)
    return res.redirect('/failure')
  }
})

app.get('/users/:id/edit', auth.autenticated, async (req, res) => {
  if (!req.user.admin && req.user.id != req.params.id) return res.sendStatus(401)
  try {
    const user = await db.getUser(req.params.id);
    res.render('editUser', {backUrl: backUrl(req.url), user: user, admin: req.user.admin})
  } catch (e) {
    console.log(e)
    return res.redirect('/failure')
  }
})

app.post('/users/:id/edit', auth.autenticated, async (req, res) => {
  if (!req.user.admin && req.user.id != req.params.id) return res.sendStatus(401)
  try {
    const changedData = {}
    const formData = req.body;
    formData.admin = formData.admin != undefined;
    const user = await db.getUser(req.params.id);

    const pugData = {
      user: {...user, name: formData.name, email: formData.email},
      backUrl: backUrl(req.url),
      admin: req.user.admin,
    }

    if (formData.name != user.name) changedData.name = formData.name
    if (formData.email != user.email) changedData.email = formData.email
    if (formData.admin != user.admin) changedData.admin = formData.admin
    if (formData['new-password'].length != 0 ) {
      if (formData['new-password'] === formData['new-password-repeat']) {
        changedData.password = formData['new-password']
      } else {
        return res.render('editUser', {...pugData, status: {type: 'danger', message: 'De nya lösenorden matchade inte, inget sparades.'}})
      }
    }
    if (Object.keys(changedData).length == 0)
      return res.render('editUser', {...pugData, status: {type: 'warning', message: 'Inget skiljde sig från tidigare'}})

    if (changedData.name && changedData.name.length === 0)
      return res.render('editUser', {...pugData, status: {type: 'warning', message: 'Namnet får inte vara tomt, inget sparades.'}})
    if (changedData.email && changedData.email.length === 0)
      return res.render('editUser', {...pugData, status: {type: 'warning', message: 'E-post får inte vara tomt, inget sparades.'}})

    if (!req.user.admin && changedData.admin)
      return res.render('editUser', {...pugData, status: {type: 'warning', message: 'Bara en admin får ändra adminstatus, inget sparades.'}})

    console.log(changedData)
    await db.updateUser(user.id, changedData)
    return res.render('editUser', {...pugData, status: {type: 'success', message: 'Informationen är uppdaterad!'}})

  } catch (e) {
    console.log(e)
    return res.redirect('/failure')
  }

})

app.get('/me', auth.autenticated, (req, res) => {
  db.getNorrlands(req.user.id)
    .then(norrlands => {
      res.render('user', {
        user: req.user,
        me: true,
        norrlands: norrlands,
        formatNumber: formatNumber,
        formatDate: formatDate,
        formatDateDiff: formatDateDiff,
        lastLogged: req.query.id
      });
    })
})

app.get('/signup', (req, res) => {
  res.render('signup')
})

app.post('/signup', (req, res) => {
  const user = req.body;
  if (user.secret !== 'Norrlandsordern')
    return res.render('signup', ({wrongSecret: true, ...user}));
  if (user.password !== user.password_repeated)
    return res.render('signup', ({notSamePassword: true, ...user}));
  db.checkUsername(user.username).then(available => {
    if (available)
      db.addUser(user).then(() => {
        res.redirect('/me');
      })
    else
      res.render('signup', ({usernameExists: true, ...user}))
  })

})

app.get('/login', (req, res) => {
  res.render('login', {status: req.query.status});
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login?status=failed',
}))

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
})

app.post('/norrlands', auth.autenticated, (req, res) => {
  const { volume } = req.body;
  if (volume) {
    db.addNorrlands(req.user.id, volume).then((response) => {
      res.redirect(`/me?id=${response[0]}`)
    })
  }
})

app.get('/forgot', (req, res) => {
  const {email} = req.query;
  res.render('forgot', {email: email})
})

app.get('/failure', (req, res) => res.render('failure'))

app.post('/forgot', async (req, res) => {
  const email = req.body.email;
  try {
    const users = await db.getUserFromEmail(email)
    if (users.length == 0) return res.redirect(`forgot?email=${email}`)

    const newUsers = users.map(r => ({...r, password: passwordGen.generate({length: 10, numbers: true})}))
    await Promise.all(newUsers.map(user => db.updateUser(user.id, {password: user.password})))

    const text = 'Här kommer ditt återställda lösenord:\n\n' + newUsers.map(user => `Användarnamn: ${user.username}, lösenord: ${user.password}`).join('\n') + '\n\nMot norrlands, en burk i taget!\nNorrlandsordern';
    await mailer.send(email, 'Återställt lösenord', text)

    res.redirect(`forgot?email=${email}`)
  } catch (e) {
    res.redirect('/failure')
  }
})

const server = app.listen(process.env.PORT || 5000, () => {
  const host = server.address().address
  const port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})
