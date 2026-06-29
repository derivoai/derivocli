/**
 * Feature gate middleware. Routes call `requireFeature('projects')` instead of
 * inspecting plans directly. The decision (plan + limits + usage) is made by
 * the Subscription Service.
 */
import { authOf, type AuthedRequest } from '../security/auth.js';
import { asyncHandler, Errors } from '../security/errors.js';
import { canUse } from './subscription-service.js';
import type { Feature } from './plans.js';

export function requireFeature(feature: Feature) {
  return asyncHandler<AuthedRequest>(async (req, _res, next) => {
    const { uid } = authOf(req);
    const decision = await canUse(uid, feature);
    if (!decision.allowed) {
      // limit === 0 means "not in your plan" (upgrade); otherwise the cap was hit.
      if (decision.limit === 0) throw Errors.paymentRequired(decision.reason);
      throw Errors.forbidden(decision.reason);
    }
    next();
  });
}
