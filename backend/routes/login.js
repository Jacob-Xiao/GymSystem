const express = require('express');
const router = express.Router();
const loginService = require('../services/loginService');

// Admin login
router.post('/admin', async (req, res) => {
  try {
    const { adminAccount, adminPassword } = req.body;
    const result = await loginService.adminLogin(adminAccount, adminPassword);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Member login
router.post('/user', async (req, res) => {
  try {
    const { memberAccount, memberPassword } = req.body;
    const result = await loginService.memberLogin(memberAccount, memberPassword);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
