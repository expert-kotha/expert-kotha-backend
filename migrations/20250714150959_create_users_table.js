/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').unique().notNullable();
    table.string('gender');
    table.date('dob');
    table.string('password').notNullable();
    table.string('profile_image');
    table.boolean('is_verified').defaultTo(false);
    table.string('otp');
    table.timestamp('otp_valid_time');
    table.string('nid');
    table.string('passport_no');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
