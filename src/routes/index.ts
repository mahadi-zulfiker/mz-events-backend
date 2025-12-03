import { Router } from 'express';
import { AuthRoutes } from '../modules/Auth/auth.routes';
import { UserRoutes } from '../modules/Users/user.routes';
import { EventRoutes } from '../modules/Events/event.routes';
import { ParticipantRoutes } from '../modules/Participants/participant.routes';
import { ReviewRoutes } from '../modules/Reviews/review.routes';
import { PaymentRoutes } from '../modules/Payments/payment.routes';
import { AdminRoutes } from '../modules/Admin/admin.routes';
import { FaqRoutes } from '../modules/Faq/faq.routes';

const router = Router();

const moduleRoutes = [
    { path: '/auth', route: AuthRoutes },
    { path: '/users', route: UserRoutes },
    { path: '/events', route: EventRoutes },
    { path: '/events', route: ParticipantRoutes },
    { path: '/reviews', route: ReviewRoutes },
    { path: '/payments', route: PaymentRoutes },
    { path: '/admin', route: AdminRoutes },
    { path: '/faqs', route: FaqRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

