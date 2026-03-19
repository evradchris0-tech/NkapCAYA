import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Intercepteur d'audit — trace les opérations sensibles dans AuditLog.
 * Utilisé en combinaison avec le décorateur @Audit().
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url } = request;

    return next.handle().pipe(
      tap(() => {
        if (user) {
          // L'écriture en AuditLog est déléguée au service métier concerné
          // cet intercepteur fournit le contexte (acteur, ip, timestamp)
          request.auditContext = {
            actorId: user.id,
            ipAddress: request.ip,
            timestamp: new Date(),
            method,
            url,
          };
        }
      }),
    );
  }
}
