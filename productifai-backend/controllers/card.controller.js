import { GoogleGenAI } from "@google/genai";
import { prisma } from "../utils/db.js";

// 1. Get all cards controller
export const getAllCardsController = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!"
            });
        }

        const cards = await prisma.card.findMany({
            include: {
                deck: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.status(200).json({
            success: true,
            message: "Cards retrieved successfully!",
            data: cards
        })
    } catch (error) {
        console.error('GET_ALL_CARDS_CONTROLLER: error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error!'
        });
    }
}

// 2. Get User Cards Controller
export const getUserCardsController = async (req, res) => {
    try {
        const { user_id } = req.params;
        const requestingUserId = req.user?.userId;

        if (!requestingUserId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!"
            });
        }

        if (parseInt(user_id) !== requestingUserId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden!"
            });
        }

        const cards = await prisma.card.findMany({
            where: { userId: parseInt(user_id) },
            include: {
                deck: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            message: "Cards retrieved successfully!",
            data: cards
        });

    } catch (error) {
        console.error("GET_USER_CARDS_CONTROLLER: error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error!"
        });
    }
}

// 3. Create card controller
export const createCardController = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!"
            });
        }

        const { question, answer, hint, difficulty, deckId } = req.body;
        if (!question || !answer || !deckId) {
            return res.status(400).json({
                success: false,
                message: 'Question, answer, and deck are required'
            });
        }

        const deck = await prisma.deck.findFirst({
            where: {
                id: parseInt(deckId),
                userId
            }
        });
        if (!deck) {
            return res.status(404).json({
                success: false,
                message: "Deck not found!"
            })
        }

        const card = await prisma.card.create({
            data: {
                question,
                answer,
                hint: hint || null,
                difficulty: difficulty || 'MEDIUM',
                userId: parseInt(userId),
                deckId: parseInt(deckId) // Fix -> must be parsed first
            },
            include: {
                deck: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        return res.status(201).json({
            success: true,
            message: "Card created succefully!",
            data: card
        });
    } catch (error) {
        console.error("CREATE_CARD_CONTROLLER: Error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error!"
        });
    }
}

// 4. Generate card controller -> AI
export const generateCardController = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized!" });
        }

        const { topic, count = 3, deckId } = req.body;
        if (!topic || !deckId) {
            return res.status(400).json({
                success: false,
                message: 'Topic and deck are required'
            });
        }

        const deck = await prisma.deck.findFirst({
            where: { id: parseInt(deckId), userId }
        });

        if (!deck) {
            return res.status(404).json({
                success: false,
                message: "Deck not found!"
            });
        }

        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `Generate ${count} flashcards about the topic "${topic}". Each card should have:
    - a 'question'
    - an 'answer'
    - optionally a 'hint'
    - optionally a 'difficulty'

    Return the result as a JSON array of objects like:
    [
    {
        "question": "...",
        "answer": "...",
        "hint": "...",
        "difficulty": "..."
    }
    ]`;

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        // console.log("Response from Gemini: ", result);

        // Fix: Access the text content correctly
        let textResponse;
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content) {
            textResponse = result.candidates[0].content.parts?.[0]?.text;
        }

        if (!textResponse) {
            console.error("No text response found in Gemini result");
            return res.status(500).json({
                success: false,
                message: "No response received from AI"
            });
        }

        let cardsData;
        try {
            console.log("Text Response: ", textResponse);
            const cleanedResponse = textResponse.replace(/^```json\s*/, '').replace(/\s*```$/, ''); // Added Fix...
            cardsData = JSON.parse(cleanedResponse);

        } catch (error) {
            console.error("Failed to parse AI response into JSON: ", error);
            console.log("Raw response: ", textResponse);
            return res.status(500).json({
                success: false,
                message: "Failed to validate AI response into JSON!"
            });
        }

        if (!Array.isArray(cardsData)) {
            return res.status(500).json({
                success: false,
                message: "AI response is not a valid array of cards!"
            });
        }

        const createdCards = [];
        for (const card of cardsData) {
            const createdCard = await prisma.card.create({
                data: {
                    question: card.question,
                    answer: card.answer,
                    hint: card.hint || null,
                    difficulty: card.difficulty || null,
                    userId,
                    deckId: parseInt(deckId)
                },
                include: {
                    deck: {
                        select: {
                            id: true,
                            title: true
                        }
                    }
                }
            });
            createdCards.push(createdCard);
        }

        res.status(201).json({
            success: true,
            message: "Cards generated successfully!",
            data: createdCards
        });

    } catch (error) {
        console.error("GENERATE_CARD_CONTROLLER: Error", error);
        res.status(500).json({
            success: false,
            message: "Internal server error!"
        });
    }
};

// 5. Update card controller
export const updateCardController = async (req, res) => {
    try {
        const { card_id, user_id } = req.params;
        const requestingUserId = req.user?.userId;

        if (!requestingUserId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!"
            });
        }

        if (parseInt(user_id) !== requestingUserId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden!"
            });
        }

        const { question, answer, hint, difficulty, reviewCount, lastReviewed } = req.body;

        const existingCard = await prisma.card.findFirst({
            where: {
                id: parseInt(card_id),
                userId: parseInt(user_id)
            }
        });
        if (!existingCard) {
            return res.status(404).json({
                success: false,
                message: 'Card not found'
            });
        }

        const updateData = {};
        if (question !== undefined) updateData.question = question;
        if (answer !== undefined) updateData.answer = answer;
        if (hint !== undefined) updateData.hint = hint;
        if (difficulty !== undefined) updateData.difficulty = difficulty;
        if (reviewCount !== undefined) updateData.reviewCount = reviewCount;
        if (lastReviewed !== undefined) updateData.lastReviewed = new Date(lastReviewed);

        const updatedCard = await prisma.card.update({
            where: { id: parseInt(card_id) },
            data: updateData,
            include: {
                deck: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'Card updated successfully',
            data: updatedCard
        });

    } catch (error) {
        console.error("UPDATE_CARD_CONTROLLER: error: ", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// 6. Create multiple cards controller
export const createCardsController = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!"
            });
        }

        const { cards, deckId } = req.body;
        if (!cards || !Array.isArray(cards) || !deckId) {
            return res.status(400).json({
                success: false,
                message: "Cards array and deck ID are required!"
            });
        }

        const deck = await prisma.deck.findFirst({
            where: {
                id: deckId,
                userId
            }
        });

        if (!deck) {
            return res.status(404).json({
                success: false,
                message: "Deck not found!"
            });
        }

        const createdCards = await prisma.card.createMany({
            data: cards.map((card) => ({
                question: card.question,
                answer: card.answer,
                hint: card.hint || null,
                difficulty: card.difficulty || 'MEDIUM',
                deckId,
                userId
            }))
        });

        res.status(201).json({
            success: true,
            message: `${createdCards.count} cards created successfully`,
            data: { count: createdCards.count }
        });
    } catch (error) {
        console.error("CREATE_CARDS_CONTROLLER: Error: ", error);
        res.status(500).json({
            success: false,
            message: "Internak server errror!"
        });
    }
}

// 7. Get all decks controller
export const getAllDecksController = async (req, res) => {
    try {
        const { user_id } = req.params;
        const requestingUserId = req.user?.userId;

        if (!requestingUserId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!"
            });
        }
        if (parseInt(user_id) !== requestingUserId) {
            return res.status(403).json({
                success: false,
                message: "Forbidden!"
            });
        }

        const decks = await prisma.deck.findMany({
            where: { userId: requestingUserId },
            include: {
                _count: {
                    select: {
                        cards: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        res.status(200).json({
            success: true,
            message: "Decks retrieved successfully",
            data: decks
        });
    } catch (error) {
        console.error("GET_ALL_DECKS_CONTROLLER: Error: ", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// 8. Create deck controller
export const createDeckController = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Unauthorized!"
            });
        }

        const { title, description, isPublic = false } = req.body;
        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Title is required!"
            });
        }

        const deck = await prisma.deck.create({
            data: {
                title,
                description: description || null,
                isPublic,
                userId
            },
            include: {
                _count: {
                    select: { cards: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Deck created successfully',
            data: deck
        });

    } catch (error) {
        console.error("CREATE_DECK_CONTROLLER: Error: ", error);
        res.status(500).json({
            success: false,
            message: "Internal server error!"
        })
    }
}

// 9. Delete card controllers
export const deleteCardController = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { cardId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!"
            });
        }

        if (!cardId) {
            return res.status(400).json({
                success: false,
                message: "Card ID is required"
            });
        }

        const existingCard = await prisma.card.findFirst({
            where: {
                id: parseInt(cardId),
                userId
            }
        });

        if (!existingCard) {
            return res.status(404).json({
                success: false,
                message: "Card not found"
            });
        }

        await prisma.card.delete({
            where: { id: parseInt(cardId) }
        });

        res.status(200).json({
            success: true,
            message: "Card deleted successfully"
        });

    } catch (error) {
        console.error("DELETE_CARD_CONTROLLER: Error: ", error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// 10. Delete All Cards Controller
export const deleteAllCardsController = async (req, res) => {
    try {
        const userId = (req).user?.userId;
        const { deckId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!"
            });
        }

        let whereClause = { userId };

        if (deckId) {
            const deck = await prisma.deck.findFirst({
                where: {
                    id: deckId,
                    userId
                }
            });

            if (!deck) {
                return res.status(404).json({
                    success: false,
                    message: "Deck not found"
                });
            }

            whereClause.deckId = deckId;
        }

        const deletedCards = await prisma.card.deleteMany({
            where: whereClause
        });

        res.status(200).json({
            success: true,
            message: `${deletedCards.count} cards deleted successfully`,
            data: { count: deletedCards.count }
        });

    } catch (error) {
        console.error("DELETE_ALL_CARDS: Error: ", error);
        res.status(500).json({
            success: false,
            message: "Internal server error!"
        });
    }
};