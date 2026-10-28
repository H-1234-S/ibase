import { Controller, Get } from '@nestjs/common';
import { API_HEALTH_PATH, API_LIVENESS_PATH, APP_NAME } from '@ibase/constants';
import type {
  ApiHealthResponse,
  ApiLivenessResponse,
} from '@ibase/shared-types';
import { DatabaseService } from './database/database.service.js';

/** Exposes process liveness and database readiness endpoints. */
@Controller()
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  /** Reports that the API process is running. */
  @Get(API_LIVENESS_PATH)
  getLiveness(): ApiLivenessResponse {
    return { service: APP_NAME, status: 'ok' };
  }

  /** Reports readiness only after PostgreSQL responds to a query. */
  @Get(API_HEALTH_PATH)
  async getReadiness(): Promise<ApiHealthResponse> {
    await this.databaseService.checkConnection();

    return {
      service: APP_NAME,
      status: 'ok',
      dependencies: { postgresql: 'ok' },
    };
  }
}
