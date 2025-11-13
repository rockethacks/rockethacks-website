import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Warm up: 20 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '3m', target: 50 },    // Stay at 50 users
    { duration: '1m', target: 100 },   // Spike to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 200 },   // Peak load: 200 users
    { duration: '2m', target: 200 },   // Sustained peak
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests must complete below 500ms
    'http_req_failed': ['rate<0.05'],   // Error rate must be below 5%
    'errors': ['rate<0.05'],            // Custom error metric
  },
};

// Replace with your beta deployment URL
const BASE_URL = 'https://rockethacks-beta.vercel.app';

export default function () {
  // Test 1: Homepage
  group('Homepage Load', function () {
    const res = http.get(`${BASE_URL}/`);
    
    const success = check(res, {
      'homepage status is 200': (r) => r.status === 200,
      'homepage loads in <500ms': (r) => r.timings.duration < 500,
      'homepage contains RocketHacks': (r) => r.body.includes('RocketHacks'),
    });
    
    errorRate.add(!success);
    sleep(1);
  });

  // Test 2: Login page
  group('Login Page', function () {
    const res = http.get(`${BASE_URL}/login`);
    
    const success = check(res, {
      'login page status is 200': (r) => r.status === 200,
      'login page loads in <500ms': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!success);
    sleep(1);
  });

  // Test 3: Team page with images
  group('Team Page (Images)', function () {
    const res = http.get(`${BASE_URL}/team`);
    
    const success = check(res, {
      'team page status is 200': (r) => r.status === 200,
      'team page loads in <1s': (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(!success);
    sleep(1);
  });

  // Test 4: Protected route (should redirect or 401)
  group('Protected Routes', function () {
    const res = http.get(`${BASE_URL}/admin`, {
      redirects: 0, // Don't follow redirects automatically
    });
    
    const success = check(res, {
      'admin route is protected': (r) => r.status === 302 || r.status === 401,
      'redirect/error response is fast': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!success);
    sleep(1);
  });

  // Test 5: API endpoint (should be protected)
  group('API Protection', function () {
    const res = http.get(`${BASE_URL}/api/admin/applications`);
    
    const success = check(res, {
      'api route is protected': (r) => r.status === 302 || r.status === 401,
      'api response is fast': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!success);
    sleep(1);
  });

  // Test 6: Static assets
  group('Static Assets', function () {
    const res = http.get(`${BASE_URL}/_next/static/css/app/layout.css`);
    
    const success = check(res, {
      'static asset loads': (r) => r.status === 200 || r.status === 404, // 404 is ok if file doesn't exist
      'static asset is fast': (r) => r.timings.duration < 200,
      'static asset is cached': (r) => r.headers['Cache-Control'] !== undefined,
    });
    
    errorRate.add(!success);
    sleep(1);
  });

  // Random sleep between iterations (simulate real user behavior)
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Summary report
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load_test_results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors !== undefined ? options.enableColors : false;
  
  let output = '\n';
  output += '='.repeat(60) + '\n';
  output += indent + 'Load Test Summary\n';
  output += '='.repeat(60) + '\n\n';
  
  // Metrics
  const metrics = data.metrics;
  
  output += indent + 'Key Metrics:\n';
  output += indent + '  Total Requests: ' + metrics.http_reqs.values.count + '\n';
  output += indent + '  Failed Requests: ' + metrics.http_req_failed.values.passes + '\n';
  output += indent + '  Avg Response Time: ' + metrics.http_req_duration.values.avg.toFixed(2) + 'ms\n';
  output += indent + '  P95 Response Time: ' + metrics.http_req_duration.values['p(95)'].toFixed(2) + 'ms\n';
  output += indent + '  P99 Response Time: ' + metrics.http_req_duration.values['p(99)'].toFixed(2) + 'ms\n';
  output += indent + '  Error Rate: ' + (metrics.errors.values.rate * 100).toFixed(2) + '%\n';
  
  output += '\n' + '='.repeat(60) + '\n';
  
  return output;
}
