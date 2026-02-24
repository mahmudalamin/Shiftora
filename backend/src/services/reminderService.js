const { Rota, User, Shift, Notification } = require('../models');
const { Op } = require('sequelize');

const createNotification = async (userId, title, message, type, data = null) => {
  await Notification.create({
    user_id: userId,
    title,
    message,
    type,
    data
  });
};

// Check and send shift reminders
const checkShiftReminders = async () => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  try {
    // Get today's rotas with shift info
    const todayRotas = await Rota.findAll({
      where: { date: today },
      include: [
        { model: Shift, as: 'shift' },
        { model: User, as: 'user' }
      ]
    });

    for (const rota of todayRotas) {
      if (!rota.shift || !rota.user) continue;

      const shiftStart = rota.shift.start_time;
      const shiftEnd = rota.shift.end_time;

      // Calculate times for reminders
      const oneHourBefore = subtractMinutes(shiftStart, 60);
      const tenMinutesBeforeEnd = subtractMinutes(shiftEnd, 10);

      // Check if it's time for 1 hour before shift reminder
      if (isTimeMatch(currentTime, oneHourBefore)) {
        const existing = await Notification.findOne({
          where: {
            user_id: rota.user_id,
            type: 'shift_reminder_1h',
            data: { rotaId: rota.id }
          }
        });

        if (!existing) {
          await createNotification(
            rota.user_id,
            'Shift Starting Soon',
            `Your ${rota.shift.name} shift starts in 1 hour at ${shiftStart}`,
            'shift_reminder_1h',
            { rotaId: rota.id }
          );
          console.log(`Sent 1h reminder to ${rota.user.name} for ${rota.shift.name} shift`);
        }
      }

      // Check if it's time for 10 minutes before shift end reminder
      if (isTimeMatch(currentTime, tenMinutesBeforeEnd)) {
        const existing = await Notification.findOne({
          where: {
            user_id: rota.user_id,
            type: 'shift_reminder_end',
            data: { rotaId: rota.id }
          }
        });

        if (!existing) {
          await createNotification(
            rota.user_id,
            'Shift Ending Soon',
            `Your ${rota.shift.name} shift ends in 10 minutes at ${shiftEnd}`,
            'shift_reminder_end',
            { rotaId: rota.id }
          );
          console.log(`Sent end reminder to ${rota.user.name} for ${rota.shift.name} shift`);
        }
      }
    }
  } catch (error) {
    console.error('Reminder service error:', error);
  }
};

// Helper: Subtract minutes from time string (HH:MM)
const subtractMinutes = (timeStr, minutes) => {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins - minutes;
  const newHours = Math.floor(((totalMinutes % 1440) + 1440) % 1440 / 60);
  const newMins = ((totalMinutes % 60) + 60) % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

// Helper: Check if two times match (within 1 minute tolerance)
const isTimeMatch = (time1, time2) => {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  const diff = Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
  return diff <= 1;
};

// Start the reminder check interval (runs every minute)
const startReminderService = () => {
  console.log('Starting shift reminder service...');
  // Check immediately on start
  checkShiftReminders();
  // Then check every minute
  setInterval(checkShiftReminders, 60 * 1000);
};

module.exports = {
  startReminderService,
  checkShiftReminders
};
