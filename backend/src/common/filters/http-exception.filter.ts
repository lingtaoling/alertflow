import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    try {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();

      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let error = 'InternalServerError';

      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const res = exception.getResponse();
        if (typeof res === 'string') {
          message = res;
        } else if (typeof res === 'object') {
          message = (res as any).message || message;
          error = (res as any).error || error;
        }
      } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
        switch (exception.code) {
          case 'P2002':
            status = HttpStatus.CONFLICT;
            message = `Unique constraint violation on field: ${(exception.meta?.target as string[])?.join(', ')}`;
            error = 'Conflict';
            break;
          case 'P2025':
            status = HttpStatus.NOT_FOUND;
            message = 'Record not found';
            error = 'NotFound';
            break;
          case 'P2003':
            status = HttpStatus.BAD_REQUEST;
            message = 'Foreign key constraint failed';
            error = 'BadRequest';
            break;
          default:
            this.logger.error(`Prisma error: ${exception.code}`, exception.message);
        }
      } else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
        this.logger.error('Prisma unknown error', exception.message);
      } else if (exception instanceof Error) {
        this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
        message = 'An unexpected error occurred';
      } else {
        this.logger.error('Unknown exception type', String(exception));
      }

      const errorResponse = {
        statusCode: status,
        error,
        message,
        timestamp: new Date().toISOString(),
        path: request?.url ?? 'unknown',
        method: request?.method ?? 'unknown',
      };

      this.logger.error(`${request?.method ?? '?'} ${request?.url ?? '?'} → ${status}: ${message}`);

      if (!response.headersSent) {
        response.status(status).json(errorResponse);
      }
    } catch (filterError) {
      this.logger.error('Exception filter failed', filterError instanceof Error ? filterError.stack : String(filterError));
    }
  }
}
