const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// All task routes are protected
router.use(auth);

// GET / - get all tasks for current user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST / - create new task
router.post('/', async (req, res) => {
  try {
    const { subject, title, detail, dueDate, dueTime, priority } = req.body;
    const newTask = new Task({
      userId: req.user.id,
      subject,
      title,
      detail,
      dueDate,
      dueTime,
      priority
    });
    const task = await newTask.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /:id - update task
router.put('/:id', async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    task = await Task.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /:id/toggle - toggle status
router.patch('/:id/toggle', async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const completedAt = newStatus === 'completed' ? Date.now() : null;

    task.status = newStatus;
    task.completedAt = completedAt;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /:id - delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.userId.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
