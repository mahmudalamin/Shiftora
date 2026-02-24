const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rota = sequelize.define('Rota', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  agency_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'agencies',
      key: 'id'
    }
  },
  shift_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'shifts',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'swapped'),
    defaultValue: 'active'
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'rotas',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'date']
    }
  ]
});

module.exports = Rota;
