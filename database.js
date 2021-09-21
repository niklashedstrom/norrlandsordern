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

exports.getToplist = async (limit) => {
  const response = await knex
    .select('name', 'volume_sum')
    .from( knex('norrlands').select('user_id', knex.raw('SUM(volume) as volume_sum')).groupBy('user_id').as('t'))
    .leftJoin('users','t.user_id','users.id')
    .orderBy('volume_sum', 'desc')
    .limit(limit)
  return response.map((p, i) => ({...p, index: i +1}));
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