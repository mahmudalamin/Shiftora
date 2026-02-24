const { Agency } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { active_only } = req.query;

    const where = {};
    if (active_only === 'true') {
      where.is_active = true;
    }

    const agencies = await Agency.findAll({
      where,
      order: [['name', 'ASC']]
    });

    res.json({ agencies });
  } catch (error) {
    console.error('Get agencies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    res.json({ agency });
  } catch (error) {
    console.error('Get agency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, contact_person, email, phone, address, notes } = req.body;

    const agency = await Agency.create({
      name,
      contact_person,
      email,
      phone,
      address,
      notes
    });

    res.status(201).json({
      message: 'Agency created successfully',
      agency
    });
  } catch (error) {
    console.error('Create agency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const { name, contact_person, email, phone, address, notes, is_active } = req.body;

    await agency.update({
      name: name !== undefined ? name : agency.name,
      contact_person: contact_person !== undefined ? contact_person : agency.contact_person,
      email: email !== undefined ? email : agency.email,
      phone: phone !== undefined ? phone : agency.phone,
      address: address !== undefined ? address : agency.address,
      notes: notes !== undefined ? notes : agency.notes,
      is_active: is_active !== undefined ? is_active : agency.is_active
    });

    res.json({
      message: 'Agency updated successfully',
      agency
    });
  } catch (error) {
    console.error('Update agency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const agency = await Agency.findByPk(req.params.id);

    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    await agency.destroy();

    res.json({ message: 'Agency deleted successfully' });
  } catch (error) {
    console.error('Delete agency error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
