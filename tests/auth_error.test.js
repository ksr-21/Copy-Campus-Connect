const request = require('supertest');
const app = require('../server');

describe('Authentication Error Handling (Mocked)', () => {
  it('should return "Not authorized, no token" when no authorization header is provided', async () => {
    const res = await request(app)
      .post('/api/groups')
      .send({
        name: 'Unprotected Group',
        description: 'Should fail',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Not authorized, no token');
  });

  it('should return "Not authorized" when an invalid token is provided', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', 'Bearer invalidtoken')
      .send({
        name: 'Unprotected Group',
        description: 'Should fail',
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toEqual('Not authorized');
  });
});
