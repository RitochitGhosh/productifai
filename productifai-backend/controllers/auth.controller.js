import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/db.js';
import 'dotenv/config';

// Sign up controller
export const signupController = async (req, res) => {
    try {
        const { name, email, password, avatar } = req.body;
        console.log('SIGNUPCONROLLER: Request received: ', req.body);

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            console.log("User already exists!");
            return res.status(409).json({
                success: false,
                message: "User already exists!"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                avatar: avatar || null
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true
            }
        });

        const token = jwt.sign({
            userId: user.id, email: user.email
        }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        res.status(201).json({
            success: true,
            message: "User created successfully!",
            data: {
                user,
                token
            }
        });

        // After signup logic in front-end set token in localstorage

    } catch (error) {
        console.error("SIGNUPCONTROLLER: Error: ", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error!"
        });
    }
}

// Sign in controller
export const signinController = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("SIGNIN_CONTROLLER: Request received: ", req.body);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Sign out controllelr
export const signoutController = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Signout successful'
    });

    // remove jwt token from frontend

  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
