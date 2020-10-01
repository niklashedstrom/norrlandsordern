
exports.up = function(knex) {
  return knex.schema
    .createTable('users', (table) => {
      table.increments('id').primary();
      table.text('username').unique().notNullable();
      table.text('hash').notNullable();
      table.text('email').notNullable();
      table.text('name').notNullable();
      table.boolean('admin').defaultTo(false);
      table.date('joined_at');
    })
    .createTable('norrlands', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('users.id');
      table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
      table.integer('volume').unsigned().notNullable();
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('users')
    .dropTable('norrlands');
};
