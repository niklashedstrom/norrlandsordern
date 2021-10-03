const bcrypt = require('bcrypt')
const knex_config = require('./knexfile');
const knex = require('knex')(knex_config[process.env.NODE_ENV] || knex_config.development);

exports.knex = knex;

exports.addUser = async (user) => {
  if (['name', 'username', 'password', 'email'].every(prop => user[prop])) {
    const hash = await bcrypt.hash(user.password, 10)
    await knex('users').insert({
      username: user.username,
      name: user.name,
      hash: hash,
      email: user.email,
    })
    return true;
  }
  return false;
}

exports.updateUser = async (id, newData) => {
  if (newData.password) {
    const hash = await bcrypt.hash(newData.password, 10);
    newData.hash = hash;
    delete newData.password;
  }
  return knex('users').where({id: id}).update(newData);
}

exports.getUser = async (id, password) => {
  const user = (await knex('users').select('*').where({id: id}))[0];
  user.admin = Boolean(user.admin)
  if (password) {
    try {
      await this.authenticateUser(user.username, password);
      return user;
    } catch (e) {
      return undefined;
    }
  }
  return user;
}

exports.getAllUsers = async () => {
  return await knex('users')
}

exports.getUserCount = async () => {
  return (await knex('users').count('*'))[0].count
}

formatToplist = (res, limit, userId) => {
  const toplist = res.slice(0,limit).map((p, i) => ({...p, index: i + 1, self: userId == p.id}))

  if (!toplist.some(p => p.self))
    res.forEach((p, i) => { if (p.id == userId) toplist.push({...p, index: i + 1, self: true})})

  return toplist;
}

exports.getToplist = async (limit, userId) => {
  const response = await knex
    .select('name', 'volume_sum', 'id')
    .from( knex('norrlands').select('user_id', knex.raw('SUM(volume) as volume_sum')).groupBy('user_id').as('t'))
    .leftJoin('users','t.user_id','users.id')
    .orderBy('volume_sum', 'desc')

  return formatToplist(response, limit, userId)
}

exports.getWeeklyToplist = async (limit, userId) => {
  const d = new Date();
  const mon = d.getDate() - d.getDay() + (d.getDay() == 0 ? -6:1); // adjust when day is sunday
  const from = new Date(d.setDate(mon)).toISOString().substr(0,10)
  const to = new Date(d.setDate(d.getDate() - d.getDay()+8)).toISOString().substr(0,10);

  const response = await knex
    .select('id', 'name', 'volume_sum')
    .from( knex('norrlands').select('user_id', knex.raw('SUM(volume) as volume_sum')).whereBetween('created_at', [from, to]).groupBy('user_id').as('t'))
    .leftJoin('users','t.user_id','users.id')
    .orderBy('volume_sum', 'desc')

  return formatToplist(response, limit, userId)
}


exports.getUserFromEmail = async (email) => {
  const users = await knex('users').select('*').where({email: email});
  return users.map(user => ({...user, admin: Boolean(user.admin)}))
}

exports.authenticateUser = async (username, password) => {
  const user = (await knex('users').select('*').where({username: username}))[0];
  user.admin = Boolean(user.admin)
  if (user && await bcrypt.compare(password, user.hash))
    return user;
  else
    throw new Error('Failed to authenticate user');
}

exports.checkUsername = async (username) => {
  const user = (await knex('users').select('*').where({username: username}))[0];
  return !user;
}

exports.addNorrlands = async (userId, volume) => {
  if (userId && volume) {
    return (await knex('norrlands').insert({
      user_id: userId,
      volume: volume,
    }).returning('id'));
  }
  return false;
}

const resToNorrland = r => ({...r, created_at: new Date(r.created_at + " UTC")})

exports.getNorrlands = async (userId) => {
  return (await knex('norrlands').where({user_id: userId}).orderBy('id', 'desc')).map(resToNorrland);
}

exports.updateNorrlands = async (id, data) => {
  return knex('norrlands').where({id:id}).update(data);
}

exports.getNorrlandsById = async (id) => {
  return (await knex('norrlands').where({'norrlands.id': id}).join('users', 'users.id', '=', 'norrlands.user_id')).map(resToNorrland)[0];
}

exports.getAllNorrlands = async () => {
  return (await knex('norrlands').orderBy('id', 'desc')).map(resToNorrland);
}

exports.getNorrlandsPage = async (page, pageSize) => {
  return (await knex('norrlands').orderBy('id', 'desc').offset(page*pageSize).limit(pageSize)).map(resToNorrland);
}

exports.deleteNorrlands = async (id) => {
  return await knex('norrlands').where({id: id}).del();
}

exports.getLatestNorrlands = async (limit) => {
  const respons = await knex('norrlands').select('*').orderBy('created_at', 'desc').limit(limit).leftJoin('users', 'users.id', 'norrlands.user_id');
  return respons.map(r => ({...r, created_at: new Date(r.created_at + " UTC")}));
}

exports.getTotalNorrlands = async () => {
  //const response = await knex('norrlands').sum('volume as total');
  const response = await knex('norrlands').select('volume')
  const total = response.map(r => r.volume).reduce((a,b) => a+b,0);
  return total+4686; //4686 cl var första kvällen, när allt startade.
}

exports.getAccumulatedNorrlands = async () => {
  const response = await knex('norrlands').select('volume', 'created_at').orderBy('created_at', 'asc');

  const y = [];
  const x = [];

  let currentDate = response[0].created_at;
  y.push(currentDate.toISOString().substring(0, 10))

  while (currentDate < Date.now()) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    y.push(nextDate.toISOString().substring(0,10))
    currentDate = nextDate
  }

  let currentSum = 0;

  y.forEach(d => {
    currentSum += response.filter(n => n.created_at.toISOString().slice(0,10) == d).reduce((a,b) => a+b.volume, 0)
    x.push(currentSum)
  })

  return {
    x: x,
    y: y,
  }
}