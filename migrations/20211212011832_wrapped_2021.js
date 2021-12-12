
exports.up = function(knex) {
  return knex.schema.table('users', function(t) {
    t.boolean('wrapped_2021').defaultTo(false);
  });
}

exports.down = function(knex) {
  return knex.schema.table('users', function(t) {
    t.dropColumn('wrapped_2021');
  });
}