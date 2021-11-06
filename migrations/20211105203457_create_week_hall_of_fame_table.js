
exports.up = function(knex) {
    return knex.schema.hasTable('weeks', (exists) => {
        if (!exists) {
            knex.schema.createTable('weeks', (table) => {
                table.increments('id').primary();
                table.integer('user_id').unsigned().notNullable().references('users.id');
                table.integer('place').unsigned().notNullable();
                table.integer('week').unsigned().notNullable();
                table.integer('year').unsigned().notNullable();
                table.integer('volume').unsigned().notNullable();
            });
        }
      });
};



exports.down = function(knex) {
    return knex.schema
        .dropTable('weeks');
};
