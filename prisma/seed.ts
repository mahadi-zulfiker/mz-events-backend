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

    await prisma.event.createMany({
        data: [
            {
                title: 'Sunset Hike',
                description: 'Group hike to enjoy the sunset views.',
                category: 'TRAVEL',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                time: '18:00',
                location: 'Denver',
                address: 'Trailhead Rd',
                minParticipants: 2,
                maxParticipants: 10,
                joiningFee: new Prisma.Decimal(0),
                hostId: host.id,
                status: 'OPEN',
            },
            {
                title: 'Board Game Night',
                description: 'Bring your favorite board games and snacks.',
                category: 'GAMING',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
                time: '19:30',
                location: 'Chicago',
                address: '123 Game St',
                minParticipants: 2,
                maxParticipants: 8,
                joiningFee: new Prisma.Decimal(10),
                hostId: host.id,
                status: 'OPEN',
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
