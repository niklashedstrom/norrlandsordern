const express = require('express');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);
const db = require('./database');
const helper = require('./helpers');
const moment = require('moment-timezone');
const VERSION = require('./package.json').version;

//thisWeek = (moment("2022-01-03").isoWeek())

lastWeeksMonday = moment().day("Monday").isoWeek(moment().isoWeek()-1).format('YYYY-MM-DD')
let d = new Date(lastWeeksMonday)
lastWeeksSunday = new Date(d.setDate(d.getDate() - d.getDay()+7)).toISOString().substr(0,10)

Promise.all([db.getWeekWinners(3, lastWeeksMonday, lastWeeksSunday)]).then(values => {
    const [ toplist ] = values;
    db.addToWeekTable(toplist[0].id,1,moment().isoWeek()-1,lastWeeksMonday.substr(0,4),toplist[0].volume_sum)
    db.addToWeekTable(toplist[1].id,2,moment().isoWeek()-1,lastWeeksMonday.substr(0,4),toplist[1].volume_sum)
    db.addToWeekTable(toplist[2].id,3,moment().isoWeek()-1,lastWeeksMonday.substr(0,4),toplist[2].volume_sum)
}).catch(error => {
    console.error(error)
})

console.log("Populated weeks with last weeks winners")
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

//https://github.com/knex/knex/issues/2489
//https://gist.github.com/NigelEarle/70db130cc040cc2868555b29a0278261