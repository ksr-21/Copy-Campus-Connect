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

  it('should return 401 for GET /api/posts without token', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.statusCode).toEqual(401);
  });

  it('should return 401 for GET /api/groups without token', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.statusCode).toEqual(401);
  });

  it('should return 401 for GET /api/stories without token', async () => {
    const res = await request(app).get('/api/stories');
    expect(res.statusCode).toEqual(401);
  });

  it('should return 401 for GET /api/conversations without token', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.statusCode).toEqual(401);
  });
});
