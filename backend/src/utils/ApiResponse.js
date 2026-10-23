// src/utils/ApiResponse.js
// Standard success envelope returned by every controller. Consistent shape lets
// the frontend read `payload.data` / `payload.message` / `payload.success` without
// per-route special cases.
export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    // 2xx/3xx = success. Anything >= 400 is treated as a failure by the client.
    this.success = statusCode < 400;
  }
}

export default ApiResponse;
