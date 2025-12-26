import { Duration } from "aws-cdk-lib";

export const CACHE_DURATIONS = {
  /** S3 noncurrent version expiration */
  S3_VERSION_EXPIRATION: Duration.days(30),
  /** Multipart upload abort threshold */
  MULTIPART_UPLOAD_ABORT: Duration.days(7),
  /** CloudFront default TTL */
  CLOUDFRONT_DEFAULT_TTL: Duration.days(1),
  /** CloudFront max TTL */
  CLOUDFRONT_MAX_TTL: Duration.days(365),
  /** CloudFront min TTL */
  CLOUDFRONT_MIN_TTL: Duration.hours(1),
  /** Error response TTL */
  ERROR_RESPONSE_TTL: Duration.minutes(5),
  /** DNS record TTL */
  DNS_RECORD_TTL: Duration.hours(1),
  /** HSTS max age (2 years) */
  HSTS_MAX_AGE: Duration.days(730),
  /** CloudWatch log retention */
  LOG_RETENTION: Duration.days(30),
  /** SQS DLQ retention (max 14 days) */
  SQS_DLQ_RETENTION: Duration.days(14),
} as const;

export const ALARM_THRESHOLDS = {
  /** CloudFront error rate percentage */
  ERROR_RATE_PERCENT: 5,
  /** S3 4xx error count */
  S3_ERROR_COUNT: 10,
  /** Lambda error count */
  LAMBDA_ERROR_COUNT: 1,
  /** Lambda throttle count */
  LAMBDA_THROTTLE_COUNT: 5,
  /** API Gateway 4xx error count threshold */
  API_GATEWAY_4XX_COUNT: 50,
  /** API Gateway 5xx error count threshold */
  API_GATEWAY_5XX_COUNT: 5,
  /** Evaluation periods for alarms */
  EVALUATION_PERIODS: 2,
  /** Datapoints required to trigger alarm */
  DATAPOINTS_TO_ALARM: 2,
} as const;

export const LAMBDA_CONFIG = {
  /** Contact form timeout */
  CONTACT_FORM_TIMEOUT: Duration.seconds(10),
  /** Contact form memory in MB */
  CONTACT_FORM_MEMORY: 128,
} as const;

export const ALARM_PERIODS = {
  /** Standard alarm evaluation period */
  STANDARD: Duration.minutes(5),
} as const;
