import { PrismaClient } from '@prisma/client';
import { handleUpload } from '../middleware/upload.js';
import { decorateListingWithArtwork } from '../../src/utils/listingArtwork.js';

const prisma = new PrismaClient();

const QUEUE_WINDOW_HOURS = 24;

const getConversationCounterpartyId = (message, userId) => {
  if (!message) return null;
  return message.senderId === userId ? message.receiverId : message.senderId;
};

async function getListingAndThreadContext(userId, listingId) {
  const [user, listing, latestThreadMessage] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { membershipTier: true, remainingSkips: true },
    }),
    prisma.listing.findUnique({
      where: { id: listingId },
      select: { createdAt: true, userId: true, category: true },
    }),
    prisma.message.findFirst({
      where: {
        listingId,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      select: { senderId: true, receiverId: true },
    }),
  ]);

  return {
    user,
    listing,
    latestThreadMessage,
    threadCounterpartyId: getConversationCounterpartyId(latestThreadMessage, userId),
  };
}

async function getQueueStatus(userId, listingId) {
  const { user, listing, latestThreadMessage } = await getListingAndThreadContext(userId, listingId);

  if (!listing) return { allowed: false, reason: 'listing_not_found' };
  if (!['pets', 'pet'].includes(listing.category)) return { allowed: true };
  if (listing.userId === userId) return { allowed: true };
  if (latestThreadMessage) return { allowed: true };
  if (user?.membershipTier && user.membershipTier !== 'free') return { allowed: true };

  const hoursSinceListing = (Date.now() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceListing < QUEUE_WINDOW_HOURS) {
    const hoursLeft = Math.ceil(QUEUE_WINDOW_HOURS - hoursSinceListing);
    return {
      allowed: false,
      reason: 'queue_active',
      hoursLeft,
      canSkip: (user?.remainingSkips || 0) > 0,
      remainingSkips: user?.remainingSkips || 0,
    };
  }

  return { allowed: true };
}

async function markConversationRead(userId, listingId, counterpartId) {
  if (!listingId) return { updatedCount: 0 };

  const where = {
    listingId,
    receiverId: userId,
    read: false,
  };

  if (counterpartId) {
    where.senderId = counterpartId;
  }

  const result = await prisma.message.updateMany({
    where,
    data: { read: true },
  });

  return { updatedCount: result.count };
}

async function validateConversationParticipant(userId, listingId, receiverId) {
  const [listing, latestThreadMessage] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true },
    }),
    prisma.message.findFirst({
      where: {
        listingId,
        OR: [
          {
            senderId: userId,
            receiverId,
          },
          {
            senderId: receiverId,
            receiverId: userId,
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { senderId: true, receiverId: true },
    }),
  ]);

  if (!listing) {
    return { ok: false, status: 404, error: 'Listing not found' };
  }

  if (latestThreadMessage) {
    return { ok: true, listing, existingCounterpartyId: receiverId };
  }

  if (receiverId !== listing.userId) {
    return {
      ok: false,
      status: 400,
      error: 'New conversations must start with the listing owner',
    };
  }

  return { ok: true, listing, existingCounterpartyId: null };
}

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
        listing: { select: { id: true, petName: true, breed: true, price: true, images: true, species: true } }
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
          listing: decorateListingWithArtwork(msg.listing),
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

    await markConversationRead(req.user.id, listingId, userId);

    res.json(messages);
  } catch (err) {
    next(err);
  }
};

export const checkQueue = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const access = await getQueueStatus(req.user.id, listingId);
    res.json(access);
  } catch (err) { next(err); }
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

    const conversationCheck = await validateConversationParticipant(req.user.id, listingId, receiverId);
    if (!conversationCheck.ok) {
      return res.status(conversationCheck.status).json({ error: conversationCheck.error });
    }

    let mediaUrl = null;
    let mediaType = null;

    if (req.file) {
      mediaUrl = await handleUpload(req.file, 'messages');
      mediaType = req.file.mimetype.startsWith('video/') ? req.file.mimetype : 'image';
    }

    const queueStatus = await getQueueStatus(req.user.id, listingId);
    if (!queueStatus.allowed) {
      if (queueStatus.reason !== 'queue_active' || !queueStatus.canSkip) {
        return res.status(403).json({
          error: 'queue_active',
          hoursLeft: queueStatus.hoursLeft,
          message: `This listing is in review queue. ${queueStatus.hoursLeft}h left or pay $9 to skip.`,
        });
      }
    }

    const createMessage = async (tx) => tx.message.create({
      data: {
        content: content || '',
        senderId: req.user.id,
        receiverId,
        listingId,
        mediaUrl,
        mediaType,
      },
      include: {
        sender: { select: { name: true, avatar: true } },
      },
    });

    let message;
    if (queueStatus.allowed) {
      message = await createMessage(prisma);
    } else {
      const consumedSkip = await prisma.$transaction(async (tx) => {
        const decrementResult = await tx.user.updateMany({
          where: {
            id: req.user.id,
            remainingSkips: { gt: 0 },
          },
          data: { remainingSkips: { decrement: 1 } },
        });

        if (!decrementResult.count) {
          return false;
        }

        message = await createMessage(tx);
        return true;
      });

      if (!consumedSkip) {
        return res.status(403).json({
          error: 'queue_active',
          hoursLeft: queueStatus.hoursLeft,
          message: 'No skip credits are available for this conversation.',
        });
      }
    }

    res.status(201).json(message);
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const { listingId, userId, all } = req.body || {};

    if (all) {
      const result = await prisma.message.updateMany({
        where: {
          receiverId: req.user.id,
          read: false,
        },
        data: { read: true },
      });

      return res.json({ success: true, updatedCount: result.count });
    }

    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required' });
    }

    const result = await markConversationRead(req.user.id, listingId, userId || null);
    return res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
