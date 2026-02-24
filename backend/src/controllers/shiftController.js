const { Shift } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const shifts = await Shift.findAll({
      order: [['start_time', 'ASC']]
    });

    res.json({ shifts });
  } catch (error) {
    console.error('Get shifts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    res.json({ shift });
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, start_time, end_time, color } = req.body;

    const shift = await Shift.create({
      name,
      start_time,
      end_time,
      color
    });

    res.status(201).json({
      message: 'Shift created successfully',
      shift
    });
  } catch (error) {
    console.error('Create shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    const { name, start_time, end_time, color } = req.body;

    await shift.update({
      name: name || shift.name,
      start_time: start_time || shift.start_time,
      end_time: end_time || shift.end_time,
      color: color || shift.color
    });

    res.json({
      message: 'Shift updated successfully',
      shift
    });
  } catch (error) {
    console.error('Update shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const shift = await Shift.findByPk(req.params.id);

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }

    await shift.destroy();

    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Delete shift error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
