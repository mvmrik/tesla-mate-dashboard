import { Router } from 'express';
import { exec } from 'child_process';

const router = Router();

router.post('/', (req, res) => {
  // Pull new image and restart — works when container has Docker socket mounted
  res.json({ ok: true, message: 'Update started — page will reload in ~30s' });

  // Run after response is sent
  setTimeout(() => {
    exec('docker pull mvmrik/teslamate-dashboard:latest && docker restart teslamate-dashboard', (err) => {
      if (err) console.warn('Auto-update failed:', err.message);
    });
  }, 500);
});

export default router;
