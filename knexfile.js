// Update with your config settings.

module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './db_dev.sqlite3'
    },
    useNullAsDefault: true,
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: './db_prod.sqlite3'
    },
    useNullAsDefault: true,
  },
};
