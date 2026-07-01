import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkSessionExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionExists] }, async (request) => {
    const { sessionsId } = request.cookies
    const transactions = await knex('transactions')
      .where('session_id', sessionsId)
      .select()

    return { transactions }
  })

  app.get('/:id', { preHandler: [checkSessionExists] }, async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { id } = getTransactionParamsSchema.parse(request.params)

    const { sessionsId } = request.cookies

    const transactions = await knex('transactions')
      .where({
        session_id: sessionsId,
        id,
      })
      .first()

    return { transactions }
  })

  app.get('/summary', { preHandler: [checkSessionExists] }, async (request) => {
    const { sessionsId } = request.cookies
    const summary = await knex('transactions')
      .where('session_id', sessionsId)
      .sum('amount', { as: 'amount' })
      .first()

    return { summary }
  })

  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionsId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionsId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
