const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./database');

const auth = {
  autenticated: (req, res, next) => {
    if (req.user) {
      next()
    } else {
      res.redirect('/login')
    }
  }
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
  secret: "cats", //TODO: Real secret
  resave: false,
  saveUninitialized: true,
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  db.getTotalNorrlands().then(cm => {
    const m = (cm/100).toFixed(2);
    res.render('home', {user: req.user, distance: m});
  })
})

app.get('/me', auth.autenticated, (req, res) => {
  db.getNorrlands(req.user.id)
    .then(norrlands => {
      res.render('user', {user: req.user, norrlands: norrlands});
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
  res.render('login');
})

app.post('/login', passport.authenticate('local', {
  successRedirect: '/me',
  failureRedirect: '/login',
  failureFlash: true,
}))

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
})

app.post('/norrlands', auth.autenticated, (req, res) => {
  const { volume } = req.body;
  if (volume) {
    db.addNorrlands(req.user.id, volume).then(() => res.redirect('/me'))
  }
})

const server = app.listen(process.env.PORT || 5000, () => {
  const host = server.address().address
  const port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})
