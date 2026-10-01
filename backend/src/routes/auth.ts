import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, guestLogin } from '../services/AuthService';

const router = Router();

const RegisterSchema = z.object({
  username: z.string().min(2).max(20),
  email: z.string().email(),
  password: z.string().min(6),
});

const LoginSchema = z.object({
  usernameOrEmail: z.string(),
  password: z.string(),
});

const GuestSchema = z.object({
  username: z.string().min(2).max(20),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const result = await registerUser(
      parsed.data.username,
      parsed.data.email,
      parsed.data.password,
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  try {
    const result = await loginUser(parsed.data.usernameOrEmail, parsed.data.password);
    res.json(result);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// POST /api/auth/guest
router.post('/guest', (req: Request, res: Response) => {
  const parsed = GuestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const result = guestLogin(parsed.data.username);
  res.json(result);
});

export default router;
