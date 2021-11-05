const express = require('express');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const passport = require('passport');
const helmet = require('helmet');
const passwordGen = require('generate-password');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./database');
const mailer = require('./mailer');
const helper = require('./helpers');

const VERSION = require('./package.json').version;

const auth = {
  autenticated: (req, res, next) => {
    if (req.user) {
      next()
    } else {
      res.redirect('/login')
    }
  },
  adminOrUser: (req, res, next) => {
    if (req.user.admin || req.user.id == req.params.id) {
      next()
    } else {
      res.sendStatus(401)
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
  store: new KnexSessionStore({knex: db.knex}),
  secret: process.env.SESSION_SECRET || 'cats',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 365*24*3600*1000,
  },
  rolling: true,
}));
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.get('/', (req, res) => {
  const toplistSize = 10;
  Promise.all([db.getTotalNorrlands(), db.getLatestNorrlands(10), db.getToplist(toplistSize, req.user?.id), db.getUserCount(), db.getToplistRange(toplistSize, req.user?.id, 'week')]).then(values => {
    const [cl, latestNorrlands, allTimeToplist, userCount, weeklyToplist ] = values;
    const m = (cl/33*0.066).toFixed(2);

    res.render('home', {
      user: req.user,
      userCount: userCount,
      volume: cl,
      latestNorrlands: latestNorrlands.map(n => ({...n, diff: (new Date()) - n.created_at})),
      allTimeToplist: allTimeToplist,
      weeklyToplist: weeklyToplist,
      percentage: helper.getPercentage(m),
      ...helper.getPosition(m),
      formatNumber: helper.formatNumber,
      formatDate: helper.formatDate,
      formatDateDiff: helper.formatDateDiff,
      version: VERSION,
    });
  })
})

app.get('/statistics', auth.autenticated, async (req, res) => {
  const toplistSize = 10;
  Promise.all([
    db.getTotalNorrlands(),
    db.getAllUsers(),
    db.getToplist(toplistSize, req.user?.id),
    db.getToplistRange(toplistSize, req.user?.id, 'week'),
    db.getToplistRange(toplistSize, req.user?.id, 'month'),
    db.getToplistRange(toplistSize, req.user?.id, 'year'),
    db.getLatestNorrlands(10),
    db.getAccumulatedNorrlands()]).then(values => {
    const [ cl, users, allTimeToplist, weeklyToplist, monthlyToplist, yearlyToplist, latestNorrlands, accumulated ] = values;
    const m = (cl/33*0.066).toFixed(2);
    res.render('statistics', {
      volume: cl,
      totalUsers: users.length,
      latestUsers: users.reverse().slice(0, 10),
      latestNorrlands: latestNorrlands.map(n => ({...n, diff: (new Date()) - n.created_at})),
      norrlandsPerUser: helper.getNorrlandsPerUser(users.length),
      timeToSuccess: helper.getYearsToSuccess(cl),
      allTimeToplist: allTimeToplist,
      weeklyToplist: weeklyToplist,
      monthlyToplist: monthlyToplist,
      yearlyToplist: yearlyToplist,
      accumulated: accumulated,
      percentage: helper.getPercentage(m),
      formatNumber: helper.formatNumber,
      formatDate: helper.formatDate,
      ...helper.getPosition(m),
    })
  })
})

app.get('/statistics/toplist-all-time', auth.autenticated, async (req, res) => {
  const size = parseInt(req.query.size)

  if (!size) res.redirect('/statistics/toplist-all-time?size=25')

  Promise.all([db.getToplist(size, req.user?.id)]).then(values => {
    const [ toplist ] = values;
    res.render('toplist-all-time', {
      backUrl: helper.backUrl(req.url),
      toplist: toplist,
      size: size,
      formatNumber: helper.formatNumber,
    })
  })
})

app.get('/statistics/toplist-weekly', auth.autenticated, async (req, res) => {
  const size = parseInt(req.query.size)

  if (!size) res.redirect('/statistics/toplist-weekly?size=25')

  Promise.all([db.getToplistRange(size, req.user?.id, 'week')]).then(values => {
    const [ toplist ] = values;
    res.render('toplist-range', {
      backUrl: helper.backUrl(req.url),
      toplist: toplist,
      size: size,
      range: 'weekly',
      formatNumber: helper.formatNumber,
    })
  })
})

app.get('/statistics/toplist-monthly', auth.autenticated, async (req, res) => {
  const size = parseInt(req.query.size)

  if (!size) res.redirect('/statistics/toplist-monthly?size=25')

  Promise.all([db.getToplistRange(size, req.user?.id, 'month')]).then(values => {
    const [ toplist ] = values;
    res.render('toplist-range', {
      backUrl: helper.backUrl(req.url),
      toplist: toplist,
      size: size,
      range: 'monthly',
      formatNumber: helper.formatNumber,
    })
  })
})

app.get('/statistics/toplist-yearly', auth.autenticated, async (req, res) => {
  const size = parseInt(req.query.size)

  if (!size) res.redirect('/statistics/toplist-yearly?size=25')

  Promise.all([db.getToplistRange(size, req.user?.id, 'year')]).then(values => {
    const [ toplist ] = values;
    res.render('toplist-range', {
      backUrl: helper.backUrl(req.url),
      toplist: toplist,
      size: size,
      range: 'yearly',
      formatNumber: helper.formatNumber,
    })
  })
})

app.get('/statistics/log', auth.autenticated, async (req, res) => {
  const size = parseInt(req.query.size)

  if (!size) res.redirect('/statistics/log?size=25')

  Promise.all([db.getLatestNorrlands(size)]).then(values => {
    const [ latestNorrlands ] = values;
    res.render('log-list', {
      backUrl: helper.backUrl(req.url),
      latestNorrlands: latestNorrlands,
      formatNumber: helper.formatNumber,
      formatDate: helper.formatDate,
    })
  })
})

app.get('/users/:id', auth.autenticated, auth.adminOrUser, async (req, res) => {
  try {
    const norrlands = await db.getNorrlands(req.params.id);
    const user = await db.getUser(req.params.id);
    return res.render('user', {
      user: user,
      me: user.id == req.user.id,
      norrlands: norrlands,
      formatNumber: helper.formatNumber,
      formatDate: helper.formatDate,
      formatDateDiff: helper.formatDateDiff,
      lastLogged: req.query.id
    });
  } catch (e) {
    return res.redirect('/failure')
  }
})

app.get('/users/:id/edit', auth.autenticated, auth.adminOrUser, async (req, res) => {
  try {
    const user = await db.getUser(req.params.id);
    res.render('editUser', {backUrl: helper.backUrl(req.url), user: user, admin: req.user.admin})
  } catch (e) {
    return res.redirect('/failure')
  }
})

app.post('/users/:id/edit', auth.autenticated, auth.adminOrUser, async (req, res) => {
  try {
    const changedData = {}
    const formData = req.body;
    formData.admin = formData.admin != undefined;
    const user = await db.getUser(req.params.id);

    const pugData = {
      user: {...user, name: formData.name, email: formData.email},
      backUrl: helper.backUrl(req.url),
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

    await db.updateUser(user.id, changedData)
    return res.render('editUser', {...pugData, status: {type: 'success', message: 'Informationen är uppdaterad!'}})

  } catch (e) {
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
        formatNumber: helper.formatNumber,
        formatDate: helper.formatDate,
        formatDateDiff: helper.formatDateDiff,
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

app.get('/norrlands', auth.autenticated, (req, res) => {
  if (!req.user.admin) return res.sendStatus(401);

  if (!req.query.page || !req.query.pageSize)
    return res.redirect('/norrlands?page=0&pageSize=25');

  const page = parseInt(req.query.page)
  const pageSize = parseInt(req.query.pageSize)

  const link = (page, pageSize) => `/norrlands?page=${page}&pageSize=${pageSize}`

  db.getNorrlandsPage(page, pageSize).then((norrlands) => {
    res.render('norrlandsList', {
      norrlands: norrlands.map(n => ({...n, link: `/norrlands/${n.id}`})),
      formatDate: helper.formatDate,
      page: page,
      pageSize: pageSize,
      nextPage: link(page+1, pageSize),
      prevPage: (page == 0) ? undefined : link(page-1, pageSize)
    })
  })
})

app.get('/norrlands/:id', auth.autenticated, (req, res) => {
  if (!req.user.admin) return res.sendStatus(401);
  db.getNorrlandsById(req.params.id).then(norrlands => {
    res.render('editNorrlands', {
      norrlands: norrlands,
      backUrl: helper.backUrl(req.url),
      formatDate: helper.formatDate,
    })
  })
})

app.post('/norrlands/:id', auth.autenticated, (req, res) => {
  if (!req.user.admin) return res.sendStatus(401);

  if (req.body._method == 'delete')
    return db.deleteNorrlands(req.params.id).then(() => {
      res.redirect('/norrlands')
    })

  const volume = parseInt(req.body.volume);

  if (isNaN(volume))
    return res.render('editNorrlands', {
      norrlands: req.body,
      backUrl: helper.backUrl(req.url),
      formatDate: helper.formatDate,
      status: {
        type: 'warning',
        message: 'Volymen är felformatterad',
      },
    })
  db.updateNorrlands(req.params.id, {
    volume: volume,
  }).then(() => {
    db.getNorrlandsById(req.params.id).then(norrlands => {
      res.render('editNorrlands', {
        norrlands: norrlands,
        backUrl: helper.backUrl(req.url),
        formatDate: helper.formatDate,
        status: {
          type: 'success',
          message: 'Uppdateringen lyckad!',
        },
      })
    })
  })
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

app.get('/search', auth.autenticated, async (req, res) => {
  const term = req.query.t
  
  db.getUsersFromSearch(term).then(users => {
    res.render('search', {
      users,
      term,
      backUrl: helper.backUrl(req.url),
    })
  })
})

const port = process.env.PORT || 5000

const server = app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
