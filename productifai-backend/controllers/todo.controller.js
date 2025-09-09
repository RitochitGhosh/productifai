import { prisma } from "../utils/db";

export const getUserTodosController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { status, priority, categoryId } = req.query;

    const todos = await prisma.todo.findMany({
      where: {
        status: status,
        priority: priority,
        categoryId: categoryId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Todos retrieved successfully',
      data: todos
    });

  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create User Todo Controller
export const createUserTodosController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { title, description, priority, categoryId, dueDate } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required'
      });
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const todo = await prisma.todo.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        categoryId,
        userId,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: todo
    });

  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update User Todo Controller
export const updateUserTodosController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { id, title, description, priority, status, categoryId, dueDate } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Todo ID is required'
      });
    }

    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          userId
        }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Todo updated successfully',
      data: updatedTodo
    });

  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete User Todo Controller
export const deleteUserTodoController = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Todo ID is required'
      });
    }

    const existingTodo = await prisma.todo.findFirst({
      where: {
        id: parseInt(id),
        userId
      }
    });

    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    await prisma.todo.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Todo deleted successfully'
    });

  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};