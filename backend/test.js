const app = require('./server');

const req = {};
const res = {
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    if (data && data.success) {
      console.log('✅ Express health check route passed:', data);
      process.exit(0);
    } else {
      console.error('❌ Health check returned unexpected response:', data);
      process.exit(1);
    }
  }
};

const layer = app._router.stack.find(s => s.route && s.route.path === '/api/health');
if (layer) {
  layer.route.stack[0].handle(req, res);
} else {
  console.error('❌ Route /api/health not found');
  process.exit(1);
}
