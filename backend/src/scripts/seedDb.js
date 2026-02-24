require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize, User, Shift, Rota } = require('../models');

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('Database synced (tables recreated)');

    // Create admin user
    const admin = await User.create({
      email: 'admin@rota.com',
      password: 'admin123',
      name: 'Admin Manager',
      role: 'admin',
      phone: '1234567890',
      position: 'Operations Manager',
      department: 'Management',
      employee_id: 'EMP001',
      hire_date: '2020-01-15'
    });
    console.log('Admin user created:', admin.email);

    // Create sample staff users with positions
    const staff1 = await User.create({
      email: 'john@rota.com',
      password: 'staff123',
      name: 'John Smith',
      role: 'staff',
      phone: '1111111111',
      position: 'Senior Nurse',
      department: 'Emergency',
      employee_id: 'EMP002',
      hire_date: '2021-03-20',
      emergency_contact: 'Mary Smith',
      emergency_phone: '5551111111'
    });

    const staff2 = await User.create({
      email: 'jane@rota.com',
      password: 'staff123',
      name: 'Jane Doe',
      role: 'staff',
      phone: '2222222222',
      position: 'Nurse',
      department: 'Pediatrics',
      employee_id: 'EMP003',
      hire_date: '2022-06-10',
      emergency_contact: 'Tom Doe',
      emergency_phone: '5552222222'
    });

    const staff3 = await User.create({
      email: 'bob@rota.com',
      password: 'staff123',
      name: 'Bob Wilson',
      role: 'staff',
      phone: '3333333333',
      position: 'Healthcare Assistant',
      department: 'General Ward',
      employee_id: 'EMP004',
      hire_date: '2023-01-05',
      emergency_contact: 'Alice Wilson',
      emergency_phone: '5553333333'
    });

    console.log('Staff users created');

    // Create shift types
    const morningShift = await Shift.create({
      name: 'Morning',
      start_time: '06:00',
      end_time: '14:00',
      color: '#3498db'
    });

    const afternoonShift = await Shift.create({
      name: 'Afternoon',
      start_time: '14:00',
      end_time: '22:00',
      color: '#e67e22'
    });

    const nightShift = await Shift.create({
      name: 'Night',
      start_time: '22:00',
      end_time: '06:00',
      color: '#9b59b6'
    });

    console.log('Shift types created');

    // Create sample rotas for the next 7 days
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Assign shifts
      await Rota.create({
        user_id: staff1.id,
        shift_id: i % 3 === 0 ? morningShift.id : (i % 3 === 1 ? afternoonShift.id : nightShift.id),
        date: dateStr,
        created_by: admin.id
      });

      await Rota.create({
        user_id: staff2.id,
        shift_id: i % 3 === 1 ? morningShift.id : (i % 3 === 2 ? afternoonShift.id : nightShift.id),
        date: dateStr,
        created_by: admin.id
      });

      if (i % 2 === 0) {
        await Rota.create({
          user_id: staff3.id,
          shift_id: afternoonShift.id,
          date: dateStr,
          created_by: admin.id
        });
      }
    }

    console.log('Sample rotas created for next 7 days');

    console.log('\n=== Seed Complete ===');
    console.log('Admin login: admin@rota.com / admin123');
    console.log('Staff login: john@rota.com / staff123');
    console.log('Staff login: jane@rota.com / staff123');
    console.log('Staff login: bob@rota.com / staff123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
