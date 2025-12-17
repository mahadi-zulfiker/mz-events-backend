import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';

const eventImages = [
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1000&auto=format&fit=crop', // Concert
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1000&auto=format&fit=crop', // Group
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1000&auto=format&fit=crop', // Travel
    'https://images.unsplash.com/photo-1511871893393-82e9c16b8d77?q=80&w=1000&auto=format&fit=crop', // Tech
    'https://images.unsplash.com/photo-1515169067750-d51a73b051df?q=80&w=1000&auto=format&fit=crop', // Food
];

async function main() {
    console.log('🌱 Starting seed...');

    // Cleanup existing data to avoid conflicts on re-run
    try {
        await prisma.notification.deleteMany();
        await prisma.review.deleteMany();
        await prisma.payment.deleteMany();
        await prisma.participant.deleteMany();
        await prisma.event.deleteMany();
        await prisma.withdrawal.deleteMany();
        await prisma.friendship.deleteMany();
        await prisma.user.deleteMany();
        await prisma.faq.deleteMany();
        console.log('🧹 Cleaned up old data.');
    } catch (e) {
        console.log('⚠️ Cleanup might have failed slightly if tables were empty, ignoring.');
    }

    const password = await bcrypt.hash('Password123', 10);

    const [admin, host1, host2, user1, user2] = await Promise.all([
        prisma.user.create({
            data: {
                email: 'admin@example.com',
                fullName: 'Admin User',
                password,
                role: 'ADMIN',
                profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
                bio: 'System Administrator',
            },
        }),
        prisma.user.create({
            data: {
                email: 'host@example.com',
                fullName: 'Sarah Host',
                password,
                role: 'HOST',
                location: 'New York, NY',
                profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                bio: 'Professional event organizer specializing in tech meetups.',
            },
        }),
        prisma.user.create({
            data: {
                email: 'host2@example.com',
                fullName: 'Mike Experience',
                password,
                role: 'HOST',
                location: 'San Francisco, CA',
                profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
                bio: 'Outdoor adventure guide and travel expert.',
            },
        }),
        prisma.user.create({
            data: {
                email: 'user@example.com',
                fullName: 'Alex User',
                password,
                role: 'USER',
                location: 'Chicago, IL',
                profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
            },
        }),
        prisma.user.create({
            data: {
                email: 'user2@example.com',
                fullName: 'Jamie Smith',
                password,
                role: 'USER',
                location: 'Seattle, WA',
                profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie',
            },
        }),
    ]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const createdEvents = await prisma.$transaction([
        // Host 1 Events
        prisma.event.create({
            data: {
                title: 'Tech Startup Mixer 2025',
                description: 'Join us for a networking evening with local founders and VCs. Drinks and snacks provided.',
                category: 'TECH',
                date: tomorrow,
                time: '18:00',
                location: 'Innovation Hub, NY',
                address: '123 Innovation Dr, New York, NY',
                latitude: 40.7128,
                longitude: -74.0060,
                minParticipants: 10,
                maxParticipants: 50,
                joiningFee: new Prisma.Decimal(25.00),
                hostId: host1.id,
                status: 'OPEN',
                imageUrl: eventImages[3],
            },
        }),
        prisma.event.create({
            data: {
                title: 'Introduction to React Workshop',
                description: 'Hands-on workshop for beginners. Bring your laptop!',
                category: 'TECH',
                date: nextWeek,
                time: '14:00',
                location: 'Code Academy, NY',
                address: '456 Tech Lane, New York, NY',
                latitude: 40.730610,
                longitude: -73.935242,
                minParticipants: 5,
                maxParticipants: 20,
                joiningFee: new Prisma.Decimal(15.00),
                hostId: host1.id,
                status: 'OPEN',
                imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000',
            },
        }),

        // Host 2 Events
        prisma.event.create({
            data: {
                title: 'Sunset Mountain Hike',
                description: 'Easy group hike to watch the sunset. Good for all fitness levels.',
                category: 'TRAVEL',
                date: nextWeek,
                time: '16:30',
                location: 'Boulder, CO',
                address: 'Chautauqua Trailhead',
                latitude: 39.9988,
                longitude: -105.2830,
                minParticipants: 3,
                maxParticipants: 15,
                joiningFee: new Prisma.Decimal(0),
                hostId: host2.id,
                status: 'OPEN',
                imageUrl: eventImages[2],
            },
        }),
        prisma.event.create({
            data: {
                title: 'Street Food Festival Tour',
                description: 'Taste the best street food the city has to offer. Ticket includes 5 tasting vouchers.',
                category: 'FOOD',
                date: nextMonth,
                time: '11:00',
                location: 'San Francisco, CA',
                address: 'Mission District',
                latitude: 37.7599,
                longitude: -122.4148,
                minParticipants: 10,
                maxParticipants: 100,
                joiningFee: new Prisma.Decimal(45.00),
                hostId: host2.id,
                status: 'OPEN',
                imageUrl: eventImages[4],
            },
        }),
        prisma.event.create({
            data: {
                title: 'Indie Rock Concert',
                description: 'Live performance by The Local Legends.',
                category: 'CONCERT',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days from now
                time: '20:00',
                location: 'The Basement, NY',
                address: '789 Music Ave, Brooklyn, NY',
                latitude: 40.6782,
                longitude: -73.9442,
                minParticipants: 20,
                maxParticipants: 200,
                joiningFee: new Prisma.Decimal(30.00),
                hostId: host1.id,
                status: 'OPEN',
                imageUrl: eventImages[0],
            },
        }),
        prisma.event.create({
            data: {
                title: 'Sunday Morning Yoga',
                description: 'Relax and stretch in the park.',
                category: 'SPORTS',
                date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
                time: '09:00',
                location: 'Central Park, NY',
                address: 'Sheep Meadow',
                latitude: 40.7711,
                longitude: -73.9742,
                minParticipants: 5,
                maxParticipants: 30,
                joiningFee: new Prisma.Decimal(10.00),
                hostId: host2.id,
                status: 'OPEN',
                imageUrl: eventImages[1],
            },
        }),
    ]);

    // Add some participants
    await prisma.participant.createMany({
        data: [
            { userId: user1.id, eventId: createdEvents[0].id, paymentStatus: 'COMPLETED' },
            { userId: user2.id, eventId: createdEvents[0].id, paymentStatus: 'COMPLETED' },
            { userId: user1.id, eventId: createdEvents[2].id, paymentStatus: 'COMPLETED' },
        ],
    });

    console.log('✅ Seeding complete!');
    console.log(`Created: 1 Admin, 2 Hosts, 2 Users, ${createdEvents.length} Events.`);
    console.log(`Credentials:
    Admin: admin@example.com / Password123
    Host: host@example.com / Password123
    User: user@example.com / Password123`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
