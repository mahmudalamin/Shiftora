const sequelize = require('../config/database');
const User = require('./User');
const Shift = require('./Shift');
const Rota = require('./Rota');
const SwapRequest = require('./SwapRequest');
const Notification = require('./Notification');
const ShiftCancellation = require('./ShiftCancellation');
const Agency = require('./Agency');

// Agency - Rota associations
Agency.hasMany(Rota, { foreignKey: 'agency_id', as: 'rotas' });
Rota.belongsTo(Agency, { foreignKey: 'agency_id', as: 'agency' });

// User - Rota associations
User.hasMany(Rota, { foreignKey: 'user_id', as: 'rotas' });
Rota.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Rota, { foreignKey: 'created_by', as: 'createdRotas' });
Rota.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Shift - Rota associations
Shift.hasMany(Rota, { foreignKey: 'shift_id', as: 'rotas' });
Rota.belongsTo(Shift, { foreignKey: 'shift_id', as: 'shift' });

// User - SwapRequest associations
User.hasMany(SwapRequest, { foreignKey: 'requester_id', as: 'sentSwapRequests' });
SwapRequest.belongsTo(User, { foreignKey: 'requester_id', as: 'requester' });

User.hasMany(SwapRequest, { foreignKey: 'target_id', as: 'receivedSwapRequests' });
SwapRequest.belongsTo(User, { foreignKey: 'target_id', as: 'target' });

// Rota - SwapRequest associations
Rota.hasMany(SwapRequest, { foreignKey: 'requester_rota_id', as: 'requesterSwaps' });
SwapRequest.belongsTo(Rota, { foreignKey: 'requester_rota_id', as: 'requesterRota' });

Rota.hasMany(SwapRequest, { foreignKey: 'target_rota_id', as: 'targetSwaps' });
SwapRequest.belongsTo(Rota, { foreignKey: 'target_rota_id', as: 'targetRota' });

// User - Notification associations
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ShiftCancellation associations
User.hasMany(ShiftCancellation, { foreignKey: 'user_id', as: 'cancellations' });
ShiftCancellation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Rota.hasMany(ShiftCancellation, { foreignKey: 'rota_id', as: 'cancellations' });
ShiftCancellation.belongsTo(Rota, { foreignKey: 'rota_id', as: 'rota' });

User.hasMany(ShiftCancellation, { foreignKey: 'approved_by', as: 'approvedCancellations' });
ShiftCancellation.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

module.exports = {
  sequelize,
  User,
  Shift,
  Rota,
  SwapRequest,
  Notification,
  ShiftCancellation,
  Agency
};
