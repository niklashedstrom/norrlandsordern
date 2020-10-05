
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {
          username: 'emilwihlander',
          hash: '$2b$10$CmVTjTWB5VW53vBkGOXAfO77kokjRVw697V0k1fuQZmg6cVPSgdJO',
          email: 'emil.wihlander@outlook.com',
          name: 'Emil Wihlander',
          admin: true,
          joined_at: '2020-09-13',
        },
        {
          username: 'emil',
          hash: '1',
          email: 'bla.bla@bla.bla',
          name: 'Emil Emilsson',
          admin: false,
          joined_at: '2020-09-13'
        }
      ]);
    });
};
