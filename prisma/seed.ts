import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

async function main() {
    const password = await bcrypt.hash('Password123', 10);

    const [admin, host, user] = await Promise.all([
        prisma.user.upsert({
            where: { email: 'admin@example.com' },
            update: {},
            create: {
                email: 'admin@example.com',
                fullName: 'Admin User',
                password,
                role: 'ADMIN',
            },
        }),
        prisma.user.upsert({
            where: { email: 'host@example.com' },
            update: {},
            create: {
                email: 'host@example.com',
                fullName: 'Host One',
                password,
                role: 'HOST',
                location: 'New York',
            },
        }),
        prisma.user.upsert({
            where: { email: 'user@example.com' },
            update: {},
            create: {
                email: 'user@example.com',
                fullName: 'Regular User',
                password,
                role: 'USER',
                location: 'Chicago',
            },
        }),
    ]);

    const createdEvents = await prisma.$transaction([
        prisma.event.create({
            data: {
                title: 'Sunset Hike',
                description: 'Group hike to enjoy the sunset views.',
                category: 'TRAVEL',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                time: '18:00',
                location: 'Denver',
                address: 'Trailhead Rd',
                latitude: 39.7392,
                longitude: -104.9903,
                minParticipants: 2,
                maxParticipants: 10,
                joiningFee: new Prisma.Decimal(0),
                hostId: host.id,
                status: 'OPEN',
            },
        }),
        prisma.event.create({
            data: {
                title: 'Board Game Night',
                description: 'Bring your favorite board games and snacks.',
                category: 'GAMING',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
                time: '19:30',
                location: 'Chicago',
                address: '123 Game St',
                latitude: 41.8781,
                longitude: -87.6298,
                minParticipants: 2,
                maxParticipants: 8,
                joiningFee: new Prisma.Decimal(10),
                hostId: host.id,
                status: 'OPEN',
            },
        }),
    ]);

    const hike = createdEvents[0];
    const games = createdEvents[1];

    await prisma.participant.createMany({
        data: [
            { userId: user.id, eventId: hike.id, paymentStatus: 'COMPLETED' },
            { userId: user.id, eventId: games.id, paymentStatus: 'COMPLETED', paymentId: 'pi_seed_1' },
        ],
    });

    await prisma.payment.createMany({
        data: [
            {
                userId: user.id,
                hostId: host.id,
                eventId: games.id,
                amount: new Prisma.Decimal(10),
                status: 'COMPLETED',
                paymentIntentId: 'pi_seed_1',
                description: 'Board Game Night ticket',
            },
            {
                userId: user.id,
                hostId: host.id,
                eventId: games.id,
                amount: new Prisma.Decimal(10),
                status: 'REFUNDED',
                paymentIntentId: 'pi_seed_2',
                description: 'Refunded ticket example',
                refundId: 're_seed_1',
            },
        ],
    });

    await prisma.faq.createMany({
        data: [
            {
                question: 'How do I become a host?',
                answer: 'Register with the Host role or upgrade in your profile, then create your first event from the dashboard.',
                category: 'Hosting',
            },
            {
                question: 'How are payments handled?',
                answer: 'Payments are processed via Stripe in test mode. You will see a confirmation once the card is authorized.',
                category: 'Payments',
            },
            {
                question: 'Can I refund a ticket?',
                answer: 'Reach out to the host to coordinate refunds. Admins can assist for disputes.',
                category: 'Policies',
            },
        ],
    });

    await prisma.friendship.create({
        data: { followerId: user.id, followingId: host.id },
    });

    await prisma.notification.createMany({
        data: [
            {
                userId: user.id,
                title: 'Payment received',
                body: 'Your Board Game Night ticket is confirmed.',
                type: 'PAYMENT',
            },
            {
                userId: host.id,
                title: 'New attendee joined',
                body: `${user.fullName} joined Board Game Night`,
                type: 'EVENT_UPDATE',
            },
        ],
    });

    await prisma.withdrawal.create({
        data: {
            hostId: host.id,
            amount: new Prisma.Decimal(50),
            status: 'REQUESTED',
            note: 'Weekly payout',
        },
    });

    console.log('Seeding complete', { admin: admin.email, host: host.email, user: user.email });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
