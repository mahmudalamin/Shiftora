const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SwapRequest = sequelize.define('SwapRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requester_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  target_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  requester_rota_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rotas',
      key: 'id'
    }
  },
  target_rota_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'rotas',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'approved', 'cancelled'),
    defaultValue: 'pending'
  },
  target_response: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    defaultValue: 'pending'
  },
  admin_response: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'swap_requests',
  timestamps: true,
  underscored: true
});

module.exports = SwapRequest;
