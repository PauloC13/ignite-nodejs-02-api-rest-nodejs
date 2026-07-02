"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    knex.schema.alterTable('transactions', (table) => {
        table.uuid('session_id').after('id').index();
    });
}
async function down(knex) {
    knex.schema.alterTable('transactions', (table) => {
        table.dropColumn('session_id');
    });
}
