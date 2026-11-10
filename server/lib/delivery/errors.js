export class DeliveryError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, status?: number, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = 'DeliveryError';
    this.code = opts.code || 'DELIVERY_FAILED';
    this.status = opts.status || 502;
    this.cause = opts.cause;
  }
}

export class DeliveryConfigError extends DeliveryError {
  constructor(message) {
    super(message, { code: 'DELIVERY_CONFIG', status: 500 });
    this.name = 'DeliveryConfigError';
  }
}

export class DeliveryAuthError extends DeliveryError {
  constructor(message, cause) {
    super(message, { code: 'DELIVERY_AUTH', status: 502, cause });
    this.name = 'DeliveryAuthError';
  }
}

export class DeliveryTimeoutError extends DeliveryError {
  constructor(message, cause) {
    super(message, { code: 'DELIVERY_TIMEOUT', status: 504, cause });
    this.name = 'DeliveryTimeoutError';
  }
}

export class DeliveryRecipientError extends DeliveryError {
  constructor(message, cause) {
    super(message, { code: 'DELIVERY_RECIPIENT', status: 400, cause });
    this.name = 'DeliveryRecipientError';
  }
}
