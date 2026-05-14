/**
 * Generate Postman Collection from Swagger API
 * This script generates a comprehensive Postman collection that can be used to test all API endpoints
 */

import * as fs from 'fs';
import * as path from 'path';

interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
  };
  auth: any;
  item: any[];
  variable: any[];
}

// Base URL
const BASE_URL = '{{base_url}}';

// Generate Postman collection
const collection: PostmanCollection = {
  info: {
    name: 'Demigod API - Automated Test Suite',
    description: 'Comprehensive API test collection for all Demigod endpoints',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [
      {
        key: 'token',
        value: '{{access_token}}',
        type: 'string',
      },
    ],
  },
  item: [
    // Auth Endpoints
    {
      name: 'Auth',
      item: [
        {
          name: 'Register',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: {
              raw: `${BASE_URL}/api/v1/auth/register`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'auth', 'register'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Test123!',
                phone: '+919876543210',
              }, null, 2),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 201", function () {',
                  '    pm.response.to.have.status(201);',
                  '});',
                  '',
                  'pm.test("Response has user id", function () {',
                  '    var jsonData = pm.response.json();',
                  '    pm.expect(jsonData).to.have.property("id");',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Login',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: {
              raw: `${BASE_URL}/api/v1/auth/login`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'auth', 'login'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: '{{test_email}}',
                password: '{{test_password}}',
              }, null, 2),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'pm.test("Response has tokens", function () {',
                  '    var jsonData = pm.response.json();',
                  '    pm.expect(jsonData).to.have.property("accessToken");',
                  '    pm.expect(jsonData).to.have.property("refreshToken");',
                  '    ',
                  '    // Save tokens for subsequent requests',
                  '    pm.collectionVariables.set("access_token", jsonData.accessToken);',
                  '    pm.collectionVariables.set("refresh_token", jsonData.refreshToken);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Get Profile',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/auth/profile`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'auth', 'profile'],
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'pm.test("Profile has user data", function () {',
                  '    var jsonData = pm.response.json();',
                  '    pm.expect(jsonData).to.have.property("id");',
                  '    pm.expect(jsonData).to.have.property("email");',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Refresh Token',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: {
              raw: `${BASE_URL}/api/v1/auth/refresh`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'auth', 'refresh'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                refreshToken: '{{refresh_token}}',
              }, null, 2),
            },
          },
        },
      ],
    },
    // Company Endpoints
    {
      name: 'Companies',
      item: [
        {
          name: 'Create Company',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: {
              raw: `${BASE_URL}/api/v1/companies`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'companies'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Test Company',
                email: 'company@test.com',
                phone: '+919876543210',
                gstNumber: 'GST123456789',
                panNumber: 'ABCDE1234F',
                address: {
                  street: '123 Test St',
                  city: 'Mumbai',
                  state: 'Maharashtra',
                  country: 'India',
                  postalCode: '400001',
                },
              }, null, 2),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 201", function () {',
                  '    pm.response.to.have.status(201);',
                  '});',
                  '',
                  'pm.test("Company created", function () {',
                  '    var jsonData = pm.response.json();',
                  '    pm.expect(jsonData).to.have.property("id");',
                  '    pm.collectionVariables.set("company_id", jsonData.id);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Get All Companies',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/companies`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'companies'],
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 200", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  '',
                  'pm.test("Returns array", function () {',
                  '    var jsonData = pm.response.json();',
                  '    pm.expect(jsonData).to.be.an("array");',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Get Company by ID',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/companies/{{company_id}}`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'companies', '{{company_id}}'],
            },
          },
        },
        {
          name: 'Update Company',
          request: {
            method: 'PATCH',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: {
              raw: `${BASE_URL}/api/v1/companies/{{company_id}}`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'companies', '{{company_id}}'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Updated Company Name',
              }, null, 2),
            },
          },
        },
        {
          name: 'Get Company Stats',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/companies/{{company_id}}/stats`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'companies', '{{company_id}}', 'stats'],
            },
          },
        },
      ],
    },
    // Client Endpoints
    {
      name: 'Clients',
      item: [
        {
          name: 'Create Client',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: {
              raw: `${BASE_URL}/api/v1/clients`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'clients'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                name: 'Test Client',
                email: 'client@test.com',
                phone: '+919876543210',
                aadharNumber: '123456789012',
                panNumber: 'ABCDE1234F',
                loanAmount: 50000,
                emiAmount: 5000,
                tenure: 12,
                interestRate: 12.5,
                address: {
                  street: '456 Client St',
                  city: 'Delhi',
                  state: 'Delhi',
                  country: 'India',
                  postalCode: '110001',
                },
              }, null, 2),
            },
          },
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'pm.test("Status code is 201", function () {',
                  '    pm.response.to.have.status(201);',
                  '});',
                  '',
                  'pm.test("Client created", function () {',
                  '    var jsonData = pm.response.json();',
                  '    pm.expect(jsonData).to.have.property("id");',
                  '    pm.collectionVariables.set("client_id", jsonData.id);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: 'Get All Clients',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/clients`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'clients'],
            },
          },
        },
        {
          name: 'Get Client by ID',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/clients/{{client_id}}`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'clients', '{{client_id}}'],
            },
          },
        },
      ],
    },
    // Device Endpoints
    {
      name: 'Devices',
      item: [
        {
          name: 'Get Client Devices',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/clients/{{client_id}}/devices`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'clients', '{{client_id}}', 'devices'],
            },
          },
        },
        {
          name: 'Lock Device',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: {
              raw: `${BASE_URL}/api/v1/devices/{{device_id}}/lock`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'devices', '{{device_id}}', 'lock'],
            },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                reason: 'Payment overdue',
              }, null, 2),
            },
          },
        },
        {
          name: 'Unlock Device',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: {
              raw: `${BASE_URL}/api/v1/devices/{{device_id}}/unlock`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'devices', '{{device_id}}', 'unlock'],
            },
          },
        },
      ],
    },
    // Reports Endpoints
    {
      name: 'Reports',
      item: [
        {
          name: 'Revenue Report',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/reports/revenue?startDate=2024-01-01&endDate=2024-12-31`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'reports', 'revenue'],
              query: [
                { key: 'startDate', value: '2024-01-01' },
                { key: 'endDate', value: '2024-12-31' },
              ],
            },
          },
        },
        {
          name: 'EMI Report',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/reports/emi`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'reports', 'emi'],
            },
          },
        },
        {
          name: 'User Performance Report',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: `${BASE_URL}/api/v1/reports/agents`,
              host: ['{{base_url}}'],
              path: ['api', 'v1', 'reports', 'agents'],
            },
          },
        },
      ],
    },
  ],
  variable: [
    { key: 'base_url', value: 'http://localhost:3000', type: 'string' },
    { key: 'test_email', value: 'test@example.com', type: 'string' },
    { key: 'test_password', value: 'Test123!', type: 'string' },
    { key: 'access_token', value: '', type: 'string' },
    { key: 'refresh_token', value: '', type: 'string' },
    { key: 'company_id', value: '', type: 'string' },
    { key: 'client_id', value: '', type: 'string' },
    { key: 'device_id', value: '', type: 'string' },
  ],
};

// Write collection to file
const outputPath = path.join(__dirname, '..', 'postman-collection.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));

console.log('✅ Postman collection generated successfully!');
console.log(`📁 File: ${outputPath}`);
console.log('');
console.log('To use this collection:');
console.log('1. Import it into Postman');
console.log('2. Run the "Login" request first to get access token');
console.log('3. Run other requests - they will use the saved token');
console.log('');
console.log('Or run with Newman (Postman CLI):');
console.log('  npx newman run postman-collection.json');
