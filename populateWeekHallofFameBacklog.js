const express = require('express');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const db = require('./database');
const helper = require('./helpers');
const moment = require('moment-timezone');
const VERSION = require('./package.json').version;

// console.log(moment('2020').add(52, 'weeks').startOf('isoweek').format('YYYY-MM-DD'))
// from = moment('2021').add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD')
// console.log(9)

for(let i = 39; i < 53; i++){
  from = moment('2020').add(i, 'weeks').startOf('isoweek').format('YYYY-MM-DD')
  d = new Date(from)
  to = new Date(d.setDate(d.getDate() - d.getDay()+7)).toISOString().substr(0,10)

  Promise.all([db.getWeekWinners(3, from, to)]).then(values => {
    const [ toplist ] = values;
    db.addToWeekTable(toplist[0].id,1,i+1,2020,toplist[0].volume_sum)
    db.addToWeekTable(toplist[1].id,2,i+1,2020,toplist[1].volume_sum)
    db.addToWeekTable(toplist[2].id,3,i+1,2020,toplist[2].volume_sum)
  }).catch(error => {
    console.error(error)
  })
}

for(let i = 1; i < 44; i++){
  from = moment('2021').add(i, 'weeks').startOf('isoweek').format('YYYY-MM-DD')
  d = new Date(from)
  to = new Date(d.setDate(d.getDate() - d.getDay()+7)).toISOString().substr(0,10)

  Promise.all([db.getWeekWinners(3, from, to)]).then(values => {
    const [ toplist ] = values;
    db.addToWeekTable(toplist[0].id,1,i,2021,toplist[0].volume_sum)
    db.addToWeekTable(toplist[1].id,2,i,2021,toplist[1].volume_sum)
    db.addToWeekTable(toplist[2].id,3,i,2021,toplist[2].volume_sum)
  }).catch(error => {
    console.error(error)
  })
}

console.log("Populated weeks with past weeks winners")
process.exit(1)

// table.increments('id').primary();
// table.integer('user_id').unsigned().notNullable().references('users.id');
// table.integer('place').unsigned().notNullable();
// table.integer('week').unsigned().notNullable();
// table.integer('year').unsigned().notNullable();
// table.integer('volume').unsigned().notNullable();
// { id: 15, name: 'Joel Jolarson', volume_sum: '861' },
//   { id: 2, name: 'Niklas Hedström', volume_sum: '831' },
//   { id: 1, name: 'Emil Wihlander', volume_sum: '616' }