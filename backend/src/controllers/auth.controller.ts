import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/database'
import { v4 as uuidv4 } from 'uuid'

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, tenantName } = req.body

    const existingUser = await query('SELECT * FROM saas.users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    const tenantId = uuidv4()
    const slug = tenantName.toLowerCase().replace(/\s+/g, '-')
    
    await query(
      'INSERT INTO saas.tenants (tenant_id, name, slug, status) VALUES ($1, $2, $3, $4)',
      [tenantId, tenantName, slug, 'trial']
    )

    const passwordHash = await bcrypt.hash(password, 12)
    const userId = uuidv4()
    
    await query(
      'INSERT INTO saas.users (user_id, tenant_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, tenantId, email, passwordHash, name, 'admin']
    )

    const token = jwt.sign(
      { userId, tenantId, email, role: 'admin' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: { userId, tenantId, email, name, role: 'admin' }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const result = await query(
      'SELECT u.*, t.name as tenant_name FROM saas.users u JOIN saas.tenants t ON u.tenant_id = t.tenant_id WHERE u.email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    await query('UPDATE saas.users SET last_login_at = NOW() WHERE user_id = $1', [user.user_id])

    const token = jwt.sign(
      { userId: user.user_id, tenantId: user.tenant_id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        userId: user.user_id,
        tenantId: user.tenant_id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantName: user.tenant_name
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
}

export const me = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    
    const result = await query(
      'SELECT u.*, t.name as tenant_name FROM saas.users u JOIN saas.tenants t ON u.tenant_id = t.tenant_id WHERE u.user_id = $1',
      [user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userData = result.rows[0]
    res.json({
      userId: userData.user_id,
      tenantId: userData.tenant_id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      tenantName: userData.tenant_name
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
}
