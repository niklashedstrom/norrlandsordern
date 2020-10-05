const bcrypt = require('bcrypt')
const knex_config = require('./knexfile');
const knex = require('knex')(knex_config[process.env.NODE_ENV] || knex_config.development);

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

exports.getUser = async (id) => {
  return (await knex('users').select('*').where({id: id}))[0];
}

exports.authenticateUser = async (username, password) => {
  const user = (await knex('users').select('*').where({username: username}))[0];
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
    return await knex('norrlands').insert({
      user_id: userId,
      volume: volume,
    });
  }
  return false;
}

exports.getNorrlands = async (userId) => {
  return await knex('norrlands').where({user_id: userId}).orderBy('id', 'desc');
}

exports.deleteNorrlands = async (id) => {
  return await knex('norrlands').where({id: id}).del();
}

exports.getTotalNorrlands = async () => {
  //const response = await knex('norrlands').sum('volume as total');
  const response = await knex('norrlands').select('volume')
  const total = response.map(r => r.volume).reduce((a,b) => a+b,0);
  return total+4686; //4686 cl var första kvällen, när allt startade.
}