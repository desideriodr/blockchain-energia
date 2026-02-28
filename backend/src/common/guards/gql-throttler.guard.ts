import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

/* GqlThrottlerGuard — Rate limiting para resolvers GraphQL
 * 
 * Sobreescribe getRequestResponse() para extraer el request
 * del contexto GraphQL correctamente.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
    getRequestResponse(context: ExecutionContext) {
        const gqlCtx = GqlExecutionContext.create(context);
        const ctx = gqlCtx.getContext();

        return { req: ctx.req, res: ctx.req.res };
    }
}