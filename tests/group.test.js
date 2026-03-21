const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const jwt = require('jsonwebtoken');

describe('Group API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Connect to a test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campus-connect-test');

    // Create a test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
    });
    userId = user._id;
    token = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret');
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Group.deleteMany({});
    await mongoose.connection.close();
  });

  it('should create a new group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Group',
        description: 'Test Description',
        category: 'Tech',
        privacy: 'public',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual('Test Group');
  });

  it('should fetch all groups', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
  });
});
