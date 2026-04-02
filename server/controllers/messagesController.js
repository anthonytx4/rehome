import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getInbox = async (req, res, next) => {
  try {
    // Get all unique conversations for the current user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
        listing: { select: { id: true, petName: true, images: true, species: true } }
      }
    });

    // Group by conversation (listingId + other user)
    const conversations = {};
    messages.forEach(msg => {
      const otherUser = msg.senderId === req.user.id ? msg.receiver : msg.sender;
      const key = `${msg.listingId}-${otherUser.id}`;
      if (!conversations[key]) {
        conversations[key] = {
          listingId: msg.listingId,
          listing: { ...msg.listing, images: JSON.parse(msg.listing.images) },
          otherUser,
          lastMessage: msg,
          unreadCount: 0
        };
      }
      if (!msg.read && msg.receiverId === req.user.id) {
        conversations[key].unreadCount++;
      }
    });

    res.json(Object.values(conversations));
  } catch (err) {
    next(err);
  }
};

export const getThread = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.query; // the other user in the conversation

    if (!userId) {
      return res.status(400).json({ error: 'userId query param required' });
    }

    const messages = await prisma.message.findMany({
      where: {
        listingId,
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        listingId,
        senderId: userId,
        receiverId: req.user.id,
        read: false
      },
      data: { read: true }
    });

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, listingId, content } = req.body;
    const mediaFile = req.file;

    if (!receiverId || !listingId) {
      return res.status(400).json({ error: 'receiverId and listingId are required' });
    }

    if (!content && !mediaFile) {
      return res.status(400).json({ error: 'Message content or media is required' });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    let mediaUrl = null;
    let mediaType = null;

    if (mediaFile) {
      mediaUrl = `/uploads/messages/${mediaFile.filename}`;
      mediaType = mediaFile.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    const message = await prisma.message.create({
      data: {
        content,
        mediaUrl,
        mediaType,
        senderId: req.user.id,
        receiverId,
        listingId
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};
