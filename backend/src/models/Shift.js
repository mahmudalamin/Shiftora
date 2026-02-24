const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shift = sequelize.define('Shift', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#3498db',
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    }
  }
}, {
  tableName: 'shifts',
  timestamps: true,
  underscored: true
});

module.exports = Shift;
