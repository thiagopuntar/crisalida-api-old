module.exports = class BusinessError extends Error {
  constructor(message) {
    super(message);
    this.message = message;
    this.name = 'BusinessError';
  }
}