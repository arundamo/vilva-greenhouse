const assert = require('node:assert/strict')
const { test } = require('node:test')
const express = require('express')

test('public contact form notifications', async (t) => {
  const databasePath = require.resolve('./database')
  const emailServicePath = require.resolve('./services/emailService')
  const routerPath = require.resolve('./routes/public')
  const originalModules = [databasePath, emailServicePath, routerPath].map(path => require.cache[path])
  const savedMessages = []
  const notifications = []
  let databaseError = null
  let notificationResult = { success: true }

  require.cache[databasePath] = {
    exports: {
      run(sql, values, callback) {
        savedMessages.push({ sql, values })
        callback.call({ lastID: 42 }, databaseError)
      }
    }
  }
  require.cache[emailServicePath] = {
    exports: {
      async sendContactNotification(data, recipient) {
        notifications.push({ data, recipient })
        return notificationResult
      }
    }
  }
  delete require.cache[routerPath]
  const router = require('./routes/public')
  ;[databasePath, emailServicePath, routerPath].forEach((path, index) => {
    if (originalModules[index]) {
      require.cache[path] = originalModules[index]
    } else {
      delete require.cache[path]
    }
  })

  const app = express()
  app.use(express.json())
  app.use('/api/public', router)
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
  })
  const url = `http://127.0.0.1:${server.address().port}/api/public/contact`
  const form = {
    name: 'Contact Test',
    email: 'visitor@example.com',
    phone: '1234567890',
    subject: 'Bulk order inquiry',
    message: 'Please send availability.'
  }
  const submit = async (data) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Connection: 'close' },
      body: JSON.stringify(data)
    })
    return { status: response.status, body: await response.json() }
  }

  try {
    await t.test('saves the form and emails the fixed contact address', async () => {
      const response = await submit({ ...form, adminEmail: 'other@example.com' })
      assert.equal(response.status, 201)
      assert.equal(response.body.notificationSent, true)
      assert.equal(response.body.id, 42)
      assert.equal(savedMessages.length, 1)
      assert.deepEqual(savedMessages[0].values, Object.values(form))
      assert.deepEqual(notifications, [{
        data: { id: 42, ...form },
        recipient: 'contact@vilvagreenhouse.farm'
      }])
    })

    await t.test('reports email failure without losing the saved message', async () => {
      notificationResult = { success: false, error: 'SMTP unavailable' }
      const response = await submit(form)
      assert.equal(response.status, 201)
      assert.equal(response.body.success, true)
      assert.equal(response.body.notificationSent, false)
      assert.match(response.body.message, /saved.*could not be sent/)
      assert.match(response.body.message, /contact@vilvagreenhouse\.farm/)
      assert.equal(savedMessages.length, 2)
    })

    await t.test('rejects missing required fields before saving or emailing', async () => {
      const response = await submit({ ...form, message: '' })
      assert.equal(response.status, 400)
      assert.equal(savedMessages.length, 2)
      assert.equal(notifications.length, 2)
    })

    await t.test('does not email when saving fails', async () => {
      databaseError = new Error('Database unavailable')
      const response = await submit(form)
      assert.equal(response.status, 500)
      assert.equal(response.body.error, 'Failed to submit contact form')
      assert.equal(notifications.length, 2)
    })
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    })
  }
})
