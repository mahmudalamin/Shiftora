const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShiftCancellation = sequelize.define('ShiftCancellation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  rota_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rotas',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reason: {
    type: DataTypes.ENUM('sick', 'emergency', 'personal', 'other'),
    allowNull: false
  },
  reason_details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  original_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  original_shift_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'shift_cancellations',
  timestamps: true,
  underscored: true
});

module.exports = ShiftCancellation;
